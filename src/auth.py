"""Authentication module with Google OAuth and JWT."""

import hashlib
import os
from datetime import datetime, timedelta
from typing import Optional

from authlib.integrations.starlette_client import OAuth
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import User

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password with bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed)


# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose",
        "prompt": "consent",  # Force consent to get refresh token
        "access_type": "offline",
    },
)

security = HTTPBearer(auto_error=False)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_login_token(user: User) -> str:
    """Access token bound to the user's current password hash (see get_current_user)."""
    return create_access_token(
        {"sub": str(user.id), "pf": password_fingerprint(user.password_hash)}
    )


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# Password-reset tokens: short-lived, single-purpose. The "type" claim keeps
# them from being usable as access tokens (and vice-versa). The "pf" claim binds
# the token to the password hash present at issuance, so once the password is
# changed the token can't be replayed (the fingerprint no longer matches).
RESET_TOKEN_EXPIRE_MINUTES = 30


def password_fingerprint(password_hash: Optional[str]) -> str:
    """Short, non-reversible fingerprint of a password hash, for token binding."""
    return hashlib.sha256((password_hash or "").encode("utf-8")).hexdigest()[:16]


def create_reset_token(user_id: int, password_hash: Optional[str]) -> str:
    """Create a short-lived, single-use JWT for password reset."""
    expire = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {
            "sub": str(user_id),
            "type": "reset",
            "pf": password_fingerprint(password_hash),
            "exp": expire,
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def verify_reset_token(token: str) -> Optional[dict]:
    """Verify a password-reset token.

    Returns {"user_id": int, "pf": str} or None if invalid/expired. The caller
    must still confirm "pf" matches the user's current password fingerprint to
    enforce single use.
    """
    payload = verify_token(token)
    if not payload or payload.get("type") != "reset":
        return None
    sub = payload.get("sub")
    try:
        user_id = int(sub) if sub is not None else None
    except (TypeError, ValueError):
        return None
    if user_id is None:
        return None
    return {"user_id": user_id, "pf": payload.get("pf")}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Get the current authenticated user from JWT token."""
    if not credentials:
        return None
    
    payload = verify_token(credentials.credentials)
    if not payload:
        return None

    # Reset tokens are not valid for authenticating API requests.
    if payload.get("type") == "reset":
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        return None

    # Sessions die when the password changes: tokens carry a fingerprint of the
    # password hash at issuance. Tokens minted before this feature have no "pf"
    # claim and are grandfathered in (no forced logout on deploy).
    token_pf = payload.get("pf")
    if token_pf is not None and token_pf != password_fingerprint(user.password_hash):
        return None
    return user


def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Require authentication - raises 401 if not authenticated."""
    user = get_current_user(credentials, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_or_create_user(
    db: Session, 
    email: str, 
    name: str = None, 
    picture: str = None, 
    google_id: str = None,
    access_token: str = None,
    refresh_token: str = None,
    token_expiry: datetime = None
) -> User:
    """Get existing user or create new one."""
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        # Update last login
        user.last_login = datetime.utcnow()
        if name and not user.name:
            user.name = name
        if picture:
            user.picture = picture
        if google_id and not user.google_id:
            user.google_id = google_id
        
        # Update tokens
        if access_token:
            user.access_token = access_token
        if refresh_token:
            user.refresh_token = refresh_token
        if token_expiry:
            user.token_expiry = token_expiry
            
        db.commit()
        return user
    
    # Create new user
    user = User(
        email=email,
        name=name,
        picture=picture,
        google_id=google_id,
        access_token=access_token,
        refresh_token=refresh_token,
        token_expiry=token_expiry,
        credits=10,  # Free credits for new users
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
