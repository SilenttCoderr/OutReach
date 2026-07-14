"""
LLM Email Generator Module

Delegates email generation to the LangGraph workflow defined in
``src.langgraph_workflow``.  The public API remains unchanged so that
existing consumers (``campaign_service``, ``cli``) continue to work.
"""

import json
import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional
from concurrent.futures import ThreadPoolExecutor

from src.langgraph_workflow import build_email_graph, EmailState

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

_executor = ThreadPoolExecutor(max_workers=2)


class AsyncLogger:
    """Async logger that writes to file without blocking."""

    def __init__(self, log_file: str = "llm_generator.log"):
        self.log_path = LOG_DIR / log_file
        self._loop = None

    def _get_loop(self):
        try:
            return asyncio.get_event_loop()
        except RuntimeError:
            return None

    def _write_sync(self, message: str):
        with open(self.log_path, "a", encoding="utf-8") as f:
            f.write(message + "\n")

    async def _write_async(self, message: str):
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(_executor, self._write_sync, message)

    def _format_message(self, level: str, message: str, **kwargs) -> str:
        timestamp = datetime.now().isoformat()
        log_entry = {"timestamp": timestamp, "level": level, "message": message, **kwargs}
        return json.dumps(log_entry)

    def log(self, level: str, message: str, **kwargs):
        formatted = self._format_message(level, message, **kwargs)
        loop = self._get_loop()
        if loop and loop.is_running():
            asyncio.create_task(self._write_async(formatted))
        else:
            self._write_sync(formatted)

    def info(self, message: str, **kwargs):
        self.log("INFO", message, **kwargs)

    def error(self, message: str, **kwargs):
        self.log("ERROR", message, **kwargs)

    def debug(self, message: str, **kwargs):
        self.log("DEBUG", message, **kwargs)

    def warning(self, message: str, **kwargs):
        self.log("WARNING", message, **kwargs)


logger = AsyncLogger()


class LLMEmailGenerator:
    """Generates personalised emails via a LangGraph workflow.

    Public API is identical to the previous linear implementation:
    - ``.generate(recruiter, ...) -> {"subject": str, "body": str}``
    - ``.generate_batch(recruiters, ...) -> list``
    - ``.preview_email(recruiter, ...) -> str``
    - ``.get_available_templates() -> list``
    """

    def __init__(self):
        logger.info("Initializing LLMEmailGenerator (LangGraph)")
        self.graph = build_email_graph()
        logger.info("LLMEmailGenerator initialised — graph compiled")

    # ------------------------------------------------------------------
    # Public API (unchanged signatures)
    # ------------------------------------------------------------------

    def generate(
        self,
        recruiter: Dict,
        user_profile: Dict,
        template_name: str = "professional",
        custom_note: Optional[str] = None,
        has_attachments: bool = False,
    ) -> Dict:
        """Generate a personalised email using the LangGraph workflow.

        Returns:
            Dict with ``subject`` and ``body`` keys.
        """
        company = recruiter.get("company", "Unknown")
        email = recruiter.get("recruiter_email", "")

        logger.info(
            "Generating email via LangGraph",
            company=company,
            email=email,
            has_attachments=has_attachments,
        )

        initial_state: EmailState = {
            "recruiter": recruiter,
            "user_profile": user_profile,
            "has_attachments": has_attachments,
            "prompt_instructions": custom_note or "",
        }

        start_time = datetime.now()
        result = self.graph.invoke(initial_state)
        duration_ms = (datetime.now() - start_time).total_seconds() * 1000

        subject = result.get("subject", "")
        body = result.get("body", "")
        used_fallback = result.get("used_fallback", False)
        fallback_reason = result.get("fallback_reason", "")

        logger.info(
            "Email generated",
            company=company,
            subject_length=len(subject),
            body_length=len(body),
            duration_ms=round(duration_ms, 2),
            used_fallback=used_fallback,
            fallback_reason=fallback_reason,
        )

        response = {"subject": subject, "body": body}
        if used_fallback:
            response["used_fallback"] = True
            response["fallback_reason"] = fallback_reason
        return response

    def generate_batch(self, recruiters: list, user_profile: Dict, template_name: str = "professional") -> list:
        """Generate emails for multiple recruiters."""
        logger.info("Starting batch generation", count=len(recruiters))
        results = []

        for i, recruiter in enumerate(recruiters):
            try:
                result = self.generate(recruiter, user_profile, template_name)
                results.append(
                    {
                        "recruiter": recruiter,
                        "subject": result["subject"],
                        "body": result["body"],
                        "status": "generated",
                    }
                )
            except Exception as e:
                logger.error(
                    "Batch item failed",
                    index=i,
                    company=recruiter.get("company", "Unknown"),
                    error=str(e),
                )
                results.append(
                    {
                        "recruiter": recruiter,
                        "subject": None,
                        "body": None,
                        "status": "error",
                        "error": str(e),
                    }
                )

        success_count = sum(1 for r in results if r["status"] == "generated")
        logger.info("Batch generation complete", total=len(recruiters), success=success_count)
        return results

    def preview_email(self, recruiter: Dict, user_profile: Dict, template_name: str = "professional") -> str:
        """Generate a formatted preview of the email."""
        result = self.generate(recruiter, user_profile, template_name)
        subject = result["subject"]
        body = result["body"]

        preview = f"""
{'=' * 60}
TO: {recruiter.get('recruiter_email', 'N/A')}
SUBJECT: {subject}
{'=' * 60}

{body}

{'=' * 60}
"""
        return preview

    def get_available_templates(self) -> list:
        """For compatibility — LLM generates dynamically via LangGraph."""
        return ["llm-generated"]
