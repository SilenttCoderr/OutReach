"""Startup configuration validation helpers."""

from __future__ import annotations

import os
from typing import Dict


REQUIRED_STARTUP_VARS = (
    "SESSION_SECRET",
    "JWT_SECRET",
    "SECRET_KEY",
    "FRONTEND_URL",
)


def _parse_version(value: str) -> tuple[int, int, int]:
    parts = value.split(".")
    major = int(parts[0]) if len(parts) > 0 and parts[0].isdigit() else 0
    minor = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
    patch = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 0
    return major, minor, patch


def _get_bcrypt_version() -> str:
    import bcrypt  # Imported lazily for testability.

    return getattr(bcrypt, "__version__", "0.0.0")


def validate_startup_configuration() -> Dict[str, str]:
    """Validate critical startup config before serving requests.

    Raises:
        ValueError: If required env vars are missing or dependency contract is broken.
    """

    missing = [key for key in REQUIRED_STARTUP_VARS if not os.getenv(key, "").strip()]
    if missing:
        raise ValueError(
            "Missing required startup environment variables: " + ", ".join(missing)
        )

    bcrypt_version = _get_bcrypt_version()
    if _parse_version(bcrypt_version) >= (4, 1, 0):
        raise ValueError(
            "bcrypt version is incompatible with current passlib usage. "
            "Use bcrypt<4.1 (for example 4.0.1)."
        )

    return {
        "status": "ok",
        "bcrypt": bcrypt_version,
    }


def get_admin_emails() -> set[str]:
    """Return normalized admin email allow-list from environment.

    Supported vars:
    - ADMIN_EMAIL (single)
    - ADMIN_EMAILS (comma-separated list)
    """
    emails: set[str] = set()

    single = os.getenv("ADMIN_EMAIL", "").strip().lower()
    if single:
        emails.add(single)

    multi = os.getenv("ADMIN_EMAILS", "")
    for raw in multi.split(","):
        value = raw.strip().lower()
        if value:
            emails.add(value)

    return emails


def is_admin_email(email: str | None) -> bool:
    """Check whether an email is in the configured admin allow-list."""
    if not email:
        return False
    return email.strip().lower() in get_admin_emails()
