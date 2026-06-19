"""Pydantic schemas for the user-profile API surface.

Field names mirror the UserProfile ORM model columns exactly so that
``response_model`` serialization (``from_attributes=True``) and the PUT
handler's ``payload.<field>`` reads stay in lock-step. Mismatches here
surface as 500s, not validation errors.
"""

from typing import List, Optional

from pydantic import BaseModel


class ProfilePayload(BaseModel):
    """Create/update body for PUT /profile. Every field optional (partial update)."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    degree: Optional[str] = None
    university: Optional[str] = None
    graduation_date: Optional[str] = None
    current_title: Optional[str] = None
    current_company: Optional[str] = None
    experience_summary: Optional[str] = None
    key_skills: Optional[List[str]] = None
    highlights: Optional[List[str]] = None
    preferred_roles: Optional[List[str]] = None
    email_sign_off: Optional[str] = None


class UserProfileRead(BaseModel):
    id: int
    user_id: int
    full_name: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    degree: Optional[str] = None
    university: Optional[str] = None
    graduation_date: Optional[str] = None
    current_title: Optional[str] = None
    current_company: Optional[str] = None
    experience_summary: Optional[str] = None
    key_skills: Optional[List[str]] = None
    highlights: Optional[List[str]] = None
    preferred_roles: Optional[List[str]] = None
    email_sign_off: Optional[str] = None

    class Config:
        from_attributes = True


class ProfileEnvelope(BaseModel):
    profile: Optional[UserProfileRead] = None
    complete: Optional[bool] = None
    message: Optional[str] = None
