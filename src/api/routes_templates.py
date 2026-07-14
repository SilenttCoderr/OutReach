"""Authenticated CRUD routes for user-owned email and prompt templates."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.api.dependencies import get_authenticated_user, get_db_session
from src.models import Template, User
from src.schemas.templates import (
    TemplateCreateRequest,
    TemplateDeleteResponse,
    TemplateKind,
    TemplateListResponse,
    TemplateRead,
    TemplateUpdateRequest,
)

router = APIRouter(tags=["Templates"])

STARTER_PROMPT_PRESETS = [
    {
        "name": "Concise and direct",
        "body": (
            "Keep the draft crisp and confident. Lead with my strongest relevant work, "
            "avoid filler, and end with a specific low-friction next step."
        ),
    },
    {
        "name": "Technical depth",
        "body": (
            "Emphasize technical depth, concrete systems work, and measurable impact. "
            "Use precise language and make the note feel tailored to the role."
        ),
    },
    {
        "name": "Warm and personable",
        "body": (
            "Use a warm, human tone while staying professional. Keep the message short, "
            "show genuine interest in the company, and make it sound natural rather than salesy."
        ),
    },
]


def _seed_starter_prompt_presets(db: Session, user_id: int) -> None:
    """Seed once per user, keeping an intentionally emptied library empty."""
    seeded_user = db.query(User).filter(User.id == user_id).with_for_update().one()
    if seeded_user.templates_seeded_at:
        return

    for preset in STARTER_PROMPT_PRESETS:
        db.add(
            Template(
                user_id=user_id,
                kind="prompt",
                name=preset["name"],
                body=preset["body"],
            )
        )
    seeded_user.templates_seeded_at = datetime.utcnow()
    db.commit()


def _get_user_template(db: Session, user_id: int, template_id: int) -> Template:
    template = (
        db.query(Template)
        .filter(Template.id == template_id, Template.user_id == user_id)
        .first()
    )
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


@router.get("/templates", response_model=TemplateListResponse)
async def list_templates(
    kind: Optional[TemplateKind] = Query(default=None),
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """List the current user's templates, seeding starter prompt presets on first access."""
    _seed_starter_prompt_presets(db, user.id)

    query = db.query(Template).filter(Template.user_id == user.id)
    if kind:
        query = query.filter(Template.kind == kind)

    templates = query.order_by(Template.kind.asc(), Template.created_at.asc()).all()
    return {"templates": templates}


@router.post("/templates", response_model=TemplateRead, status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: TemplateCreateRequest,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Create a user-owned email or prompt template."""
    template = Template(
        user_id=user.id,
        kind=payload.kind,
        name=payload.name,
        subject=payload.subject,
        body=payload.body,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/templates/{template_id}", response_model=TemplateRead)
async def get_template(
    template_id: int,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Get one of the current user's templates."""
    return _get_user_template(db, user.id, template_id)


@router.put("/templates/{template_id}", response_model=TemplateRead)
async def update_template(
    template_id: int,
    payload: TemplateUpdateRequest,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Update one of the current user's templates."""
    template = _get_user_template(db, user.id, template_id)
    provided_fields = payload.model_fields_set

    if template.kind == "email" and "subject" in provided_fields and not payload.subject:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Email templates require a subject")

    if "name" in provided_fields:
        template.name = payload.name
    if "subject" in provided_fields:
        template.subject = payload.subject
    if "body" in provided_fields:
        template.body = payload.body

    db.commit()
    db.refresh(template)
    return template


@router.delete("/templates/{template_id}", response_model=TemplateDeleteResponse)
async def delete_template(
    template_id: int,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db_session),
):
    """Delete one of the current user's templates."""
    template = _get_user_template(db, user.id, template_id)
    db.delete(template)
    db.commit()
    return {"status": "deleted"}
