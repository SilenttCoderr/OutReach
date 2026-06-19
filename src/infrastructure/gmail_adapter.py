"""Adapter around Gmail provider operations used by application services."""

from typing import Dict, List, Optional

from src.gmail_client import GmailClient
from src.domain.ports import GmailPort
from src.models import User


class GmailAdapter(GmailPort):
    """Encapsulates Gmail client operations behind a small service-facing API."""

    def __init__(self, user: User):
        self._client = GmailClient(user=user)

    def authenticate(self) -> bool:
        return self._client.authenticate()

    def create_draft(
        self,
        recipient_email: str,
        subject: str,
        body: str,
        attachment_paths: Optional[List[str]] = None,
    ) -> Optional[Dict]:
        return self._client.create_draft(recipient_email, subject, body, attachment_paths)

    def send_draft(self, draft_id: str) -> Optional[Dict]:
        return self._client.send_draft(draft_id)

    def get_draft(self, draft_id: str) -> Optional[Dict]:
        return self._client.get_draft(draft_id)

    def update_draft(
        self,
        draft_id: str,
        recipient_email: str,
        subject: str,
        body: str,
        attachment_paths: Optional[List[str]] = None,
    ) -> Optional[Dict]:
        return self._client.update_draft(draft_id, recipient_email, subject, body, attachment_paths)

    def delete_draft(self, draft_id: str) -> bool:
        return self._client.delete_draft(draft_id)
