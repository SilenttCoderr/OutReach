"""User profile CRUD API routes."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.api.dependencies import get_authenticated_user, get_db_session
from src.models import User, UserProfile
from src.schemas.profile import ProfileEnvelope, ProfilePayload

router = APIRouter(tags=["Profile"])


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
    profile.key_skills = payload.key_skills or None
    profile.highlights = payload.highlights or None
    profile.preferred_roles = payload.preferred_roles or None
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
