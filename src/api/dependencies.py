"""Shared API dependency helpers."""

from pathlib import Path

from fastapi import Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from src.auth import require_auth
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
