"""Regression tests for email generation robustness and profile propagation."""

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from src.application import campaign_service
from src.email_generator import EmailGenerator


def _sample_profile() -> dict:
    return {
        "full_name": "Alex Johnson",
        "degree": "MS Computer Science",
        "university": "Stanford",
        "current_title": "ML Engineer",
        "current_company": "ExampleAI",
        "experience_summary": "built scalable ML pipelines",
        "email_sign_off": "Best",
    }


def test_email_generator_rejects_invalid_user_profile_type() -> None:
    generator = EmailGenerator()
    recruiter = {"recruiter_name": "Jane Doe", "company": "Acme"}

    with pytest.raises(ValueError, match="user_profile must be a dict"):
        generator.generate(recruiter, user_profile="professional")


def test_email_generator_handles_none_recruiter_name() -> None:
    generator = EmailGenerator()
    recruiter = {"recruiter_name": None, "company": "Acme", "role": "Engineer"}

    result = generator.generate(recruiter, user_profile=_sample_profile())

    assert result["subject"].startswith("ML Engineer @ ExampleAI")
    assert result["body"].startswith("Hi there,")


@patch("src.application.campaign_service._get_user_profile")
@patch("src.application.campaign_service._get_generator")
def test_preview_emails_non_llm_passes_user_profile(
    mock_get_generator,
    mock_get_user_profile,
) -> None:
    db = MagicMock()
    contact = SimpleNamespace(
        name="Jane Doe",
        email="jane@example.com",
        company="Acme",
        role="Engineer",
    )
    db.query.return_value.filter.return_value.limit.return_value.all.return_value = [contact]

    profile = _sample_profile()
    mock_get_user_profile.return_value = profile

    mock_generator = MagicMock()
    mock_generator.generate.return_value = {"subject": "Hello", "body": "Body"}
    mock_get_generator.return_value = mock_generator

    response = campaign_service.preview_emails(db=db, user_id=1, use_llm=False)

    assert response["emails"][0]["subject"] == "Hello"
    _, kwargs = mock_generator.generate.call_args
    assert kwargs["user_profile"] == profile


@patch("src.application.campaign_service.GmailAdapter")
@patch("src.application.campaign_service._get_user_profile")
@patch("src.application.campaign_service._get_generator")
def test_create_drafts_non_llm_passes_user_profile_and_attachment_flag(
    mock_get_generator,
    mock_get_user_profile,
    mock_gmail_adapter,
) -> None:
    db = MagicMock()
    user = SimpleNamespace(id=1, credits=10)
    contact = SimpleNamespace(
        name="Jane Doe",
        email="jane@example.com",
        company="Acme",
        role="Engineer",
        status="new",
    )
    db.query.return_value.filter.return_value.all.return_value = [contact]

    profile = _sample_profile()
    mock_get_user_profile.return_value = profile

    mock_generator = MagicMock()
    mock_generator.generate.return_value = {"subject": "Sub", "body": "Body"}
    mock_get_generator.return_value = mock_generator

    mock_gmail = MagicMock()
    mock_gmail.authenticate.return_value = True
    mock_gmail.create_draft.return_value = {"id": "draft_123"}
    mock_gmail_adapter.return_value = mock_gmail

    result = campaign_service.create_drafts_for_new_contacts(
        db=db,
        user=user,
        use_llm=False,
        attachment_paths=["resume.pdf"],
    )

    assert result["success"] == 1
    _, kwargs = mock_generator.generate.call_args
    assert kwargs["user_profile"] == profile
    assert kwargs["has_attachments"] is True
