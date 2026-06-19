"""Pydantic schemas for the campaigns/drafts/send API surface."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class StatsResponse(BaseModel):
    credits_available: int
    total_sent: int
    total_drafted: int
    pending: int
    failed_emails: int
    success_rate: Optional[float] = None


class DraftGenerationResponse(BaseModel):
    success: int
    failed: int
    total: int
    attachments: Optional[int] = None
    remaining_credits: Optional[int] = None
    message: Optional[str] = None
    errors: Optional[List[Any]] = None
    progress: Optional[List[Any]] = None


class DraftUpdateRequest(BaseModel):
    subject: Optional[str] = None
    body: Optional[str] = None
    recipient_email: Optional[str] = None


class DraftUpdateResponse(BaseModel):
    status: str
    message: Optional[str] = None
    draft: Optional[Dict[str, Any]] = None


class SendDraftResponse(BaseModel):
    status: str
    message_id: Optional[str] = None
    message: Optional[str] = None


class SendAllDraftsResponse(BaseModel):
    message: str
    queued: Optional[int] = None
    delay_seconds: Optional[int] = None


class ClearTrackingResponse(BaseModel):
    status: str
    email_logs_removed: int
