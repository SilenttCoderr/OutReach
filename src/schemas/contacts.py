"""Pydantic schemas for the contacts API surface."""

from typing import List, Optional

from pydantic import BaseModel


class ContactPayload(BaseModel):
    """Create or update a single contact. Uses canonical name/email fields."""
    name: str
    email: str
    company: Optional[str] = None
    role: Optional[str] = None


class ContactRead(BaseModel):
    id: int
    name: str
    email: str
    company: Optional[str] = None
    role: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class ContactDeleteResponse(BaseModel):
    message: str


class UploadCsvResponse(BaseModel):
    message: str
    contacts_added: int


class ContactListResponse(BaseModel):
    contacts: List[ContactRead]
