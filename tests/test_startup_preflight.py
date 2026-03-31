"""Tests for startup preflight configuration checks."""

import pytest

from src.config import validate_startup_configuration


def _set_required_env(monkeypatch):
    monkeypatch.setenv("SESSION_SECRET", "session-secret")
    monkeypatch.setenv("JWT_SECRET", "jwt-secret")
    monkeypatch.setenv("SECRET_KEY", "secret-key")
    monkeypatch.setenv("FRONTEND_URL", "http://localhost:3000")


def test_preflight_passes_with_required_env_and_compatible_bcrypt(monkeypatch):
    _set_required_env(monkeypatch)
    monkeypatch.setattr("src.config._get_bcrypt_version", lambda: "4.0.1")

    result = validate_startup_configuration()

    assert result["status"] == "ok"
    assert result["bcrypt"] == "4.0.1"


def test_preflight_fails_when_required_env_missing(monkeypatch):
    _set_required_env(monkeypatch)
    monkeypatch.delenv("SESSION_SECRET", raising=False)
    monkeypatch.setattr("src.config._get_bcrypt_version", lambda: "4.0.1")

    with pytest.raises(ValueError, match="SESSION_SECRET"):
        validate_startup_configuration()


def test_preflight_fails_for_incompatible_bcrypt(monkeypatch):
    _set_required_env(monkeypatch)
    monkeypatch.setattr("src.config._get_bcrypt_version", lambda: "4.1.0")

    with pytest.raises(ValueError, match="bcrypt"):
        validate_startup_configuration()
