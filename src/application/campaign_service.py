"""Campaign and draft/send workflow orchestration services."""

import time
from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from src.database import SessionLocal
from src.email_generator import EmailGenerator
from src.infrastructure.gmail_adapter import GmailAdapter
from src.models import Contact, EmailLog, Template, User


def _validate_contact(contact):
    errors = []
    if not contact.name:
        errors.append("Missing recruiter_name")
    if not contact.email or "@" not in contact.email:
        errors.append("Missing or invalid recruiter_email")
    if not contact.company:
        errors.append("Missing company")
    if not contact.role:
        errors.append("Missing role")
    return errors


def _validate_profile(profile):
    errors = []
    required_fields = ["full_name", "current_title", "experience_summary"]
    for field in required_fields:
        if not profile.get(field):
            errors.append(f"Missing {field} in profile")
    return errors


def _get_generator(use_llm: bool):
    if use_llm:
        from src.llm_generator import LLMEmailGenerator

        return LLMEmailGenerator()
    return EmailGenerator()


def _get_user_profile(db: Session, user_id: int) -> Dict:
    from src.models import UserProfile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        raise ValueError("Profile not set up. Complete your profile before sending emails.")
    return profile.to_dict()


def _get_owned_template(
    db: Session,
    user_id: int,
    template_id: int,
    expected_kind: str,
) -> Template:
    template = (
        db.query(Template)
        .filter(
            Template.id == template_id,
            Template.user_id == user_id,
            Template.kind == expected_kind,
        )
        .first()
    )
    if not template:
        raise LookupError(f"{expected_kind.title()} template not found")
    return template


def _render_template_placeholders(template_text: Optional[str], placeholders: Dict[str, str]) -> str:
    rendered = template_text or ""
    for key, value in placeholders.items():
        rendered = rendered.replace(f"{{{key}}}", value)
    return rendered


def _render_email_template(template: Template, contact: Contact, user_profile: Dict, has_attachments: bool) -> Dict[str, str]:
    placeholders = {
        "name": contact.name or "",
        "company": contact.company or "",
        "role": contact.role or "",
        "your_name": user_profile.get("full_name", "") or "",
    }
    subject = _render_template_placeholders(template.subject, placeholders).strip()
    body = _render_template_placeholders(template.body, placeholders).strip()

    if has_attachments:
        body = f"{body}\n\nI've attached my resume for your reference."

    return {"subject": subject, "body": body}


def _set_contact_status(db: Session, user_id: int, recipient_email: str, status: str) -> None:
    contact = (
        db.query(Contact)
        .filter(Contact.user_id == user_id, Contact.email == recipient_email)
        .first()
    )
    if contact:
        contact.status = status


def get_stats(db: Session, user: User) -> Dict[str, int]:
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


def get_history(
    db: Session,
    user_id: int,
    status: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Optional[str]]]:
    query = db.query(EmailLog).filter(EmailLog.user_id == user_id)
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


def preview_emails(
    db: Session,
    user_id: int,
    limit: int = 5,
    use_llm: bool = False,
) -> Dict:
    contacts = (
        db.query(Contact)
        .filter(Contact.user_id == user_id, Contact.status == "new")
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

    generator = _get_generator(use_llm)

    try:
        user_profile = _get_user_profile(db, user_id)
    except ValueError as e:
        return {"emails": [], "message": str(e)}

    previews = []
    any_fallback = False
    for recruiter in recruiters:
        try:
            result = generator.generate(recruiter, user_profile=user_profile)
            preview = {
                "recruiter_name": recruiter.get("recruiter_name", ""),
                "recruiter_email": recruiter.get("recruiter_email", ""),
                "company": recruiter.get("company", ""),
                "subject": result["subject"],
                "body": result["body"],
            }
            if result.get("used_fallback"):
                preview["warning"] = f"AI unavailable: {result.get('fallback_reason', 'unknown')}. Using template."
                any_fallback = True
            previews.append(preview)
        except Exception as exc:
            previews.append(
                {
                    "recruiter_name": recruiter.get("recruiter_name", ""),
                    "error": str(exc),
                }
            )

    response = {"emails": previews}
    if any_fallback:
        response["warning"] = "Some emails used template fallback because AI generation failed. Check your GEMINI_API_KEY in .env."
    return response


def create_drafts_for_new_contacts(
    db: Session,
    user: User,
    use_llm: bool,
    attachment_paths: Optional[List[str]] = None,
    template_id: Optional[int] = None,
    prompt_id: Optional[int] = None,
) -> Dict[str, object]:
    gmail = GmailAdapter(user)
    if not gmail.authenticate():
        raise PermissionError("Gmail not connected. Please login with Google again.")

    contacts = db.query(Contact).filter(Contact.user_id == user.id, Contact.status == "new").all()
    if not contacts:
        return {"success": 0, "failed": 0, "message": "No new contacts found to draft for."}

    if user.credits < len(contacts):
        raise ValueError(f"Insufficient credits. You have {user.credits} but need {len(contacts)}.")

    user_profile = _get_user_profile(db, user.id)
    selected_template = (
        _get_owned_template(db, user.id, template_id, "email") if template_id is not None else None
    )
    selected_prompt = (
        _get_owned_template(db, user.id, prompt_id, "prompt") if prompt_id is not None else None
    )
    generator = None if selected_template is not None else _get_generator(use_llm)

    success = 0
    failed = 0
    progress = []
    profile_errors = _validate_profile(user_profile)
    if profile_errors:
        print(f"Profile validation failed for user {user.id}: {profile_errors}")
        return {
            "success": 0,
            "failed": len(contacts),
            "total": len(contacts),
            "attachments": len(attachment_paths or []),
            "remaining_credits": user.credits,
            "errors": [{"contact": None, "errors": profile_errors} for _ in contacts],
            "progress": []
        }

    for contact in contacts:
        contact_errors = _validate_contact(contact)
        if contact_errors:
            print(f"Contact validation failed for contact {contact.email}: {contact_errors}")
            failed += 1
            progress.append({
                "contact": contact.email,
                "status": "failed",
                "errors": contact_errors
            })
            continue
        try:
            if selected_template is not None:
                result = _render_email_template(
                    selected_template,
                    contact,
                    user_profile,
                    has_attachments=bool(attachment_paths),
                )
            else:
                recruiter_data = {
                    "recruiter_name": contact.name,
                    "recruiter_email": contact.email,
                    "company": contact.company,
                    "role": contact.role,
                    "company_type": "unknown",
                }
                result = generator.generate(
                    recruiter_data,
                    user_profile=user_profile,
                    custom_note=selected_prompt.body if use_llm and selected_prompt else None,
                    has_attachments=bool(attachment_paths),
                )
            draft_result = gmail.create_draft(
                contact.email,
                result["subject"],
                result["body"],
                attachment_paths,
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
                        body=result.get("body"),
                        status="draft",
                        gmail_draft_id=draft_result.get("id"),
                    )
                )
                success += 1
                fallback_errors = []
                if result.get("used_fallback"):
                    fallback_errors = [f"AI fallback: {result.get('fallback_reason', 'unknown')}"]
                progress.append({
                    "contact": contact.email,
                    "status": "success",
                    "errors": fallback_errors
                })
            else:
                failed += 1
                progress.append({
                    "contact": contact.email,
                    "status": "failed",
                    "errors": ["Failed to create draft in Gmail"]
                })
        except Exception as exc:
            print(f"Exception during AI draft generation for {contact.email}: {exc}")
            failed += 1
            progress.append({
                "contact": contact.email,
                "status": "failed",
                "errors": [str(exc)]
            })

    if success > 0:
        user.credits -= success
        db.commit()

    return {
        "success": success,
        "failed": failed,
        "total": len(contacts),
        "attachments": len(attachment_paths or []),
        "remaining_credits": user.credits,
        "errors": [p for p in progress if p["status"] == "failed"],
        "progress": progress
    }


def _reconcile_draft_logs(db: Session, user_id: int) -> tuple[List[EmailLog], bool]:
    user = db.query(User).filter(User.id == user_id).first()
    logs = (
        db.query(EmailLog)
        .filter(EmailLog.user_id == user_id, EmailLog.status == "draft")
        .order_by(EmailLog.created_at.desc())
        .all()
    )

    if not user:
        return logs, False

    gmail = GmailAdapter(user)
    if not gmail.authenticate():
        return logs, False
    if not logs:
        return logs, True

    synced_logs = []
    has_changes = False
    for log in logs:
        if log.gmail_draft_id:
            draft = gmail.get_draft(log.gmail_draft_id)
            if draft and draft.get("error") == "not_found":
                log.status = "deleted"
                _set_contact_status(db, user_id, log.recipient_email, "new")
                has_changes = True
                continue
        synced_logs.append(log)

    if has_changes:
        db.commit()
        return (
            db.query(EmailLog)
            .filter(EmailLog.user_id == user_id, EmailLog.status == "draft")
            .order_by(EmailLog.created_at.desc())
            .all(),
            True,
        )

    return synced_logs, True


def get_draft_logs(db: Session, user_id: int) -> List[EmailLog]:
    """Return local drafts, reconciling deleted Gmail drafts when Gmail is available."""
    drafts, _ = _reconcile_draft_logs(db, user_id)
    return drafts


def sync_draft_logs(db: Session, user_id: int) -> Dict[str, object]:
    drafts, gmail_checked = _reconcile_draft_logs(db, user_id)
    return {
        "drafts": drafts,
        "synced_at": datetime.utcnow().isoformat() if gmail_checked else None,
        "status": "gmail_checked" if gmail_checked else "local_only",
    }


def update_draft(db: Session, user: User, draft_id: int, subject: str, body: str) -> Dict[str, str]:
    log = db.query(EmailLog).filter(EmailLog.id == draft_id, EmailLog.user_id == user.id).first()
    if not log:
        raise LookupError("Draft not found locally")

    gmail = GmailAdapter(user)
    if not gmail.authenticate():
        raise PermissionError("Gmail authentication failed")

    if not log.gmail_draft_id:
        raise ValueError("Cannot update draft because it lacks a Gmail ID")

    gmail.update_draft(log.gmail_draft_id, log.recipient_email, subject, body, None)

    log.subject = subject
    log.body = body
    db.commit()
    return {"status": "success", "message": "Draft updated"}


def delete_draft(db: Session, user: User, draft_id: int) -> Dict[str, str]:
    log = db.query(EmailLog).filter(EmailLog.id == draft_id, EmailLog.user_id == user.id).first()
    if not log:
        raise LookupError("Draft not found locally")

    gmail = GmailAdapter(user)
    if not gmail.authenticate():
        raise PermissionError("Gmail authentication failed")

    if log.gmail_draft_id:
        gmail.delete_draft(log.gmail_draft_id)

    log.status = "deleted"
    _set_contact_status(db, user.id, log.recipient_email, "new")
    db.commit()
    return {"status": "success"}


def send_draft_by_id(db: Session, user: User, draft_id: int) -> Dict[str, str]:
    log = db.query(EmailLog).filter(EmailLog.id == draft_id, EmailLog.user_id == user.id).first()
    if not log:
        raise LookupError("Draft not found")

    gmail = GmailAdapter(user)
    if not gmail.authenticate():
        raise PermissionError("Gmail authentication failed")

    if not log.gmail_draft_id:
        log.status = "failed"
        _set_contact_status(db, user.id, log.recipient_email, "failed")
        db.commit()
        raise ValueError("Draft ID missing for this email.")

    try:
        sent_message = gmail.send_draft(log.gmail_draft_id)
    except Exception as exc:
        log.status = "failed"
        _set_contact_status(db, user.id, log.recipient_email, "failed")
        db.commit()
        raise RuntimeError(f"Failed to send draft via Gmail API: {exc}") from exc

    if not sent_message:
        log.status = "failed"
        _set_contact_status(db, user.id, log.recipient_email, "failed")
        db.commit()
        raise RuntimeError("Failed to send draft via Gmail API")

    log.status = "sent"
    log.sent_at = datetime.utcnow()
    _set_contact_status(db, user.id, log.recipient_email, "sent")
    db.commit()
    return {"status": "sent", "message_id": sent_message["id"]}


def get_draft_ids(db: Session, user_id: int) -> List[int]:
    drafts = db.query(EmailLog).filter(EmailLog.user_id == user_id, EmailLog.status == "draft").all()
    return [draft.id for draft in drafts]


def send_drafts_batch(user_id: int, draft_ids: List[int], delay_seconds: int) -> None:
    db_session = SessionLocal()
    try:
        user = db_session.query(User).filter(User.id == user_id).first()
        if not user:
            return

        gmail = GmailAdapter(user)
        if not gmail.authenticate():
            print(f"Batch send failed: Gmail auth failed for user_id={user_id}")
            return

        for draft_id in draft_ids:
            log = None
            try:
                log = (
                    db_session.query(EmailLog)
                    .filter(EmailLog.id == draft_id, EmailLog.user_id == user_id)
                    .first()
                )
                if not log:
                    continue

                if not log.gmail_draft_id:
                    log.status = "failed"
                    _set_contact_status(db_session, user_id, log.recipient_email, "failed")
                    db_session.commit()
                    continue

                result = gmail.send_draft(log.gmail_draft_id)
                if result:
                    log.status = "sent"
                    log.sent_at = datetime.utcnow()
                    _set_contact_status(db_session, user_id, log.recipient_email, "sent")
                    print(f"Sent: {log.recipient_email}")
                else:
                    log.status = "failed"
                    _set_contact_status(db_session, user_id, log.recipient_email, "failed")

                db_session.commit()

                if delay_seconds > 0:
                    time.sleep(delay_seconds)
            except Exception as exc:
                if log:
                    log.status = "failed"
                    _set_contact_status(db_session, user_id, log.recipient_email, "failed")
                    db_session.commit()
                print(f"Error sending draft id {draft_id}: {exc}")
    finally:
        db_session.close()


def clear_tracking_records(db: Session, user_id: int) -> Dict[str, int | str]:
    """Clear canonical DB-backed tracking state for a user.

    This resets campaign state to allow a clean re-run without relying on legacy
    file-based tracker storage.
    """

    cleared_logs = (
        db.query(EmailLog)
        .filter(EmailLog.user_id == user_id)
        .delete(synchronize_session=False)
    )

    reset_contacts = (
        db.query(Contact)
        .filter(Contact.user_id == user_id, Contact.status != "new")
        .update({Contact.status: "new"}, synchronize_session=False)
    )

    db.commit()

    return {
        "status": "cleared",
        "email_logs_removed": cleared_logs,
        "contacts_reset": reset_contacts,
    }
