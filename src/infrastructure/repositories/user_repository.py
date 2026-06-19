"""User repository — persistence operations for User entities."""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from src.infrastructure.repositories.base import BaseRepository
from src.models import User


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, User)

    def get_by_email(self, email: str) -> Optional[User]:
        return self._db.query(User).filter(User.email == email).first()

    def get_for_update(self, user_id: int) -> Optional[User]:
        """Issue SELECT ... FOR UPDATE to serialize concurrent credit mutations."""
        return (
            self._db.query(User)
            .filter(User.id == user_id)
            .with_for_update()
            .first()
        )

    def update_tokens(
        self,
        user_id: int,
        access_token: str,
        refresh_token: Optional[str],
        token_expiry: Optional[datetime],
    ) -> None:
        """Persist refreshed OAuth credentials to prevent silent token loss."""
        user = self.get_by_id(user_id)
        if user:
            user.access_token = access_token
            if refresh_token:
                user.refresh_token = refresh_token
            if token_expiry:
                user.token_expiry = token_expiry
            self._db.commit()
