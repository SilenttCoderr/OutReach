"""
LangGraph Email Generation Workflow

Replaces the linear Gemini call with a graph-based workflow featuring:
- Input validation and context enrichment
- Prompt assembly
- LLM invocation with automatic retry (max 2 retries)
- Response parsing with quality checks
- Fallback to template-based email on failure
"""

import os
import logging
from typing import Dict, Optional, Literal

from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# State schema
# ---------------------------------------------------------------------------


class EmailState(TypedDict, total=False):
    """Typed state flowing through the email generation graph."""

    recruiter: Dict
    user_profile: Dict           # user's profile data from DB
    first_name: str
    company: str
    company_type: str
    notes: str
    prompt: str
    llm_response: str
    subject: str
    body: str
    has_attachments: bool
    error: Optional[str]
    retry_count: int
    used_fallback: bool
    fallback_reason: str


# ---------------------------------------------------------------------------
# Node functions
# ---------------------------------------------------------------------------


def validate_input(state: EmailState) -> dict:
    """Validate recruiter dict contains usable data and set defaults."""
    recruiter = state.get("recruiter", {})
    if not isinstance(recruiter, dict):
        return {"error": "recruiter must be a dict", "retry_count": 0, "used_fallback": False}

    profile = state.get("user_profile", {})
    if not profile or not isinstance(profile, dict):
         return {"error": "user_profile missing or invalid", "retry_count": 0, "used_fallback": False}

    return {
        "recruiter": recruiter,
        "user_profile": profile,
        "error": None,
        "retry_count": 0,
        "used_fallback": False,
        "has_attachments": state.get("has_attachments", False),
    }


def enrich_context(state: EmailState) -> dict:
    """Derive display values from recruiter data."""
    recruiter = state["recruiter"]
    recruiter_name = recruiter.get("recruiter_name", "Hiring Manager")
    first_name = recruiter_name.split()[0] if recruiter_name else "there"
    company = recruiter.get("company", "your company")
    company_type = recruiter.get("company_type", "")
    notes = recruiter.get("notes", "")

    return {
        "first_name": first_name,
        "company": company,
        "company_type": company_type,
        "notes": notes,
    }


def build_prompt(state: EmailState) -> dict:
    """Assemble the full prompt for Gemini dynamically using profile data."""
    recruiter_name = state["recruiter"].get("recruiter_name", "Hiring Manager")
    first_name = state["first_name"]
    company = state["company"]
    company_type = state["company_type"]
    notes = state["notes"]
    
    # Profile data
    profile = state["user_profile"]
    full_name = profile.get("full_name", "Candidate")
    degree = profile.get("degree", "Degree")
    university = profile.get("university", "University")
    grad_date = profile.get("graduation_date", "Graduation")
    
    current_title = profile.get("current_title", "Professional")
    current_company = profile.get("current_company", "Company")
    experience_summary = profile.get("experience_summary", "Experienced Professional")
    
    skills = ", ".join(profile.get("key_skills", []))
    highlights = "\\n".join([f"- {h}" for h in profile.get("highlights", [])])
    
    sign_off = profile.get("email_sign_off", "Best")


    prompt = f"""Role: You are a Technical Career Strategist. Your goal is to write a short, high-impact cold email for {full_name} to recruiters.

Candidate Data ({full_name}):

Current Role: {current_title} @ {current_company}
Experience Summary: {experience_summary}

Education: {degree} at {university} (Graduating {grad_date}).

Technical Edge: {skills}

Key Highlights:
{highlights}

Instructions for the AI:

Analyze {company_type} and {notes} to tailor the pitch.
Align the candidate's skills and highlights with the company context.


Subject Line: Must be professional and technical. Format: [Technical Focus/Keyword] // {full_name} ({current_company})

The Hook: Start with the current work at {current_company}. Frame the candidate based on their current title and experience.

Tone: Direct, technical, and confident. Use "I've been building..." instead of "I am looking for..."

Constraints: Max 4 sentences in the body. No "I hope you are well."

Variables:

Recruiter: {recruiter_name} (First name: {first_name})
Company: {company}
Company Type: {company_type}
Notes: {notes}

Format: Subject: [subject line]

[body]

{sign_off},
{full_name}"""

    return {"prompt": prompt}


def call_llm(state: EmailState) -> dict:
    """Call Gemini API. Increments retry_count on failure."""
    from google import genai

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not set", "retry_count": 999}
    if api_key.startswith("your_") or len(api_key) < 10:
        return {
            "error": "GEMINI_API_KEY not configured — set a valid key in .env",
            "retry_count": 999,
        }

    model_name = os.getenv("LLM_MODEL", "gemini-2.5-flash")

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model_name,
            contents=state["prompt"],
        )
        text = response.text.strip()
        logger.info("LLM call succeeded for company=%s", state.get("company", "?"))
        return {"llm_response": text, "error": None}
    except Exception as exc:
        retry = state.get("retry_count", 0) + 1
        logger.warning(
            "LLM call failed (attempt %d): %s — %s",
            retry,
            type(exc).__name__,
            str(exc),
        )
        return {"error": str(exc), "retry_count": retry}


def parse_response(state: EmailState) -> dict:
    """Extract subject and body from LLM raw text."""
    text = state.get("llm_response", "")

    # Remove markdown code blocks if the LLM wrapped its response
    if text.startswith("```"):
        text_lines = text.split("\n")
        if len(text_lines) > 2 and text_lines[-1].strip() == "```":
            text = "\n".join(text_lines[1:-1]).strip()

    lines = text.split("\n")
    subject = ""
    body_start = 0

    for i, line in enumerate(lines):
        if line.lower().startswith("subject:"):
            subject = line[8:].strip()
            body_start = i + 1
            break

    body = "\n".join(lines[body_start:]).strip()

    if not subject:
        return {"error": "parse_failed: no subject line found", "subject": "", "body": body}

    return {"subject": subject, "body": body, "error": None}


def quality_check(state: EmailState) -> dict:
    """Validate output meets minimum quality bar."""
    subject = state.get("subject", "")
    body = state.get("body", "")

    if not subject:
        return {"error": "quality_failed: empty subject"}
    if len(body) < 50:
        return {"error": f"quality_failed: body too short ({len(body)} chars)"}

    return {"error": None}


def apply_attachments(state: EmailState) -> dict:
    """Append attachment mention if flagged."""
    if state.get("has_attachments"):
        body = state.get("body", "").rstrip()
        if not body.endswith("\n"):
            body += "\n"
        body += "\nI've attached my resume for your reference."
        return {"body": body}
    return {}


def fallback_email(state: EmailState) -> dict:
    """Generate a safe template-based fallback email."""
    recruiter = state.get("recruiter", {})
    if not isinstance(recruiter, dict):
        recruiter = {}
    recruiter_name = recruiter.get("recruiter_name", "Hiring Manager")
    first_name = recruiter_name.split()[0] if recruiter_name else "there"
    company = recruiter.get("company", "your company")
    
    profile = state.get("user_profile", {})
    full_name = profile.get("full_name", "Candidate")
    current_title = profile.get("current_title", "Professional")
    current_company = profile.get("current_company", "Company")
    degree = profile.get("degree", "Degree")
    university = profile.get("university", "University")
    exp_summary = profile.get("experience_summary", "experienced professional")
    sign_off = profile.get("email_sign_off", "Best")

    subject = f"{current_title} @ {current_company} - Opportunities at {company}"
    body = (
        f"Hi {first_name},\n\n"
        f"I'm a {degree} student at {university} with experience "
        f"as a {current_title} at {current_company}, where {exp_summary}. "
        f"I'm interested in opportunities at {company}.\n\n"
        f"How can I start the interview process?\n\n"
        f"{sign_off},\n{full_name}"
    )

    if state.get("has_attachments"):
        body += "\n\nI've attached my resume for your reference."

    fallback_reason = state.get("error", "unknown")
    logger.info("Using fallback email for company=%s reason=%s", company, fallback_reason)
    return {
        "subject": subject,
        "body": body,
        "used_fallback": True,
        "fallback_reason": fallback_reason,
        "error": None,
    }


# ---------------------------------------------------------------------------
# Routing functions
# ---------------------------------------------------------------------------


def route_after_validation(state: EmailState) -> Literal["enrich_context", "fallback_email"]:
    """Skip to fallback if input validation failed."""
    if state.get("error"):
        return "fallback_email"
    return "enrich_context"


def route_after_llm(state: EmailState) -> Literal["parse_response", "call_llm", "fallback_email"]:
    """Decide next step after LLM call."""
    if state.get("error"):
        if state.get("retry_count", 0) < 2:
            return "call_llm"
        return "fallback_email"
    return "parse_response"


def route_after_parse(state: EmailState) -> Literal["quality_check", "fallback_email"]:
    """Decide next step after parsing."""
    if state.get("error"):
        return "fallback_email"
    return "quality_check"


def route_after_quality(state: EmailState) -> Literal["apply_attachments", "fallback_email"]:
    """Decide next step after quality check."""
    if state.get("error"):
        return "fallback_email"
    return "apply_attachments"


# ---------------------------------------------------------------------------
# Graph builder
# ---------------------------------------------------------------------------


def build_email_graph():
    """Compile the email generation LangGraph workflow.

    Returns a compiled graph that accepts ``EmailState`` and produces
    a dict containing at least ``subject`` and ``body``.
    """
    graph = StateGraph(EmailState)

    # --- nodes ---
    graph.add_node("validate_input", validate_input)
    graph.add_node("enrich_context", enrich_context)
    graph.add_node("build_prompt", build_prompt)
    graph.add_node("call_llm", call_llm)
    graph.add_node("parse_response", parse_response)
    graph.add_node("quality_check", quality_check)
    graph.add_node("apply_attachments", apply_attachments)
    graph.add_node("fallback_email", fallback_email)

    # --- edges ---
    graph.set_entry_point("validate_input")
    graph.add_conditional_edges("validate_input", route_after_validation)
    graph.add_edge("enrich_context", "build_prompt")
    graph.add_edge("build_prompt", "call_llm")

    graph.add_conditional_edges("call_llm", route_after_llm)
    graph.add_conditional_edges("parse_response", route_after_parse)
    graph.add_conditional_edges("quality_check", route_after_quality)

    graph.add_edge("apply_attachments", END)
    graph.add_edge("fallback_email", END)

    return graph.compile()
