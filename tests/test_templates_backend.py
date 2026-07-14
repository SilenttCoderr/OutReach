"""Focused regression coverage for template and draft backend behavior."""

import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.api.dependencies import get_authenticated_user, get_db_session, limiter
from src.api.routes_campaigns import router as campaigns_router
from src.api.routes_templates import STARTER_PROMPT_PRESETS, router as templates_router
from src.application import campaign_service
from src.database import Base
from src.email_generator import EmailGenerator
from src.models import Contact, EmailLog, Template, User, UserProfile


@pytest.fixture
def db_session():
    temp_root = Path(tempfile.mkdtemp(dir=Path.cwd() / ".uv-cache"))
    engine = create_engine(
        f"sqlite:///{temp_root / 'templates-test.db'}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        shutil.rmtree(temp_root, ignore_errors=True)


@pytest.fixture
def api_client(db_session):
    app = FastAPI()
    app.state.limiter = limiter
    app.include_router(templates_router, prefix="/api")
    app.include_router(campaigns_router, prefix="/api")

    current_user = {"value": None}

    def _current_user_override():
        return current_user["value"]

    def _db_override():
        return db_session

    app.dependency_overrides[get_authenticated_user] = _current_user_override
    app.dependency_overrides[get_db_session] = _db_override

    with TestClient(app) as client:
        yield client, current_user

    app.dependency_overrides.clear()


def _create_user(session, email: str, credits: int = 25) -> User:
    user = User(email=email, credits=credits)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _create_profile(session, user: User, sign_off: str = "Best regards,\nAlex Johnson") -> UserProfile:
    profile = UserProfile(
        user_id=user.id,
        full_name="Alex Johnson",
        current_title="ML Engineer",
        current_company="ExampleAI",
        degree="MS Computer Science",
        university="Stanford",
        experience_summary="built resilient data products",
        key_skills=["Python", "ML systems"],
        highlights=["Improved model performance by 18%"],
        preferred_roles=["ML Engineer"],
        email_sign_off=sign_off,
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile


def _create_contact(session, user: User) -> Contact:
    contact = Contact(
        user_id=user.id,
        name="Jane Recruiter",
        email="jane@acme.com",
        company="Acme",
        role="Platform Engineer",
        status="new",
    )
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return contact


def test_templates_seed_and_crud_are_user_scoped(api_client, db_session):
    client, current_user = api_client
    user_one = _create_user(db_session, "owner@example.com")
    user_two = _create_user(db_session, "other@example.com")
    current_user["value"] = user_one

    first_list = client.get("/api/templates")
    assert first_list.status_code == 200
    seeded_templates = first_list.json()["templates"]
    assert len(seeded_templates) == len(STARTER_PROMPT_PRESETS)
    assert {template["kind"] for template in seeded_templates} == {"prompt"}

    second_list = client.get("/api/templates")
    assert second_list.status_code == 200
    assert len(second_list.json()["templates"]) == len(STARTER_PROMPT_PRESETS)

    for preset in seeded_templates:
        assert client.delete(f"/api/templates/{preset['id']}").status_code == 200
    assert client.get("/api/templates").json()["templates"] == []

    # Re-seed for the remaining CRUD assertions in this test.
    for preset in STARTER_PROMPT_PRESETS:
        client.post("/api/templates", json={"kind": "prompt", **preset})
    seeded_templates = client.get("/api/templates").json()["templates"]

    editable_prompt_id = seeded_templates[0]["id"]
    prompt_update = client.put(
        f"/api/templates/{editable_prompt_id}",
        json={"body": "Use a warmer opening but keep the close tight."},
    )
    assert prompt_update.status_code == 200
    assert prompt_update.json()["body"] == "Use a warmer opening but keep the close tight."

    created = client.post(
        "/api/templates",
        json={
            "kind": "email",
            "name": "Founder follow-up",
            "subject": "Hi {name} from {company}",
            "body": "Hello {name},\nI'm {your_name} reaching out about the {role} opening.",
        },
    )
    assert created.status_code == 201
    email_template_id = created.json()["id"]

    email_only = client.get("/api/templates?kind=email")
    assert email_only.status_code == 200
    assert [template["name"] for template in email_only.json()["templates"]] == ["Founder follow-up"]

    current_user["value"] = user_two

    assert client.get(f"/api/templates/{email_template_id}").status_code == 404
    assert (
        client.put(
            f"/api/templates/{editable_prompt_id}",
            json={"body": "This should not be allowed."},
        ).status_code
        == 404
    )
    assert client.delete(f"/api/templates/{email_template_id}").status_code == 404


def test_draft_route_accepts_optional_template_and_prompt_ids(api_client, db_session, monkeypatch):
    client, current_user = api_client
    user = _create_user(db_session, "drafter@example.com")
    current_user["value"] = user

    captured = {}

    def _fake_create_drafts(db, request_user, use_llm, attachment_paths=None, template_id=None, prompt_id=None):
        captured.update(
            {
                "db": db,
                "user_id": request_user.id,
                "use_llm": use_llm,
                "attachment_paths": attachment_paths,
                "template_id": template_id,
                "prompt_id": prompt_id,
            }
        )
        return {
            "success": 0,
            "failed": 0,
            "total": 0,
            "attachments": 0,
            "remaining_credits": request_user.credits,
            "errors": [],
            "progress": [],
        }

    monkeypatch.setattr(
        "src.api.routes_campaigns.campaign_service.create_drafts_for_new_contacts",
        _fake_create_drafts,
    )

    response = client.post(
        "/api/draft",
        data={"use_llm": "true", "template_id": "7", "prompt_id": "9"},
        files={"attachments": ("placeholder.pdf", b"%PDF-1.4\nplaceholder", "application/pdf")},
    )

    assert response.status_code == 200
    assert captured["user_id"] == user.id
    assert captured["use_llm"] is True
    assert captured["template_id"] == 7
    assert captured["prompt_id"] == 9
    assert len(captured["attachment_paths"]) == 1
    assert captured["attachment_paths"][0].endswith(".pdf")

    invalid_upload = client.post(
        "/api/draft",
        files={"attachments": ("not-a-pdf.txt", b"not a PDF", "text/plain")},
    )
    assert invalid_upload.status_code == 400


def test_create_drafts_applies_email_template_placeholders(db_session):
    user = _create_user(db_session, "template-owner@example.com")
    _create_profile(db_session, user)
    contact = _create_contact(db_session, user)
    template = Template(
        user_id=user.id,
        kind="email",
        name="Direct intro",
        subject="Hi {name} — {your_name} for {company}",
        body="Hi {name},\nI saw the {role} opening at {company}.\n\nThanks,\n{your_name}",
    )
    db_session.add(template)
    db_session.commit()
    db_session.refresh(template)

    with patch("src.application.campaign_service.GmailAdapter") as mock_gmail_adapter:
        mock_gmail = MagicMock()
        mock_gmail.authenticate.return_value = True
        mock_gmail.create_draft.return_value = {"id": "draft_123"}
        mock_gmail_adapter.return_value = mock_gmail

        result = campaign_service.create_drafts_for_new_contacts(
            db=db_session,
            user=user,
            use_llm=False,
            attachment_paths=["resume.pdf"],
            template_id=template.id,
        )

    assert result["success"] == 1
    args = mock_gmail.create_draft.call_args.args
    assert args[0] == "jane@acme.com"
    assert args[1] == "Hi Jane Recruiter — Alex Johnson for Acme"
    assert "Platform Engineer opening at Acme" in args[2]
    assert args[2].endswith("I've attached my resume for your reference.")


def test_create_drafts_passes_prompt_preset_to_llm_generator(db_session):
    user = _create_user(db_session, "prompt-owner@example.com")
    _create_profile(db_session, user)
    _create_contact(db_session, user)
    prompt_template = Template(
        user_id=user.id,
        kind="prompt",
        name="Technical depth",
        body="Focus on distributed systems experience and measurable impact.",
    )
    db_session.add(prompt_template)
    db_session.commit()
    db_session.refresh(prompt_template)

    mock_generator = MagicMock()
    mock_generator.generate.return_value = {"subject": "Subject", "body": "Body copy"}

    with patch("src.application.campaign_service._get_generator", return_value=mock_generator), patch(
        "src.application.campaign_service.GmailAdapter"
    ) as mock_gmail_adapter:
        mock_gmail = MagicMock()
        mock_gmail.authenticate.return_value = True
        mock_gmail.create_draft.return_value = {"id": "draft_456"}
        mock_gmail_adapter.return_value = mock_gmail

        result = campaign_service.create_drafts_for_new_contacts(
            db=db_session,
            user=user,
            use_llm=True,
            prompt_id=prompt_template.id,
        )

    assert result["success"] == 1
    _, kwargs = mock_generator.generate.call_args
    assert kwargs["custom_note"] == prompt_template.body
    assert kwargs["user_profile"]["full_name"] == "Alex Johnson"


def test_sync_drafts_route_returns_envelope(api_client, db_session):
    client, current_user = api_client
    user = _create_user(db_session, "sync@example.com")
    current_user["value"] = user

    draft = EmailLog(
        id=123,
        user_id=user.id,
        recipient_email="draft@example.com",
        recipient_name="Draft Person",
        company="Draft Co",
        subject="Draft subject",
        body="Draft body",
        status="draft",
        created_at=datetime.utcnow(),
        gmail_draft_id="gmail-draft-1",
    )

    with patch("src.application.campaign_service._reconcile_draft_logs", return_value=([draft], True)) as mock_reconcile:
        response = client.post("/api/drafts/sync")

    assert response.status_code == 200
    payload = response.json()
    assert payload["drafts"][0]["recipient_email"] == "draft@example.com"
    assert payload["drafts"][0]["gmail_draft_id"] == "gmail-draft-1"
    assert payload["synced_at"]
    assert payload["status"] == "gmail_checked"
    mock_reconcile.assert_called_once_with(db_session, user.id)


def test_user_profile_supports_multiline_sign_off(db_session):
    user = _create_user(db_session, "profile@example.com")
    multiline_sign_off = "Best regards,\nAlex Johnson\n+1 555-0101"
    _create_profile(db_session, user, sign_off=multiline_sign_off)

    stored_profile = db_session.query(UserProfile).filter(UserProfile.user_id == user.id).first()

    assert stored_profile.email_sign_off == multiline_sign_off
    assert stored_profile.to_dict()["email_sign_off"] == multiline_sign_off


def test_template_validation_and_non_llm_signature_are_safe(api_client):
    client, _ = api_client
    invalid_email = client.post(
        "/api/templates",
        json={"kind": "email", "name": "  ", "subject": " ", "body": " "},
    )
    assert invalid_email.status_code == 422

    message = EmailGenerator().generate(
        {"recruiter_name": "Jane", "company": "Acme", "role": "Engineer"},
        {
            "full_name": "Alex Johnson",
            "degree": "MS",
            "university": "Stanford",
            "current_title": "Engineer",
            "current_company": "ExampleAI",
            "experience_summary": "built systems",
            "email_sign_off": "Best regards,\nAlex Johnson",
        },
    )
    assert message["body"].endswith("Best regards,\nAlex Johnson")
    assert message["body"].count("Alex Johnson") == 1
