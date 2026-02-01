"""Authentication API routes."""

import os
from fastapi import APIRouter, Depends, Request, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import User
from src.auth import (
    oauth,
    create_access_token,
    get_current_user,
    require_auth,
    get_or_create_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Frontend URL for redirects
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
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
    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login")
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
    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/google")
async def google_login(request: Request):
    """Initiate Google OAuth flow."""
    redirect_uri = request.url_for("google_callback")
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
        access_token = create_access_token(data={"sub": str(user.id)})
        
        # Redirect to frontend with token
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/callback?token={access_token}"
        )
    except Exception as e:
        # Redirect to login with error
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error={str(e)}"
        )


@router.get("/me")
async def get_me(user: User = Depends(require_auth)):
    """Get current authenticated user."""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "credits": user.credits,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.get("/status")
async def auth_status(user: User = Depends(get_current_user)):
    """Check if user is authenticated."""
    if user:
        return {
            "authenticated": True,
            "email": user.email,
            "credits": user.credits,
        }
    return {"authenticated": False}


@router.post("/logout")
async def logout():
    """Logout user (client-side token removal)."""
    return {"message": "Logged out successfully"}
