"""Domain status enumerations — single source of truth for status strings."""

from enum import Enum


class ContactStatus(str, Enum):
    NEW = "new"
    DRAFT = "draft"
    SENT = "sent"
    FAILED = "failed"
    CONTACTED = "contacted"
    REPLIED = "replied"


class EmailLogStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    FAILED = "failed"
    DELETED = "deleted"
