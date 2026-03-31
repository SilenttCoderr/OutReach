"""Contact and upload API routes."""

import shutil
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from src.api.dependencies import UPLOAD_DIR, get_authenticated_user, get_db_session
from src.data_processor import DataProcessor
from src.models import Contact, User
from src.storage import upload_file

router = APIRouter(tags=["Contacts"])


@router.get("/contacts")
async def get_contacts(
    status: Optional[str] = None,
    limit: int = 100,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Get authenticated user's contacts from database."""
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


@router.post("/upload")
async def upload_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Upload a CSV file, save contacts to database, and backup to R2."""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    user_upload_dir = UPLOAD_DIR / str(user.id)
    user_upload_dir.mkdir(exist_ok=True)

    file_path = user_upload_dir / file.filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    def backup_to_r2(local_path: str, object_name: str) -> None:
        try:
            with open(local_path, "rb") as f:
                upload_file(f, object_name)
        except Exception as exc:
            print(f"Background upload failed: {exc}")

    object_name = f"users/{user.id}/uploads/{file.filename}"
    background_tasks.add_task(backup_to_r2, str(file_path), object_name)

    try:
        processor = DataProcessor()
        recruiters = processor.load(str(file_path))

        count_new = 0
        count_existing = 0
        for recruiter in recruiters:
            email = recruiter.get("recruiter_email")
            existing = (
                db.query(Contact)
                .filter(Contact.user_id == user.id, Contact.email == email)
                .first()
            )

            if not existing:
                contact = Contact(
                    user_id=user.id,
                    name=recruiter.get("recruiter_name"),
                    email=email,
                    company=recruiter.get("company"),
                    role=recruiter.get("role"),
                    status="new",
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
            "already_exists": count_existing,
        }
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Processing Error: {str(exc)}")
