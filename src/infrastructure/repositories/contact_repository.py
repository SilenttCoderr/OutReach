"""Contact repository — persistence operations for Contact entities."""

from typing import List, Optional

from sqlalchemy.orm import Session

from src.domain.enums import ContactStatus
from src.infrastructure.repositories.base import BaseRepository
from src.models import Contact


class ContactRepository(BaseRepository[Contact]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Contact)

    def get_by_user(
        self,
        user_id: int,
        status: Optional[ContactStatus] = None,
        limit: int = 100,
    ) -> List[Contact]:
        query = self._db.query(Contact).filter(Contact.user_id == user_id)
        if status is not None:
            query = query.filter(Contact.status == status.value)
        return query.limit(limit).all()

    def get_by_email(self, user_id: int, email: str) -> Optional[Contact]:
        return (
            self._db.query(Contact)
            .filter(Contact.user_id == user_id, Contact.email == email)
            .first()
        )

    def set_status(self, user_id: int, email: str, status: ContactStatus) -> None:
        contact = self.get_by_email(user_id, email)
        if contact:
            contact.status = status.value

    def reset_non_new_to_new(self, user_id: int) -> int:
        return (
            self._db.query(Contact)
            .filter(
                Contact.user_id == user_id,
                Contact.status != ContactStatus.NEW.value,
            )
            .update({Contact.status: ContactStatus.NEW.value}, synchronize_session=False)
        )
