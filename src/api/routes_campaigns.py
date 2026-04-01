"""Campaign and email workflow API routes."""

from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from src.application import campaign_service
from src.api.dependencies import UPLOAD_DIR, get_authenticated_user, get_db_session, limiter
from src.models import User

router = APIRouter(tags=["Campaigns"])


@router.get("/stats")
async def get_stats(
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Get email tracking statistics and current user credits."""
    return campaign_service.get_stats(db, user)


@router.get("/history")
async def get_history(
    status: Optional[str] = None,
    limit: int = 50,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Get email history from database."""
    return campaign_service.get_history(db, user.id, status=status, limit=limit)


@router.get("/preview")
async def preview_emails(
    limit: int = 5,
    use_llm: bool = False,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Preview generated emails for new contacts."""
    return campaign_service.preview_emails(db, user.id, limit=limit, use_llm=use_llm)


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
    try:
        return campaign_service.create_drafts_for_new_contacts(
            db,
            user,
            use_llm=use_llm_bool,
            attachment_paths=attachment_paths if attachment_paths else None,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except ValueError as exc:
        message = str(exc)
        status_code = 402 if message.startswith("Insufficient credits") else 400
        raise HTTPException(status_code=status_code, detail=message) from exc


@router.get("/drafts")
async def get_drafts(
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Get all drafted emails for the user."""
    return campaign_service.get_draft_logs(db, user.id)


@router.post("/send/{draft_id}")
@limiter.limit("20/minute")
async def send_draft(
    request: Request,
    draft_id: int,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Send a drafted email."""
    try:
        return campaign_service.send_draft_by_id(db, user, draft_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
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
    draft_ids = campaign_service.get_draft_ids(db, user.id)
    if not draft_ids:
        return {"queued": 0, "message": "No drafts to send"}

    background_tasks.add_task(campaign_service.send_drafts_batch, user.id, draft_ids, delay_seconds)

    return {
        "queued": len(draft_ids),
        "delay_seconds": delay_seconds,
        "message": f"Sending {len(draft_ids)} emails in background with {delay_seconds}s delay between each",
    }


@router.post("/clear-tracking")
async def clear_tracking():
    """Clear all tracking records to allow re-sending."""
    return campaign_service.clear_tracking_records()
