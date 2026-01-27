from src.database import SessionLocal
from src.models import User

db = SessionLocal()
users = db.query(User).all()
print(f"Found {len(users)} users.")
for u in users:
    print(f"User: {u.email}")
    print(f"  Access Token: {'Present' if u.access_token else 'MISSING'}")
    print(f"  Refresh Token: {'Present' if u.refresh_token else 'MISSING'}")
    print(f"  Date: {u.created_at}")
