"""Contact workflow orchestration services."""

from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from src.data_processor import DataProcessor
from src.models import Contact, User


def get_contacts(
    db: Session,
    user_id: int,
    status: Optional[str] = None,
    limit: int = 100,
) -> List[Dict[str, Optional[str]]]:
    query = db.query(Contact).filter(Contact.user_id == user_id)
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


def process_uploaded_contacts(db: Session, user: User, file_path: str) -> Dict[str, int]:
    try:
        processor = DataProcessor()
        recruiters = processor.load(file_path)

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
                db.add(
                    Contact(
                        user_id=user.id,
                        name=recruiter.get("recruiter_name"),
                        email=email,
                        company=recruiter.get("company"),
                        role=recruiter.get("role"),
                        status="new",
                    )
                )
                count_new += 1
            else:
                count_existing += 1

        db.commit()
        return {
            "total_contacts": len(recruiters),
            "new_added": count_new,
            "already_exists": count_existing,
        }
    except Exception:
        db.rollback()
        raise
