"""EmailLog repository — persistence operations for EmailLog entities."""

from typing import Dict, List

from sqlalchemy import func
from sqlalchemy.orm import Session

from src.domain.enums import EmailLogStatus
from src.infrastructure.repositories.base import BaseRepository
from src.models import EmailLog


class EmailLogRepository(BaseRepository[EmailLog]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, EmailLog)

    def get_drafts(self, user_id: int) -> List[EmailLog]:
        return (
            self._db.query(EmailLog)
            .filter(
                EmailLog.user_id == user_id,
                EmailLog.status == EmailLogStatus.DRAFT.value,
            )
            .all()
        )

    def get_by_status(self, user_id: int, status: EmailLogStatus) -> List[EmailLog]:
        return (
            self._db.query(EmailLog)
            .filter(
                EmailLog.user_id == user_id,
                EmailLog.status == status.value,
            )
            .all()
        )

    def count_by_status(self, user_id: int) -> Dict[str, int]:
        counts = (
            self._db.query(EmailLog.status, func.count(EmailLog.id))
            .filter(EmailLog.user_id == user_id)
            .group_by(EmailLog.status)
            .all()
        )
        return {status: count for status, count in counts}

    def delete_all_for_user(self, user_id: int) -> int:
        return (
            self._db.query(EmailLog)
            .filter(EmailLog.user_id == user_id)
            .delete(synchronize_session=False)
        )
