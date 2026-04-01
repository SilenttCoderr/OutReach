"""User profile CRUD API routes."""

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from src.api.dependencies import get_authenticated_user, get_db_session
from src.models import User, UserProfile

router = APIRouter(tags=["Profile"])


class ProfilePayload(BaseModel):
    """Request body for creating/updating a profile."""

    full_name: str = Field(..., min_length=1, max_length=255)
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
    key_skills: list[str] = Field(default_factory=list)
    highlights: list[str] = Field(default_factory=list)
    preferred_roles: list[str] = Field(default_factory=list)
    email_sign_off: str = "Best"


@router.get("/profile")
async def get_profile(
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Get the current user's profile."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        return {"profile": None, "complete": False}

    return {"profile": profile.to_dict(), "complete": True}


@router.put("/profile")
async def upsert_profile(
    payload: ProfilePayload,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Create or update the current user's profile."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()

    if not profile:
        profile = UserProfile(user_id=user.id)
        db.add(profile)

    profile.full_name = payload.full_name
    profile.phone = payload.phone
    profile.linkedin = payload.linkedin
    profile.github = payload.github
    profile.portfolio = payload.portfolio
    profile.degree = payload.degree
    profile.university = payload.university
    profile.graduation_date = payload.graduation_date
    profile.current_title = payload.current_title
    profile.current_company = payload.current_company
    profile.experience_summary = payload.experience_summary
    profile.key_skills = json.dumps(payload.key_skills) if payload.key_skills else None
    profile.highlights = json.dumps(payload.highlights) if payload.highlights else None
    profile.preferred_roles = json.dumps(payload.preferred_roles) if payload.preferred_roles else None
    profile.email_sign_off = payload.email_sign_off

    db.commit()
    db.refresh(profile)

    return {"profile": profile.to_dict(), "message": "Profile saved"}


@router.get("/profile/onboarding-status")
async def onboarding_status(
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Check if the user's profile has enough data for email generation."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()

    if not profile:
        return {
            "ready": False,
            "missing": ["full_name", "current_title", "experience_summary"],
            "message": "No profile found. Please complete your profile to start sending emails.",
        }

    missing = []
    if not profile.full_name:
        missing.append("full_name")
    if not profile.current_title:
        missing.append("current_title")
    if not profile.experience_summary:
        missing.append("experience_summary")

    return {
        "ready": len(missing) == 0,
        "missing": missing,
        "message": "Profile complete" if not missing else f"Missing: {', '.join(missing)}",
    }
