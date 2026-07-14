"""Pydantic schemas for user-owned template management."""

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


TemplateKind = Literal["email", "prompt"]


class TemplateCreateRequest(BaseModel):
    kind: TemplateKind
    name: str = Field(..., min_length=1, max_length=255)
    subject: Optional[str] = None
    body: str = Field(..., min_length=1)

    @field_validator("name", "body", "subject", mode="before")
    @classmethod
    def _strip_strings(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if not isinstance(value, str):
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("This field cannot be blank")
        return stripped

    @model_validator(mode="after")
    def _require_email_subject(self):
        if self.kind == "email" and not self.subject:
            raise ValueError("Email templates require a subject")
        return self


class TemplateUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    subject: Optional[str] = None
    body: Optional[str] = Field(default=None, min_length=1)

    @field_validator("name", "body", "subject", mode="before")
    @classmethod
    def _strip_strings(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if not isinstance(value, str):
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("This field cannot be blank")
        return stripped

    @model_validator(mode="after")
    def _reject_null_required_fields(self):
        for field in ("name", "body"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class TemplateRead(BaseModel):
    id: int
    user_id: int
    kind: TemplateKind
    name: str
    subject: Optional[str] = None
    body: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TemplateDeleteResponse(BaseModel):
    status: str


class TemplateListResponse(BaseModel):
    templates: List[TemplateRead]
