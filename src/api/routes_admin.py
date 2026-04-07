"""Admin-only API routes for operational controls and platform metrics."""

from datetime import datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.api.dependencies import get_db_session, require_admin_user
from src.models import Contact, EmailLog, User

router = APIRouter(prefix="/admin", tags=["Admin"])


class CreditUpdatePayload(BaseModel):
    operation: Literal["add", "set"] = "add"
    amount: int


def _serialize_user(user: User, now: datetime) -> dict:
    last_login = user.last_login
    is_live = bool(last_login and last_login >= now - timedelta(days=30))

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "credits": user.credits or 0,
        "gmail_connected": bool(user.access_token),
        "is_live": is_live,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": last_login.isoformat() if last_login else None,
    }


@router.get("/overview")
async def admin_overview(
    _: User = Depends(require_admin_user),
    db: Session = Depends(get_db_session),
):
    """Return admin overview metrics and user summaries."""
    now = datetime.utcnow()
    live_cutoff = now - timedelta(days=30)

    total_users = db.query(func.count(User.id)).scalar() or 0
    live_accounts = db.query(func.count(User.id)).filter(User.last_login >= live_cutoff).scalar() or 0
    gmail_connected_accounts = db.query(func.count(User.id)).filter(User.access_token.isnot(None)).scalar() or 0
    total_contacts = db.query(func.count(Contact.id)).scalar() or 0
    total_sent = db.query(func.count(EmailLog.id)).filter(EmailLog.status == "sent").scalar() or 0
    total_drafts = db.query(func.count(EmailLog.id)).filter(EmailLog.status == "draft").scalar() or 0
    total_credits = db.query(func.sum(User.credits)).scalar() or 0

    users = db.query(User).order_by(User.created_at.desc()).limit(250).all()

    return {
        "metrics": {
            "total_users": total_users,
            "live_accounts_30d": live_accounts,
            "gmail_connected_accounts": gmail_connected_accounts,
            "total_contacts": total_contacts,
            "total_sent_emails": total_sent,
            "total_draft_emails": total_drafts,
            "total_credits": total_credits,
        },
        "users": [_serialize_user(user, now) for user in users],
    }


@router.patch("/users/{user_id}/credits")
async def update_user_credits(
    user_id: int,
    payload: CreditUpdatePayload,
    _: User = Depends(require_admin_user),
    db: Session = Depends(get_db_session),
):
    """Add or set credits for a specific user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    current = user.credits or 0
    if payload.operation == "set":
        next_credits = max(0, payload.amount)
    else:
        next_credits = max(0, current + payload.amount)

    user.credits = next_credits
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "credits": user.credits,
    }
