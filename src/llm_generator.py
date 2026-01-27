"""
LLM Email Generator Module
Uses Gemini to generate personalized cold emails.
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

# Setup async logging
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

# Thread pool for async file operations
_executor = ThreadPoolExecutor(max_workers=2)


class AsyncLogger:
    """Async logger that writes to file without blocking."""
    
    def __init__(self, log_file: str = "llm_generator.log"):
        self.log_path = LOG_DIR / log_file
        self._loop = None
    
    def _get_loop(self):
        """Get or create event loop."""
        try:
            return asyncio.get_event_loop()
        except RuntimeError:
            return None
    
    def _write_sync(self, message: str):
        """Synchronous file write."""
        with open(self.log_path, 'a', encoding='utf-8') as f:
            f.write(message + '\n')
    
    async def _write_async(self, message: str):
        """Async file write using thread pool."""
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(_executor, self._write_sync, message)
    
    def _format_message(self, level: str, message: str, **kwargs) -> str:
        """Format log message with timestamp and metadata."""
        timestamp = datetime.now().isoformat()
        log_entry = {
            "timestamp": timestamp,
            "level": level,
            "message": message,
            **kwargs
        }
        return json.dumps(log_entry)
    
    def log(self, level: str, message: str, **kwargs):
        """Log message - async if in event loop, sync otherwise."""
        formatted = self._format_message(level, message, **kwargs)
        
        loop = self._get_loop()
        if loop and loop.is_running():
            # Schedule async write
            asyncio.create_task(self._write_async(formatted))
        else:
            # Fall back to sync write
            self._write_sync(formatted)
    
    def info(self, message: str, **kwargs):
        self.log("INFO", message, **kwargs)
    
    def error(self, message: str, **kwargs):
        self.log("ERROR", message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        self.log("DEBUG", message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self.log("WARNING", message, **kwargs)


# Global logger instance
logger = AsyncLogger()


class LLMEmailGenerator:
    """Generates personalized emails using Gemini LLM."""
    
    def __init__(self, profile_path: str = "config/profile.json"):
        logger.info("Initializing LLMEmailGenerator", profile_path=profile_path)
        self.profile = self._load_profile(profile_path)
        self._setup_gemini()
        logger.info("LLMEmailGenerator initialized successfully")
    
    def _load_profile(self, profile_path: str) -> Dict:
        """Load user profile from JSON."""
        logger.debug("Loading profile", path=profile_path)
        with open(profile_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def _setup_gemini(self):
        """Configure Gemini API."""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("GEMINI_API_KEY not set")
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.5-flash"
        logger.info("Gemini client configured", model=self.model)
    
    def _build_prompt(self, recruiter: Dict) -> str:
        """Build the prompt for Gemini."""
        recruiter_name = recruiter.get("recruiter_name", "Hiring Manager")
        first_name = recruiter_name.split()[0] if recruiter_name else "there"
        company = recruiter.get("company", "your company")
        company_type = recruiter.get("company_type", "")
        notes = recruiter.get("notes", "")
        
        prompt = f"""Role: You are a Technical Career Strategist. Your goal is to write a short, high-impact cold email for Ansh Agrawal to recruiters.

Candidate Data (Ansh):


Current Role: Data Science Intern @ Motilal Oswal Financial Services (6+ months).


Education: Final-year B.Tech CS (AI/ML) at Bennett University (Graduating May 2026).




Technical Edge: Building production-grade GraphRAG/LightRAG for entity reasoning and Supervisor-led multi-agent systems using LangGraph and Claude 3.5.


Data Edge: Developing ReAct-style SQL agents to bridge natural language and financial databases.

Instructions for the AI:

Analyze {company_type} and {notes}:


For Startups: Highlight "Agentic Workflows" and "Multi-agent systems" (speed and autonomy).


For MNCs/Fintech: Highlight "SQL-Agents" and "GraphRAG" (accuracy, structured data, and insights).


Subject Line: Must be professional and technical. Format: [Technical Focus/Keyword] // Ansh Agrawal (Motilal Oswal)

The Hook: Start with the current work at Motilal Oswal. Frame Ansh as a pre-grad professional with 6+ months of experience.



Tone: Direct, technical, and confident. Use "I've been building..." instead of "I am looking for..."

Constraints: Max 4 sentences in the body. No "I hope you are well."

Variables:

Recruiter: {recruiter_name} (First name: {first_name})

Company: {company}

Company Type: {company_type}

Notes: {notes}

Format: Subject: [subject line]

[body]

Best, Ansh"""
        
        return prompt
    
    def generate(
        self,
        recruiter: Dict,
        template_name: str = "professional",  # ignored, kept for compatibility
        custom_note: Optional[str] = None,
        has_attachments: bool = False
    ) -> Dict:
        """
        Generate a personalized email using Gemini.
        
        Returns:
            Dict with subject and body keys
        """
        company = recruiter.get("company", "Unknown")
        email = recruiter.get("recruiter_email", "")
        
        logger.info("Generating email", company=company, email=email, has_attachments=has_attachments)
        
        prompt = self._build_prompt(recruiter)
        
        try:
            start_time = datetime.now()
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            duration_ms = (datetime.now() - start_time).total_seconds() * 1000
            
            text = response.text.strip()
            
            # Parse subject and body
            lines = text.split('\n')
            subject = ""
            body_start = 0
            
            for i, line in enumerate(lines):
                if line.lower().startswith("subject:"):
                    subject = line[8:].strip()
                    body_start = i + 1
                    break
            
            body = '\n'.join(lines[body_start:]).strip()
            
            # Add attachment mention if present
            if has_attachments:
                body = body.rstrip()
                if not body.endswith('\n'):
                    body += '\n'
                body += "\nI've attached my resume for your reference."
            
            logger.info(
                "Email generated successfully",
                company=company,
                subject_length=len(subject),
                body_length=len(body),
                duration_ms=round(duration_ms, 2)
            )
            
            return {"subject": subject, "body": body}
            
        except Exception as e:
            logger.error(
                "Email generation failed",
                company=company,
                error=str(e),
                error_type=type(e).__name__
            )
            
            # Fallback to simple template if LLM fails
            recruiter_name = recruiter.get("recruiter_name", "Hiring Manager")
            first_name = recruiter_name.split()[0] if recruiter_name else "there"
            company = recruiter.get("company", "your company")
            
            return {
                "subject": f"GenAI Intern @ Motilal Oswal - AI/ML Opportunities at {company}",
                "body": f"""Hi {first_name},

I'm a final-year CS student at Bennett University with 6+ months experience as a GenAI Intern at Motilal Oswal, where I built production RAG systems and multi-agent architectures using LangChain and Claude. I'm interested in AI/ML opportunities at {company}.

How can I start the interview process?

Best,
Ansh"""
            }
    
    def generate_batch(self, recruiters: list, template_name: str = "professional") -> list:
        """Generate emails for multiple recruiters."""
        logger.info("Starting batch generation", count=len(recruiters))
        results = []
        
        for i, recruiter in enumerate(recruiters):
            try:
                result = self.generate(recruiter, template_name)
                results.append({
                    "recruiter": recruiter,
                    "subject": result["subject"],
                    "body": result["body"],
                    "status": "generated"
                })
            except Exception as e:
                logger.error(
                    "Batch item failed",
                    index=i,
                    company=recruiter.get("company", "Unknown"),
                    error=str(e)
                )
                results.append({
                    "recruiter": recruiter,
                    "subject": None,
                    "body": None,
                    "status": "error",
                    "error": str(e)
                })
        
        success_count = sum(1 for r in results if r["status"] == "generated")
        logger.info("Batch generation complete", total=len(recruiters), success=success_count)
        
        return results
    
    def preview_email(self, recruiter: Dict, template_name: str = "professional") -> str:
        """Generate a formatted preview of the email."""
        result = self.generate(recruiter, template_name)
        subject = result["subject"]
        body = result["body"]
        
        preview = f"""
{'='*60}
TO: {recruiter.get('recruiter_email', 'N/A')}
SUBJECT: {subject}
{'='*60}

{body}

{'='*60}
"""
        return preview
    
    def get_available_templates(self) -> list:
        """For compatibility - LLM generates dynamically."""
        return ["llm-generated"]
