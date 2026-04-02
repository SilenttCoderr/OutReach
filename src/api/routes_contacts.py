"""Contact and upload API routes."""

import shutil
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.application import contact_service
from src.api.dependencies import UPLOAD_DIR, get_authenticated_user, get_db_session
from src.models import User
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
    return contact_service.get_contacts(db, user.id, status=status, limit=limit)


@router.post("/upload")
async def upload_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Upload a CSV/Excel file, save contacts to database, and backup to R2."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid file")
        
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["csv", "xlsx", "xls"]:
        raise HTTPException(status_code=400, detail="Only CSV and Excel (.xlsx, .xls) files are supported")

    user_upload_dir = UPLOAD_DIR / str(user.id)
    user_upload_dir.mkdir(exist_ok=True, parents=True)

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


class ManualContactRequest(BaseModel):
    recruiter_name: str
    recruiter_email: str
    company: str
    role: str


@router.post("/manual")
async def add_manual_contact(
    contact: ManualContactRequest,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Manually add a single contact."""
    try:
        result = contact_service.add_single_contact(db, user, contact.model_dump())
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to add contact: {str(exc)}")
