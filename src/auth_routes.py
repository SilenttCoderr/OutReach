"""Authentication API routes."""

import logging
import os
from urllib.parse import urlencode
from fastapi import APIRouter, BackgroundTasks, Depends, Request, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import User
from src.config import is_admin_email
from src.auth import (
    oauth,
    create_login_token,
    create_reset_token,
    password_fingerprint,
    verify_reset_token,
    get_current_user,
    require_auth,
    get_or_create_user,
    hash_password,
    verify_password,
)
from src.infrastructure.resend_adapter import ResendAdapter
from src.schemas.auth import (
    AuthStatusResponse,
    AuthTokenResponse,
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    UserMeResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)

# Frontend URL for redirects
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register", response_model=AuthTokenResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Register with email and password. Returns JWT on success."""
    existing = db.query(User).filter(User.email == body.email.strip().lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=body.email.strip().lower(),
        name=body.name.strip() or None,
        password_hash=hash_password(body.password),
        credits=10,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_login_token(user)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login", response_model=AuthTokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password. Returns JWT on success. Google-only users have no password."""
    user = db.query(User).filter(User.email == body.email.strip().lower()).first()
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_login_token(user)
    return {"access_token": token, "token_type": "bearer"}


def _send_reset_email(to_email: str, name: str, reset_url: str) -> None:
    """Build and send the reset email. Runs as a background task so the HTTP
    response time does not leak whether an account exists (timing enumeration)."""
    html = (
        f"<p>Hi {name or 'there'},</p>"
        f"<p>We received a request to reset your OutReach password. "
        f"This link expires in 30 minutes.</p>"
        f'<p><a href="{reset_url}">Reset your password</a></p>'
        f"<p>If you didn't request this, you can safely ignore this email.</p>"
    )
    ResendAdapter().send(to=to_email, subject="Reset your OutReach password", html=html)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    body: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Email a password-reset link. Always 200 — never reveal whether an email exists."""
    generic = {"message": "If an account with that email exists, a reset link has been sent."}
    email = body.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    # Skip silently for unknown emails and Google-only accounts (no password to reset).
    if not user or not user.password_hash:
        return generic

    # Bind the token to the current password hash so it becomes single-use:
    # once the password changes, the embedded fingerprint no longer matches.
    token = create_reset_token(user.id, user.password_hash)
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    background_tasks.add_task(_send_reset_email, user.email, user.name or "", reset_url)
    return generic


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Consume a reset token and set a new password."""
    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )
    invalid = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid or expired reset link",
    )
    data = verify_reset_token(body.token)
    if data is None:
        raise invalid
    user = db.query(User).filter(User.id == data["user_id"]).first()
    if not user or not user.password_hash:
        raise invalid
    # Enforce single use: the token's fingerprint must still match the current
    # password hash. A previously-used token fails here (hash already rotated).
    if data.get("pf") != password_fingerprint(user.password_hash):
        raise invalid
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"message": "Password updated. You can now log in."}


@router.get("/google")
async def google_login(request: Request):
    """Initiate Google OAuth flow."""
    redirect_uri = str(request.url_for("google_callback"))
    # Force HTTPS when running in production (behind Render's proxy)
    if FRONTEND_URL.startswith("https://") and redirect_uri.startswith("http://"):
        redirect_uri = redirect_uri.replace("http://", "https://", 1)
    
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback."""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Could not get user info")
        
        # Extract token data
        access_token = token.get("access_token")
        refresh_token = token.get("refresh_token")
        expires_at = token.get("expires_at")
        token_expiry = None
        if expires_at:
            from datetime import datetime
            token_expiry = datetime.fromtimestamp(expires_at)
        
        # Get or create user in database
        user = get_or_create_user(
            db=db,
            email=user_info.get("email"),
            name=user_info.get("name"),
            picture=user_info.get("picture"),
            google_id=user_info.get("sub"),
            access_token=access_token,
            refresh_token=refresh_token,
            token_expiry=token_expiry,
        )
        
        # Create JWT token
        access_token = create_login_token(user)
        
        # Redirect to frontend with token
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/callback?{urlencode({'token': access_token})}"
        )
    except Exception:
        # Do not interpolate raw provider errors into a URL. Besides exposing
        # internals, percent characters can make Next's query parser throw.
        logger.exception("Google OAuth callback failed")
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?{urlencode({'error': 'Google sign-in failed. Please try again.'})}"
        )


@router.get("/me", response_model=UserMeResponse)
async def get_me(user: User = Depends(require_auth)):
    """Get current authenticated user."""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name or "",
        "credits": user.credits,
        "is_admin": is_admin_email(user.email),
    }


@router.get("/status", response_model=AuthStatusResponse)
async def auth_status(user: User = Depends(get_current_user)):
    """Check if user is authenticated."""
    if user:
        return {
            "authenticated": True,
            "email": user.email,
            "credits": user.credits,
            "gmail_connected": bool(user.access_token),
            "is_admin": is_admin_email(user.email),
        }
    return {"authenticated": False, "gmail_connected": False}


@router.post("/logout")
async def logout():
    """Logout user (client-side token removal)."""
    return {"message": "Logged out successfully"}
