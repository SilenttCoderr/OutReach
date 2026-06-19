"""Protocol interfaces for infrastructure adapters.

The application layer depends on these protocols, not the concrete implementations.
This keeps domain and application code free of SDK/framework imports.
"""

from typing import Dict, List, Optional, Protocol, runtime_checkable


@runtime_checkable
class GmailPort(Protocol):
    def authenticate(self) -> bool: ...

    def create_draft(
        self,
        recipient_email: str,
        subject: str,
        body: str,
        attachment_paths: Optional[List[str]] = None,
    ) -> Optional[Dict]: ...

    def send_draft(self, draft_id: str) -> Optional[Dict]: ...

    def get_draft(self, draft_id: str) -> Optional[Dict]: ...

    def update_draft(
        self,
        draft_id: str,
        recipient_email: str,
        subject: str,
        body: str,
        attachment_paths: Optional[List[str]] = None,
    ) -> Optional[Dict]: ...

    def delete_draft(self, draft_id: str) -> bool: ...


@runtime_checkable
class StripePort(Protocol):
    @property
    def is_configured(self) -> bool: ...

    def create_checkout_session(
        self,
        *,
        customer_email: str,
        user_id: int,
        credits_amount: int,
        unit_amount_cents: int,
        success_url: str,
        cancel_url: str,
    ): ...

    def construct_webhook_event(
        self,
        payload: bytes,
        stripe_signature: Optional[str],
        webhook_secret: Optional[str],
    ) -> Dict: ...


@runtime_checkable
class EmailSenderPort(Protocol):
    """System-level transactional email (password resets, notifications).

    Distinct from GmailPort, which sends as the end user via their OAuth grant.
    """

    @property
    def is_configured(self) -> bool: ...

    def send(self, *, to: str, subject: str, html: str) -> bool: ...
