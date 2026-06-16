"""SQLAlchemy models for the Cold Email Outreach SaaS."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from src.database import Base
import json


class User(Base):
    """User model for authentication and profile."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    picture = Column(String(512), nullable=True)  # Google profile picture URL
    google_id = Column(String(255), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=True)  # For email/password auth; null for Google-only users

    # OAuth Credentials
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime, nullable=True)
    
    # Credits system
    credits = Column(Integer, default=10)  # Start with 10 free credits
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    email_logs = relationship("EmailLog", back_populates="user")
    contacts = relationship("Contact", back_populates="user")


class Contact(Base):
    """Startups/Recruiters uploaded by users."""
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    role = Column(String(255), nullable=True)
    linkedin = Column(String(512), nullable=True)
    
    status = Column(String(50), default="new")  # new, contacted, replied
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="contacts")


class EmailLog(Base):
    """Log of emails sent/drafted by users."""
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    recipient_email = Column(String(255), nullable=False)
    recipient_name = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    
    subject = Column(String(512), nullable=True)
    body = Column(Text, nullable=True)
    status = Column(String(50), default="draft")  # draft, sent, failed
    
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)
    gmail_draft_id = Column(String(255), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="email_logs")


class UserProfile(Base):
    """Per-user profile for dynamic email generation."""
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Identity
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    linkedin = Column(String(512), nullable=True)
    github = Column(String(512), nullable=True)
    portfolio = Column(String(512), nullable=True)

    # Education
    degree = Column(String(255), nullable=True)
    university = Column(String(255), nullable=True)
    graduation_date = Column(String(50), nullable=True)

    # Current Role
    current_title = Column(String(255), nullable=True)
    current_company = Column(String(255), nullable=True)
    experience_summary = Column(Text, nullable=True)

    # Outreach Config (JSON-encoded lists stored as Text for SQLite compat)
    key_skills = Column(Text, nullable=True)        # JSON array
    highlights = Column(Text, nullable=True)         # JSON array
    preferred_roles = Column(Text, nullable=True)    # JSON array
    email_sign_off = Column(String(100), default="Best")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="profile")

    def to_dict(self) -> dict:
        """Serialize profile for use in email generation."""
        def _parse_json(val):
            if not val:
                return []
            try:
                return json.loads(val)
            except (json.JSONDecodeError, TypeError):
                return []

        return {
            "full_name": self.full_name or "",
            "phone": self.phone or "",
            "linkedin": self.linkedin or "",
            "github": self.github or "",
            "portfolio": self.portfolio or "",
            "degree": self.degree or "",
            "university": self.university or "",
            "graduation_date": self.graduation_date or "",
            "current_title": self.current_title or "",
            "current_company": self.current_company or "",
            "experience_summary": self.experience_summary or "",
            "key_skills": _parse_json(self.key_skills),
            "highlights": _parse_json(self.highlights),
            "preferred_roles": _parse_json(self.preferred_roles),
            "email_sign_off": self.email_sign_off or "Best",
        }
