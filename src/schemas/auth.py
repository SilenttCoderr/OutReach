"""Pydantic schemas for the auth API surface."""

from typing import Optional

from pydantic import BaseModel


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthStatusResponse(BaseModel):
    authenticated: bool
    user_id: Optional[int] = None
    email: Optional[str] = None
    credits: Optional[int] = None
    gmail_connected: Optional[bool] = None
    is_admin: Optional[bool] = None


class UserMeResponse(BaseModel):
    id: int
    name: str
    email: str
    credits: int
    is_admin: bool
