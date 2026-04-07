"""Contact and upload API routes."""

import shutil
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from src.application import contact_service
from src.api.dependencies import UPLOAD_DIR, get_authenticated_user, get_db_session
from src.models import User
from src.storage import upload_file

router = APIRouter(tags=["Contacts"])


class ContactUpsertPayload(BaseModel):
    recruiter_name: str = Field(..., min_length=1, max_length=255)
    recruiter_email: str = Field(..., min_length=3, max_length=255)
    company: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., min_length=1, max_length=255)


@router.get("/contacts")
async def get_contacts(
    status: Optional[str] = None,
    limit: int = 100,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Get authenticated user's contacts from database."""
    return contact_service.get_contacts(db, user.id, status=status, limit=limit)


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
        result = contact_service.process_uploaded_contacts(db, user, str(file_path))
        return {
            "filename": file.filename,
            "total_contacts": result["total_contacts"],
            "new_added": result["new_added"],
            "already_exists": result["already_exists"],
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Processing Error: {str(exc)}")


@router.put("/contacts/{contact_id}")
async def update_contact(
    contact_id: int,
    payload: ContactUpsertPayload,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Update an existing contact for the authenticated user."""
    contact = contact_service.update_contact(
        db=db,
        user_id=user.id,
        contact_id=contact_id,
        name=payload.recruiter_name,
        email=payload.recruiter_email,
        company=payload.company,
        role=payload.role,
    )

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    return {
        "id": contact.id,
        "name": contact.name,
        "email": contact.email,
        "company": contact.company,
        "role": contact.role,
        "status": contact.status,
    }


@router.delete("/contacts/{contact_id}")
async def delete_contact(
    contact_id: int,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Delete a contact belonging to the authenticated user."""
    deleted = contact_service.delete_contact(db=db, user_id=user.id, contact_id=contact_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Contact not found")

    return {"deleted": True}
