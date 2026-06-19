"""Resend transactional-email adapter.

Implements EmailSenderPort using the Resend HTTP API. Configured via env:
    RESEND_API_KEY    - Resend API key (required to actually send)
    RESEND_FROM_EMAIL - verified sender, e.g. "OutReach <noreply@yourdomain.com>"
"""

import os
from typing import Optional

import httpx

from src.domain.ports import EmailSenderPort

RESEND_ENDPOINT = "https://api.resend.com/emails"


class ResendAdapter(EmailSenderPort):
    def __init__(self, api_key: Optional[str] = None, from_email: Optional[str] = None):
        self._api_key = api_key if api_key is not None else os.getenv("RESEND_API_KEY")
        self._from_email = (
            from_email if from_email is not None else os.getenv("RESEND_FROM_EMAIL")
        )

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key and self._from_email)

    def send(self, *, to: str, subject: str, html: str) -> bool:
        if not self.is_configured:
            # Surfaced by the caller; avoids leaking config state to end users.
            print("ResendAdapter.send skipped: RESEND_API_KEY / RESEND_FROM_EMAIL not set")
            return False

        try:
            response = httpx.post(
                RESEND_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": self._from_email,
                    "to": [to],
                    "subject": subject,
                    "html": html,
                },
                timeout=15.0,
            )
        except httpx.HTTPError as exc:
            print(f"ResendAdapter.send transport error: {exc}")
            return False

        if response.status_code >= 400:
            print(f"ResendAdapter.send failed {response.status_code}: {response.text}")
            return False
        return True
