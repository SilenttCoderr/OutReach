"""Contact and upload API routes."""

import shutil
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from src.application import contact_service
from src.api.dependencies import UPLOAD_DIR, get_authenticated_user, get_db_session
from src.models import User
from src.schemas.contacts import (
    ContactDeleteResponse,
    ContactListResponse,
    ContactPayload,
    ContactRead,
    UploadCsvResponse,
)
from src.storage import upload_file

router = APIRouter(tags=["Contacts"])


@router.get("/contacts", response_model=ContactListResponse)
async def get_contacts(
    status: Optional[str] = None,
    limit: int = 100,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Get authenticated user's contacts from database."""
    contacts = contact_service.get_contacts(db, user.id, status=status, limit=limit)
    return ContactListResponse(contacts=contacts)


@router.post("/upload", response_model=UploadCsvResponse)
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
        return UploadCsvResponse(
            message="Upload successful",
            contacts_added=result.get("new_added", 0),
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Processing Error: {str(exc)}")


@router.put("/contacts/{contact_id}", response_model=ContactRead)
async def update_contact(
    contact_id: int,
    payload: ContactPayload,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Update an existing contact for the authenticated user."""
    contact = contact_service.update_contact(
        db=db,
        user_id=user.id,
        contact_id=contact_id,
        name=payload.name,
        email=payload.email,
        company=payload.company,
        role=payload.role,
    )

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    return contact


@router.delete("/contacts/{contact_id}", response_model=ContactDeleteResponse)
async def delete_contact(
    contact_id: int,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Delete a contact belonging to the authenticated user."""
    deleted = contact_service.delete_contact(db=db, user_id=user.id, contact_id=contact_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Contact not found")

    return ContactDeleteResponse(message="Contact deleted")
