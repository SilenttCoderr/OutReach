"""Shared API dependency helpers."""

from pathlib import Path

from fastapi import Depends, HTTPException, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from src.auth import require_auth
from src.config import is_admin_email
from src.database import get_db
from src.models import User

limiter = Limiter(key_func=get_remote_address)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def get_authenticated_user(user: User = Depends(require_auth)) -> User:
    """Return the authenticated user for API routes."""
    return user


def get_db_session(db: Session = Depends(get_db)) -> Session:
    """Return a database session for API routes."""
    return db


def require_admin_user(user: User = Depends(require_auth)) -> User:
    """Require admin access based on configured admin email allow-list."""
    if not is_admin_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
