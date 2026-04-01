"""Stripe Payments API routes."""

import os
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel

from src.application.billing_service import BillingService
from src.auth import require_auth
from src.database import get_db
from src.models import User

router = APIRouter(prefix="/stripe", tags=["Payments"])


billing_service = BillingService()

class CheckoutRequest(BaseModel):
    credits: int
    amount: int  # in cents

@router.post("/create-checkout-session")
async def create_checkout_session(
    checkout_data: CheckoutRequest,
    user: User = Depends(require_auth)
):
    """Create a Stripe Checkout session to buy credits."""
    try:
        checkout_url = billing_service.create_checkout_session_url(
            user=user,
            credits=checkout_data.credits,
            amount_cents=checkout_data.amount,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"url": checkout_url}


@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None), db: Session = Depends(get_db)):
    """Handle Stripe webhooks to fulfill orders."""
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    payload = await request.body()

    try:
        event = billing_service.construct_webhook_event(payload, stripe_signature, webhook_secret)
    except ValueError:
        # Invalid payload
        raise HTTPException(status_code=400, detail="Invalid payload")
    except Exception:
        # Invalid signature
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        credits_added = billing_service.apply_checkout_completed_credits(db, session)
        if credits_added:
            print(f"Added {credits_added} credits to user_id={session.get('client_reference_id')}")

    return {"status": "success"}
