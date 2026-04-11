import os
from sqlalchemy.orm import Session
from src.database import SessionLocal
import dotenv
dotenv.load_dotenv()
from src.models import User, Contact, UserProfile
from src.application.campaign_service import create_drafts_for_new_contacts

def debug():
    db = SessionLocal()
    user = db.query(User).first()
    if not user:
        print("No user found")
        return
        
    print(f"User: {user.email}, credits: {user.credits}")
    
    contacts = db.query(Contact).filter(Contact.user_id == user.id, Contact.status == "new").all()
    print(f"New contacts: {len(contacts)}")
    for c in contacts:
        print(f" - {c.name} ({c.email}) at {c.company}")
        
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if profile:
        print(f"Profile: full_name={profile.full_name}, title={profile.current_title}, summary={profile.experience_summary[:20] if profile.experience_summary else None}")
    else:
        print("Profile: NONE")

    # Let's try running create_drafts_for_new_contacts
    try:
        res = create_drafts_for_new_contacts(db, user, use_llm=True, attachment_paths=None)
        print(f"Result: {res}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    debug()