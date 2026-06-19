"""Pydantic schemas for the user-profile API surface."""

from typing import List, Optional

from pydantic import BaseModel


class ProfilePayload(BaseModel):
    full_name: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[str] = None
    key_skills: Optional[List[str]] = None
    highlights: Optional[List[str]] = None
    preferred_roles: Optional[List[str]] = None
    resume_summary: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class UserProfileRead(BaseModel):
    id: int
    user_id: int
    full_name: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[str] = None
    key_skills: Optional[List[str]] = None
    highlights: Optional[List[str]] = None
    preferred_roles: Optional[List[str]] = None
    resume_summary: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

    class Config:
        from_attributes = True


class ProfileEnvelope(BaseModel):
    profile: Optional[UserProfileRead] = None
