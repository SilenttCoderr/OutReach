"""SQLAlchemy models for the Cold Email Outreach SaaS."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from src.database import Base
from src.infrastructure.types import JsonListType


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
    templates_seeded_at = Column(DateTime, nullable=True)
    
    # Relationships
    email_logs = relationship("EmailLog", back_populates="user", cascade="all, delete-orphan")
    contacts = relationship("Contact", back_populates="user", cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="user", cascade="all, delete-orphan")


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

    # Outreach Config (lists persisted via JsonListType — no manual json.dumps/loads needed)
    key_skills = Column(JsonListType, nullable=True)
    highlights = Column(JsonListType, nullable=True)
    preferred_roles = Column(JsonListType, nullable=True)
    email_sign_off = Column(Text, default="Best")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="profile")

    def to_dict(self) -> dict:
        """Serialize profile for use in email generation."""
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
            "key_skills": self.key_skills or [],
            "highlights": self.highlights or [],
            "preferred_roles": self.preferred_roles or [],
            "email_sign_off": self.email_sign_off or "Best",
        }


class Template(Base):
    """User-owned email or prompt template."""

    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    kind = Column(String(20), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    subject = Column(Text, nullable=True)
    body = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="templates")
