"""Pydantic schemas for the campaigns/drafts/send API surface."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class StatsResponse(BaseModel):
    total: int
    sent: int
    draft: int
    failed: int


class HistoryItemResponse(BaseModel):
    id: int
    recruiter_email: str
    subject: str
    status: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class EmailLogRead(BaseModel):
    id: int
    recruiter_email: str
    subject: str
    body: Optional[str] = None
    status: str
    gmail_draft_id: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class DraftRead(BaseModel):
    id: int
    recruiter_email: str
    subject: str
    body: Optional[str] = None
    gmail_draft_id: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class DraftGenerationResponse(BaseModel):
    message: str
    drafts_created: int
    drafts_failed: int
    contacts_processed: int


class DraftUpdateRequest(BaseModel):
    subject: Optional[str] = None
    body: Optional[str] = None
    recipient_email: Optional[str] = None


class DraftUpdateResponse(BaseModel):
    message: str
    draft: Optional[Dict[str, Any]] = None


class SendDraftResponse(BaseModel):
    message: str


class SendAllDraftsResponse(BaseModel):
    message: str
    sent_count: int
    failed_count: int
    total_drafts: int


class ClearTrackingResponse(BaseModel):
    message: str
    deleted_count: int
