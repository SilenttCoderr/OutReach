import os
import shutil
from pathlib import Path
from typing import Optional, List
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Third-party imports
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn

# Local imports
from src.data_processor import DataProcessor
from src.email_generator import EmailGenerator
from src.tracker import EmailTracker
from src.gmail_client import GmailClient
from src.database import engine, Base
from src.auth_routes import router as auth_router
from src.stripe_routes import router as stripe_router

app = FastAPI(title="Cold Email Outreach", version="2.0")

# Rate limiting: per-IP limits on /api/draft, /api/send/{id}, /api/send-all (20/min each)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Session middleware for OAuth
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "your-session-secret-change-me"),
)


# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in origins if origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store uploaded files
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Global state
current_file: Optional[str] = None
gmail_client: Optional[GmailClient] = None # type: ignore


# Database table creation on startup
@app.on_event("startup")
async def startup():
    """Create database tables on startup."""
    Base.metadata.create_all(bind=engine)


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


# Include auth router
# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(stripe_router, prefix="/api")



class EmailPreview(BaseModel):
    recruiter_name: str
    recruiter_email: str
    company: str
    subject: str
    body: str


class StatsResponse(BaseModel):
    total: int
    sent: int
    draft: int
    pending: int
    failed: int


@app.get("/")
async def root():
    """API root. Production frontend is served from Vercel (web/)."""
    return {"message": "OutreachPro API", "docs": "/docs", "health": "/health"}


from sqlalchemy.orm import Session
from src.database import get_db
from src.auth import require_auth
from src.models import User, Contact, EmailLog

@app.get("/api/stats")
async def get_stats(user: User = Depends(require_auth), db: Session = Depends(get_db)):
    """Get email tracking statistics and credits from database."""
    from sqlalchemy import func

    # Query actual counts from EmailLog table
    total = db.query(func.count(EmailLog.id)).filter(EmailLog.user_id == user.id).scalar() or 0
    sent = db.query(func.count(EmailLog.id)).filter(EmailLog.user_id == user.id, EmailLog.status == "sent").scalar() or 0
    draft = db.query(func.count(EmailLog.id)).filter(EmailLog.user_id == user.id, EmailLog.status == "draft").scalar() or 0
    failed = db.query(func.count(EmailLog.id)).filter(EmailLog.user_id == user.id, EmailLog.status == "failed").scalar() or 0
    pending = total - sent - draft - failed
    pending = pending if pending > 0 else 0

    return {
        "credits_available": user.credits,
        "total_sent": sent,
        "total_drafted": draft,
        "pending": pending,
        "failed_emails": failed,
    }


@app.get("/api/history")
async def get_history(status: Optional[str] = None, limit: int = 50, user: User = Depends(require_auth), db: Session = Depends(get_db)):
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


@app.get("/api/contacts")
async def get_contacts(status: Optional[str] = None, limit: int = 100, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    """Get user's contacts from database."""
    query = db.query(Contact).filter(Contact.user_id == user.id)
    if status:
        query = query.filter(Contact.status == status)
    contacts = query.order_by(Contact.created_at.desc()).limit(limit).all()
    return [
        {
            "id": contact.id,
            "name": contact.name,
            "email": contact.email,
            "company": contact.company,
            "role": contact.role,
            "status": contact.status,
            "created_at": contact.created_at.isoformat() if contact.created_at else None,
        }
        for contact in contacts
    ]


from fastapi import BackgroundTasks
from src.storage import upload_file

@app.post("/api/upload")
async def upload_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    user: User = Depends(require_auth), 
    db: Session = Depends(get_db)
):
    """Upload a CSV file, save contacts to database, and backup to R2."""
    # Store file temporarily
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    # Save the file to user specific path
    user_upload_dir = UPLOAD_DIR / str(user.id)
    user_upload_dir.mkdir(exist_ok=True)
    
    file_path = user_upload_dir / file.filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    # Define background upload task
    def backup_to_r2(local_path, object_name):
        try:
            with open(local_path, "rb") as f:
                upload_file(f, object_name)
        except Exception as e:
            print(f"Background upload failed: {e}")

    # Schedule upload
    object_name = f"users/{user.id}/uploads/{file.filename}"
    background_tasks.add_task(backup_to_r2, str(file_path), object_name)
    
    # Load and process data
    try:
        processor = DataProcessor()
        recruiters = processor.load(str(file_path))
        
        # Save to DB
        count_new = 0
        count_existing = 0
        
        for r in recruiters:
            # Check if contact exists for this user by email
            email = r.get("recruiter_email")
            existing = db.query(Contact).filter(Contact.user_id == user.id, Contact.email == email).first()
            
            if not existing:
                contact = Contact(
                    user_id=user.id,
                    name=r.get("recruiter_name"),
                    email=email,
                    company=r.get("company"),
                    role=r.get("role"),
                    status="new"
                )
                db.add(contact)
                count_new += 1
            else:
                count_existing += 1
        
        db.commit()
        
        return {
            "filename": file.filename,
            "total_contacts": len(recruiters),
            "new_added": count_new,
            "already_exists": count_existing
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Processing Error: {str(e)}")


@app.get("/api/preview")
async def preview_emails(limit: int = 5, use_llm: bool = False, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    """Preview generated emails for new contacts."""
    
    # Fetch new contacts from DB
    contacts = db.query(Contact).filter(
        Contact.user_id == user.id,
        Contact.status == "new"
    ).limit(limit).all()
    
    if not contacts:
        return {"emails": [], "message": "No new contacts found. Please upload a CSV first."}
    
    # Convert contacts to dicts for generator
    recruiters = []
    for c in contacts:
        recruiters.append({
            "recruiter_name": c.name,
            "recruiter_email": c.email,
            "company": c.company,
            "role": c.role,
            "company_type": "unknown" # Fallback
        })
    
    # Get generator
    generator: EmailGenerator | LLMEmailGenerator
    if use_llm:
        from src.llm_generator import LLMEmailGenerator
        generator = LLMEmailGenerator()
    else:
        generator = EmailGenerator()
    
    previews = []
    for recruiter in recruiters:
        try:
            result = generator.generate(recruiter)
            previews.append({
                "recruiter_name": recruiter.get("recruiter_name", ""),
                "recruiter_email": recruiter.get("recruiter_email", ""),
                "company": recruiter.get("company", ""),
                "subject": result["subject"],
                "body": result["body"]
            })
        except Exception as e:
            previews.append({
                "recruiter_name": recruiter.get("recruiter_name", ""),
                "error": str(e)
            })
    
    return {"emails": previews}


@app.get("/api/auth/status")
async def auth_status(user: User = Depends(require_auth)):
    """Check if User has Gmail connected."""
    if user and user.access_token:
        return {"authenticated": True, "email": user.email}
    return {"authenticated": False}


@app.post("/api/draft")
@limiter.limit("20/minute")
async def create_drafts(
    request: Request,
    use_llm: str = Form("false"),
    attachments: List[UploadFile] = File(default=[]),
    user: User = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """Create Gmail drafts for all new contacts."""
    
    # Convert string to boolean (FormData sends strings)
    use_llm_bool = use_llm.lower() in ('true', '1', 'yes', 'on')
    has_attachments = len(attachments) > 0
    
    print(f"Creating drafts for user {user.email} (LLM: {use_llm_bool})")
    
    # Initialize Gmail client for this user
    gmail_client = GmailClient(user=user)
    if not gmail_client.authenticate():
        raise HTTPException(status_code=401, detail="Gmail not connected. Please login with Google again.")
    
    # Fetch new contacts from DB
    contacts = db.query(Contact).filter(
        Contact.user_id == user.id,
        Contact.status == "new"
    ).all()
    
    if not contacts:
        return {"success": 0, "failed": 0, "message": "No new contacts found to draft for."}
    
    # Credit check - prevent negative credits
    if user.credits < len(contacts):
        raise HTTPException(status_code=402, detail=f"Insufficient credits. You have {user.credits} but need {len(contacts)}.")
        
    # Save attachments temporarily
    attachment_paths = []
    if has_attachments:
        user_att_dir = UPLOAD_DIR / str(user.id) / "attachments"
        user_att_dir.mkdir(parents=True, exist_ok=True)
        for att in attachments:
            if att.filename:
                att_path = user_att_dir / att.filename
                with open(att_path, "wb") as f:
                    shutil.copyfileobj(att.file, f)
                attachment_paths.append(str(att_path))
    
    # Get generator
    generator: EmailGenerator | LLMEmailGenerator
    if use_llm_bool:
        from src.llm_generator import LLMEmailGenerator
        generator = LLMEmailGenerator()
    else:
        generator = EmailGenerator()
    
    success = 0
    failed = 0
    
    for contact in contacts:
        try:
            # Prepare data dict for generator
            recruiter_data = {
                "recruiter_name": contact.name,
                "recruiter_email": contact.email,
                "company": contact.company,
                "role": contact.role,
                "company_type": "unknown"
            }
            
            # Generate email
            result = generator.generate(recruiter_data, has_attachments=has_attachments)
            
            # Create draft
            draft_result = gmail_client.create_draft(
                contact.email,
                result["subject"],
                result["body"],
                attachment_paths if attachment_paths else None
            )
            
            if draft_result:
                # Update Contact status
                contact.status = "draft"
                
                # Log email
                log = EmailLog(
                    user_id=user.id,
                    recipient_email=contact.email,
                    recipient_name=contact.name,
                    company=contact.company,
                    subject=result["subject"],
                    status="draft",
                    gmail_draft_id=draft_result.get("id")
                )
                db.add(log)
                success += 1
            else:
                failed += 1
        except Exception as e:
            print(f"Error creating draft: {e}")
            failed += 1
    
    # DEDUCT CREDITS based on success
    if success > 0:
        user.credits -= success
        db.commit()
    
    return {"success": success, "failed": failed, "total": len(contacts), "attachments": len(attachment_paths), "remaining_credits": user.credits}


@app.get("/api/drafts")
async def get_drafts(user: User = Depends(require_auth), db: Session = Depends(get_db)):
    """Get all drafted emails for the user."""
    drafts = db.query(EmailLog).filter(
        EmailLog.user_id == user.id,
        EmailLog.status == "draft"
    ).order_by(EmailLog.created_at.desc()).all()
    return drafts


@app.post("/api/send/{draft_id}")
@limiter.limit("20/minute")
async def send_draft(
    request: Request,
    draft_id: int,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """Send a drafted email."""
    # Find the log entry
    log = db.query(EmailLog).filter(
        EmailLog.id == draft_id,
        EmailLog.user_id == user.id
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Draft not found")
        
    # In a real Gmail API scenario, we would use the draft ID to send.
    # But our logging model stores a 'status'.
    # If we created a real Gmail draft, we might have stored its ID in the log (we didn't yet).
    # For now, let's assume we are sending a "new" email with the content from the log 
    # OR we need to update the model to store Gmail Draft ID.
    
    # Let's inspect create_drafts... it saves a log but doesn't store the Gmail Draft ID in the 'log' variable in the DB?
    # Ah, create_drafts does: `db.add(log)`
    # But the `log` object (EmailLog model) doesn't have a `gmail_draft_id` column in the snippet I saw earlier? 
    # Let's check models.py first. It might be missing.
    
    # WAIT: I should check models.py before writing this endpoint to be sure I have the draft ID.
    # If not, I can't send the *actual* Gmail draft easily (unless I search for it?).
    
    # Alternative: Just send a fresh email with the content (if we saved content).
    # But EmailLog doesn't have 'body' column! It only has 'subject'.
    # CRITICAL GAP: We are not saving the body in the DB. We only created a Gmail draft.
    
    # SOLUTION: We must use the Gmail API to list drafts for the user, match them, and then send.
    # Since we didn't store the Gmail Draft ID in our DB, we can't link them 1:1 easily.
    
    # REFACTOR: 
    # 1. Update `create_drafts` to store the Gmail Draft ID in a new column in EmailLog (or existing if there is one).
    # 2. Or, just list *all* Gmail drafts from the API.
    
    # Let's go with listing all Gmail drafts from the API for now, as it's the source of truth.
    
    gmail_client = GmailClient(user=user)
    if not gmail_client.authenticate():
         raise HTTPException(status_code=401, detail="Gmail authentication failed")
         
    try:
        if not log.gmail_draft_id:
             # Legacy draft or failed to save ID, cannot send via copy
             raise HTTPException(status_code=400, detail="Draft ID missing for this email.")
        
        sent_msg = gmail_client.send_draft(log.gmail_draft_id)
        if sent_msg:
            log.status = "sent"
            log.sent_at = datetime.utcnow()
            db.commit()
            return {"status": "sent", "message_id": sent_msg['id']}
        else:
            raise HTTPException(status_code=500, detail="Failed to send draft via Gmail API")

    except Exception as e:
        print(f"Error sending draft: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/send-all")
@limiter.limit("20/minute")
async def send_all_drafts(
    request: Request,
    background_tasks: BackgroundTasks,
    delay_seconds: int = 30,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """Send all drafted emails with rate limiting (Option B feature)."""
    # Get all drafts for user
    drafts = db.query(EmailLog).filter(
        EmailLog.user_id == user.id,
        EmailLog.status == "draft"
    ).all()
    
    if not drafts:
        return {"queued": 0, "message": "No drafts to send"}
    
    # Queue the batch send as a background task
    def batch_send_task():
        import time
        from src.database import SessionLocal
        from src.gmail_client import GmailClient
        from src.models import User as UserModel, EmailLog as EmailLogModel
        
        db_session = SessionLocal()
        try:
            user_obj = db_session.query(UserModel).filter(UserModel.id == user.id).first()
            gmail = GmailClient(user=user_obj)
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
                except Exception as e:
                    print(f"Error sending {draft.recipient_email}: {e}")
        finally:
            db_session.close()
    
    background_tasks.add_task(batch_send_task)
    
    return {
        "queued": len(drafts),
        "delay_seconds": delay_seconds,
        "message": f"Sending {len(drafts)} emails in background with {delay_seconds}s delay between each"
    }


@app.post("/api/clear-tracking")
async def clear_tracking():
    """Clear all tracking records to allow re-sending."""
    tracker = EmailTracker()
    tracker.records = {}
    tracker._save()
    return {"status": "cleared"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))  # nosec
