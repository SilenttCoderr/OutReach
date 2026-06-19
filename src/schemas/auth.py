"""Pydantic schemas for auth and admin API surfaces."""

from typing import List, Optional

from pydantic import BaseModel


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthStatusResponse(BaseModel):
    authenticated: bool
    user_id: Optional[int] = None
    email: Optional[str] = None
    credits: Optional[int] = None
    is_admin: Optional[bool] = None


class UserMeResponse(BaseModel):
    id: int
    name: str
    email: str
    credits: int
    is_admin: bool


class AdminUserRead(BaseModel):
    id: int
    name: str
    email: str
    credits: int
    is_admin: bool
    google_id: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None

    class Config:
        from_attributes = True


class AdminMetrics(BaseModel):
    total_users: int
    total_emails_sent: int
    total_drafts: int
    total_credits_issued: int


class AdminOverview(BaseModel):
    metrics: AdminMetrics
    users: List[AdminUserRead]
