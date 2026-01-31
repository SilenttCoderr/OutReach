"""Simulate Stripe webhook for local testing. Run from project root: python scripts/simulate_webhook.py"""
import time
import stripe
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_local_test")
API_URL = "http://localhost:8000/api/stripe/webhook"

# Mock User ID (Change this to the user ID you want to credit)
# You can check your DB or just assume ID 1 if you are the first user
USER_ID = 1

def generate_webhook_payload():
    timestamp = int(time.time())
    payload = {
        "id": "evt_test_webhook",
        "object": "event",
        "api_version": "2023-10-16",
        "created": timestamp,
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_session",
                "object": "checkout.session",
                "client_reference_id": str(USER_ID),
                "metadata": {
                    "user_id": str(USER_ID),
                    "credits": "50"
                },
                "payment_status": "paid",
                "status": "complete"
            }
        }
    }
    return payload, timestamp

def sign_payload(payload_str, timestamp, secret):
    signed_payload = f"{timestamp}.{payload_str}"
    signature = stripe.WebhookSignature._compute_signature(signed_payload, secret)
    return f"t={timestamp},v1={signature}"

def send_test_webhook():
    import json
    payload, timestamp = generate_webhook_payload()
    payload_str = json.dumps(payload)
    
    signature = sign_payload(payload_str, timestamp, WEBHOOK_SECRET)
    
    headers = {
        "Content-Type": "application/json",
        "Stripe-Signature": signature
    }
    
    print(f"Sending webhook to {API_URL}...")
    print(f"Secret used: {WEBHOOK_SECRET}")
    print(f"User ID: {USER_ID}")
    
    try:
        response = requests.post(API_URL, data=payload_str, headers=headers)
        print(f"Response: {response.status_code}")
        print(response.text)
    except Exception as e:
        print(f"Failed to send webhook: {e}")

if __name__ == "__main__":
    send_test_webhook()
