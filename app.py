import os
from typing import Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.sessions import SessionMiddleware

from src.api.dependencies import limiter
from src.api.routes_admin import router as admin_router
from src.api.routes_campaigns import router as campaigns_router
from src.api.routes_contacts import router as contacts_router
from src.api.routes_profile import router as profile_router
from src.auth import get_current_user
from src.auth_routes import router as auth_router
from src.config import is_admin_email
from src.config import validate_startup_configuration
from src.database import Base, engine
from src.models import User
from src.stripe_routes import router as stripe_router

# Load environment variables
load_dotenv()

app = FastAPI(title="Cold Email Outreach", version="2.0")

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "your-session-secret-change-me"),
)

_extra = os.getenv("FRONTEND_URL_EXTRA", "")
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    os.getenv("FRONTEND_URL", ""),
] + [o.strip() for o in _extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in origins if origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    """Create database tables on startup and run migrations."""
    validate_startup_configuration()
    Base.metadata.create_all(bind=engine)

    from sqlalchemy import inspect, text

    try:
        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]
        if "password_hash" not in columns:
            print("Adding password_hash column to users table...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
                conn.commit()
            print("Password hash column added successfully.")
        else:
            print("Password hash column already exists.")
    except Exception as e:
        print(f"Migration check: {e}")


@app.get("/health")
async def health():
    """Health check for platform probes. No auth required. Optionally checks DB connectivity."""
    from sqlalchemy import text

    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        pass
    status = "ok" if db_ok else "degraded"
    return {"status": status, "database": "ok" if db_ok else "error"}


app.include_router(auth_router, prefix="/api")
app.include_router(stripe_router, prefix="/api")
app.include_router(campaigns_router, prefix="/api")
app.include_router(contacts_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/")
async def root():
    """API root. Production frontend is served from Vercel (web/)."""
    return {"message": "OutreachPro API", "docs": "/docs", "health": "/health"}


@app.get("/api/auth/status")
async def auth_status(user: Optional[User] = Depends(get_current_user)):
    """Check authentication status and Gmail connection state."""
    if not user:
        return {"authenticated": False}

    return {
        "authenticated": True,
        "email": user.email,
        "credits": user.credits,
        "gmail_connected": bool(user.access_token),
        "is_admin": is_admin_email(user.email),
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))  # nosec
