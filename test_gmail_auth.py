import os
import sys
from src.database import SessionLocal
from src.models import User
from src.gmail_client import GmailClient
from dotenv import load_dotenv

# Force load env to ensure we have credentials
load_dotenv()

print(f"CLIENT_ID from env: {os.getenv('GOOGLE_CLIENT_ID')}")

db = SessionLocal()
user = db.query(User).filter(User.email == "ansh.agrawal1883@gmail.com").first()

if not user:
    print("User not found")
    sys.exit(1)

print(f"Testing auth for {user.email}")
client = GmailClient(user=user)

try:
    success = client.authenticate()
    print(f"Auth success: {success}")
    if success:
        print("Service built successfully")
    else:
        print("Auth failed (returned False)")
except Exception as e:
    print(f"Auth raised exception: {e}")
