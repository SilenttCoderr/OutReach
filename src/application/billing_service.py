"""Billing workflow orchestration services."""

import os
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from src.infrastructure.stripe_adapter import StripeAdapter
from src.infrastructure.repositories.user_repository import UserRepository
from src.models import User


class BillingService:
    """Encapsulates billing use-cases and delegates provider calls to adapters."""

    def __init__(
        self,
        stripe_adapter: Optional[StripeAdapter] = None,
        frontend_url: Optional[str] = None,
    ):
        self.frontend_url = frontend_url or os.getenv("FRONTEND_URL", "http://localhost:3000")
        self.stripe_adapter = stripe_adapter or StripeAdapter(os.getenv("STRIPE_SECRET_KEY"))

    def create_checkout_session_url(self, user: User, credits: int, amount_cents: int) -> str:
        if not self.stripe_adapter.is_configured:
            raise RuntimeError("Stripe API key not configured")

        session = self.stripe_adapter.create_checkout_session(
            customer_email=user.email,
            user_id=user.id,
            credits_amount=credits,
            unit_amount_cents=amount_cents,
            success_url=f"{self.frontend_url}/dashboard?payment=success",
            cancel_url=f"{self.frontend_url}/pricing?payment=canceled",
        )
        return session.url

    def construct_webhook_event(
        self,
        payload: bytes,
        stripe_signature: Optional[str],
        webhook_secret: Optional[str],
    ) -> Dict[str, Any]:
        return self.stripe_adapter.construct_webhook_event(payload, stripe_signature, webhook_secret)

    def apply_checkout_completed_credits(self, db: Session, session: Dict[str, Any]) -> Optional[int]:
        user_id = session.get("client_reference_id")
        metadata = session.get("metadata", {}) or {}

        if not user_id:
            return None

        try:
            credits_amount = int(metadata.get("credits_amount", 50))
            user = UserRepository(db).get_for_update(int(user_id))
            if not user:
                return None

            user.credits += credits_amount
            db.commit()
            return credits_amount
        except Exception:
            db.rollback()
            raise
