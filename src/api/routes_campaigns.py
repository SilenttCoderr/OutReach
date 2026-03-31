"""Campaign and email workflow API routes."""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from src.api.dependencies import UPLOAD_DIR, get_authenticated_user, get_db_session, limiter
from src.email_generator import EmailGenerator
from src.gmail_client import GmailClient
from src.models import Contact, EmailLog, User
from src.tracker import EmailTracker

router = APIRouter(tags=["Campaigns"])


@router.get("/stats")
async def get_stats(
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Get email tracking statistics and current user credits."""
    from sqlalchemy import func

    total = db.query(func.count(EmailLog.id)).filter(EmailLog.user_id == user.id).scalar() or 0
    sent = (
        db.query(func.count(EmailLog.id))
        .filter(EmailLog.user_id == user.id, EmailLog.status == "sent")
        .scalar()
        or 0
    )
    draft = (
        db.query(func.count(EmailLog.id))
        .filter(EmailLog.user_id == user.id, EmailLog.status == "draft")
        .scalar()
        or 0
    )
    failed = (
        db.query(func.count(EmailLog.id))
        .filter(EmailLog.user_id == user.id, EmailLog.status == "failed")
        .scalar()
        or 0
    )
    pending = total - sent - draft - failed
    pending = pending if pending > 0 else 0

    return {
        "credits_available": user.credits,
        "total_sent": sent,
        "total_drafted": draft,
        "pending": pending,
        "failed_emails": failed,
    }


@router.get("/history")
async def get_history(
    status: Optional[str] = None,
    limit: int = 50,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Get email history from database."""
    query = db.query(EmailLog).filter(EmailLog.user_id == user.id)
    if status:
        query = query.filter(EmailLog.status == status)
    logs = query.order_by(EmailLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "recipient_email": log.recipient_email,
            "recipient_name": log.recipient_name,
            "company": log.company,
            "subject": log.subject,
            "status": log.status,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "sent_at": log.sent_at.isoformat() if log.sent_at else None,
        }
        for log in logs
    ]


@router.get("/preview")
async def preview_emails(
    limit: int = 5,
    use_llm: bool = False,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Preview generated emails for new contacts."""
    contacts = (
        db.query(Contact)
        .filter(Contact.user_id == user.id, Contact.status == "new")
        .limit(limit)
        .all()
    )

    if not contacts:
        return {"emails": [], "message": "No new contacts found. Please upload a CSV first."}

    recruiters = [
        {
            "recruiter_name": contact.name,
            "recruiter_email": contact.email,
            "company": contact.company,
            "role": contact.role,
            "company_type": "unknown",
        }
        for contact in contacts
    ]

    if use_llm:
        from src.llm_generator import LLMEmailGenerator

        generator = LLMEmailGenerator()
    else:
        generator = EmailGenerator()

    previews = []
    for recruiter in recruiters:
        try:
            result = generator.generate(recruiter)
            previews.append(
                {
                    "recruiter_name": recruiter.get("recruiter_name", ""),
                    "recruiter_email": recruiter.get("recruiter_email", ""),
                    "company": recruiter.get("company", ""),
                    "subject": result["subject"],
                    "body": result["body"],
                }
            )
        except Exception as exc:
            previews.append(
                {
                    "recruiter_name": recruiter.get("recruiter_name", ""),
                    "error": str(exc),
                }
            )

    return {"emails": previews}


@router.post("/draft")
@limiter.limit("20/minute")
async def create_drafts(
    request: Request,
    use_llm: str = Form("false"),
    attachments: List[UploadFile] = File(default=[]),
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Create Gmail drafts for all new contacts."""
    use_llm_bool = use_llm.lower() in ("true", "1", "yes", "on")
    has_attachments = len(attachments) > 0

    gmail_client = GmailClient(user=user)
    if not gmail_client.authenticate():
        raise HTTPException(status_code=401, detail="Gmail not connected. Please login with Google again.")

    contacts = db.query(Contact).filter(Contact.user_id == user.id, Contact.status == "new").all()
    if not contacts:
        return {"success": 0, "failed": 0, "message": "No new contacts found to draft for."}

    if user.credits < len(contacts):
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient credits. You have {user.credits} but need {len(contacts)}.",
        )

    attachment_paths: List[str] = []
    if has_attachments:
        user_att_dir = UPLOAD_DIR / str(user.id) / "attachments"
        user_att_dir.mkdir(parents=True, exist_ok=True)
        for attachment in attachments:
            if attachment.filename:
                attachment_path = user_att_dir / attachment.filename
                with open(attachment_path, "wb") as f:
                    import shutil

                    shutil.copyfileobj(attachment.file, f)
                attachment_paths.append(str(attachment_path))

    if use_llm_bool:
        from src.llm_generator import LLMEmailGenerator

        generator = LLMEmailGenerator()
    else:
        generator = EmailGenerator()

    success = 0
    failed = 0
    for contact in contacts:
        try:
            recruiter_data = {
                "recruiter_name": contact.name,
                "recruiter_email": contact.email,
                "company": contact.company,
                "role": contact.role,
                "company_type": "unknown",
            }
            result = generator.generate(recruiter_data, has_attachments=has_attachments)
            draft_result = gmail_client.create_draft(
                contact.email,
                result["subject"],
                result["body"],
                attachment_paths if attachment_paths else None,
            )
            if draft_result:
                contact.status = "draft"
                db.add(
                    EmailLog(
                        user_id=user.id,
                        recipient_email=contact.email,
                        recipient_name=contact.name,
                        company=contact.company,
                        subject=result["subject"],
                        status="draft",
                        gmail_draft_id=draft_result.get("id"),
                    )
                )
                success += 1
            else:
                failed += 1
        except Exception as exc:
            print(f"Error creating draft: {exc}")
            failed += 1

    if success > 0:
        user.credits -= success
        db.commit()

    return {
        "success": success,
        "failed": failed,
        "total": len(contacts),
        "attachments": len(attachment_paths),
        "remaining_credits": user.credits,
    }


@router.get("/drafts")
async def get_drafts(
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Get all drafted emails for the user."""
    drafts = (
        db.query(EmailLog)
        .filter(EmailLog.user_id == user.id, EmailLog.status == "draft")
        .order_by(EmailLog.created_at.desc())
        .all()
    )
    return drafts


@router.post("/send/{draft_id}")
@limiter.limit("20/minute")
async def send_draft(
    request: Request,
    draft_id: int,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Send a drafted email."""
    log = db.query(EmailLog).filter(EmailLog.id == draft_id, EmailLog.user_id == user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Draft not found")

    gmail_client = GmailClient(user=user)
    if not gmail_client.authenticate():
        raise HTTPException(status_code=401, detail="Gmail authentication failed")

    try:
        if not log.gmail_draft_id:
            raise HTTPException(status_code=400, detail="Draft ID missing for this email.")

        sent_msg = gmail_client.send_draft(log.gmail_draft_id)
        if sent_msg:
            log.status = "sent"
            log.sent_at = datetime.utcnow()
            db.commit()
            return {"status": "sent", "message_id": sent_msg["id"]}
        raise HTTPException(status_code=500, detail="Failed to send draft via Gmail API")
    except Exception as exc:
        print(f"Error sending draft: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/send-all")
@limiter.limit("20/minute")
async def send_all_drafts(
    request: Request,
    background_tasks: BackgroundTasks,
    delay_seconds: int = 30,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Send all drafted emails with rate limiting."""
    drafts = db.query(EmailLog).filter(EmailLog.user_id == user.id, EmailLog.status == "draft").all()
    if not drafts:
        return {"queued": 0, "message": "No drafts to send"}

    def batch_send_task() -> None:
        import time

        from src.database import SessionLocal
        from src.gmail_client import GmailClient as DraftGmailClient
        from src.models import EmailLog as EmailLogModel
        from src.models import User as UserModel

        db_session = SessionLocal()
        try:
            user_obj = db_session.query(UserModel).filter(UserModel.id == user.id).first()
            gmail = DraftGmailClient(user=user_obj)
            if not gmail.authenticate():
                print(f"Batch send failed: Gmail auth failed for {user_obj.email}")
                return

            for draft in drafts:
                try:
                    log = db_session.query(EmailLogModel).filter(EmailLogModel.id == draft.id).first()
                    if log and log.gmail_draft_id:
                        result = gmail.send_draft(log.gmail_draft_id)
                        if result:
                            log.status = "sent"
                            log.sent_at = datetime.utcnow()
                            db_session.commit()
                            print(f"Sent: {log.recipient_email}")
                        time.sleep(delay_seconds)
                except Exception as exc:
                    print(f"Error sending {draft.recipient_email}: {exc}")
        finally:
            db_session.close()

    background_tasks.add_task(batch_send_task)

    return {
        "queued": len(drafts),
        "delay_seconds": delay_seconds,
        "message": f"Sending {len(drafts)} emails in background with {delay_seconds}s delay between each",
    }


@router.post("/clear-tracking")
async def clear_tracking():
    """Clear all tracking records to allow re-sending."""
    tracker = EmailTracker()
    tracker.records = {}
    tracker._save()
    return {"status": "cleared"}
