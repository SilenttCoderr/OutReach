"""Stripe Payments API routes."""

import os
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from src.database import get_db
from src.models import User
from src.auth import require_auth

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
PRICE_ID_CREDITS = os.getenv("STRIPE_PRICE_ID_CREDITS", "price_H5ggYwtDq4fbrJ") # Default dummy

router = APIRouter(prefix="/stripe", tags=["Payments"])

class CheckoutRequest(BaseModel):
    credits: int
    amount: int  # in cents

@router.post("/create-checkout-session")
async def create_checkout_session(
    checkout_data: CheckoutRequest,
    user: User = Depends(require_auth)
):
    """Create a Stripe Checkout session to buy credits."""
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
        
    try:
        checkout_session = stripe.checkout.Session.create(
            line_items=[
                {
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'{checkout_data.credits} Outreach Credits',
                            'description': 'Credits never expire.',
                        },
                        'unit_amount': checkout_data.amount,
                    },
                    'quantity': 1,
                },
            ],
            mode='payment',
            success_url=f'{FRONTEND_URL}/dashboard?payment=success',
            cancel_url=f'{FRONTEND_URL}/pricing?payment=canceled',
            customer_email=user.email,
            client_reference_id=str(user.id),
            metadata={
                'user_id': user.id,
                'credits_amount': checkout_data.credits
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"url": checkout_session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None), db: Session = Depends(get_db)):
    """Handle Stripe webhooks to fulfill orders."""
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, webhook_secret
        )
    except ValueError as e:
        # Invalid payload
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Fulfill the purchase...
        user_id = session.get('client_reference_id')
        metadata = session.get('metadata', {})
        credits_amount = int(metadata.get('credits_amount', 50))
        
        if user_id:
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user:
                user.credits += credits_amount
                db.commit()
                print(f"Added {credits_amount} credits to user {user.email}")

    return {"status": "success"}
