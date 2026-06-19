"""Adapter around Stripe provider operations used by application services."""

from typing import Any, Dict, Optional

import stripe


class StripeAdapter:
    """Encapsulates Stripe SDK usage and exposes focused billing operations."""

    def __init__(self, api_key: Optional[str]):
        # A publishable key (pk_) here is a common misconfiguration: server-side
        # calls require the secret key (sk_). Fail loudly and early rather than
        # surfacing an opaque Stripe error at checkout time.
        if api_key and api_key.startswith("pk_"):
            raise ValueError(
                "STRIPE_SECRET_KEY is set to a publishable key (pk_...). "
                "Server-side Stripe calls require the secret key (sk_...). "
                "Check your environment variables."
            )
        self.api_key = api_key
        stripe.api_key = api_key

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key) and self.api_key.startswith("sk_")

    def create_checkout_session(
        self,
        customer_email: str,
        user_id: int,
        credits_amount: int,
        unit_amount_cents: int,
        success_url: str,
        cancel_url: str,
    ) -> Any:
        return stripe.checkout.Session.create(
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"{credits_amount} Outreach Credits",
                            "description": "Credits never expire.",
                        },
                        "unit_amount": unit_amount_cents,
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=customer_email,
            client_reference_id=str(user_id),
            metadata={"user_id": user_id, "credits_amount": credits_amount},
        )

    def construct_webhook_event(
        self,
        payload: bytes,
        stripe_signature: Optional[str],
        webhook_secret: Optional[str],
    ) -> Dict[str, Any]:
        if not stripe_signature:
            raise ValueError("Missing Stripe signature")
        if not webhook_secret:
            raise ValueError("Stripe webhook secret is not configured")
        return stripe.Webhook.construct_event(payload, stripe_signature, webhook_secret)
