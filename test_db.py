from sqlalchemy.orm import Session
from src.database import get_db
from src.models import User, Contact, UserProfile
from src.application.campaign_service import create_drafts_for_new_contacts

db = next(get_db())

user = db.query(User).filter_by(email="test@example.com").first()
if not user:
    user = User(email="test@example.com", name="Test User", credits=100)
    db.add(user)
    db.commit()

profile = db.query(UserProfile).filter_by(user_id=user.id).first()
if not profile:
    profile = UserProfile(user_id=user.id, full_name="Test User", current_title="X", current_company="Y", degree="Z", university="W", experience_summary="Q", email_sign_off="S")
    db.add(profile)
    db.commit()

contact = db.query(Contact).filter_by(user_id=user.id).first()
if not contact:
    contact = Contact(user_id=user.id, name="Rc Name", email="ra@example.com", company="SomeCorp", role="Recruiter", status="new")
    db.add(contact)
    db.commit()
profile.graduation_date = "2026"
db.commit()

contact.status = "new"
contact.email = "test.rc@mail.com"
db.commit()

user.credits = 100
db.commit()

# Ensure we have fake Gmail API tokens to pass authenticate
user.access_token = "fake"
user.refresh_token = "fake"
import datetime
user.token_expiry = datetime.datetime.now() + datetime.timedelta(days=1)
db.commit()

# Monkey patch GmailAdapter to skip real API calls but fail them
from src.infrastructure.gmail_adapter import GmailAdapter
def fake_auth(self): return True
# Let's see what the original returns
GmailAdapter.authenticate = fake_auth

try:    
    result = create_drafts_for_new_contacts(db, user, use_llm=True, attachment_paths=[])
    print("Result:", result)
except Exception as e:
    import traceback
    traceback.print_exc()
