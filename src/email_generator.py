"""
Email Generator Module
Generates personalized cold emails using templates and recruiter data.
"""

from pathlib import Path
from typing import Dict, Optional
from jinja2 import Environment, FileSystemLoader
import json


class EmailGenerator:
    """Generates personalized emails from templates."""
    
    def __init__(self, templates_dir: str = "templates", profile_path: str = "config/profile.json"):
        self.templates_dir = Path(templates_dir)
        self.profile = self._load_profile(profile_path)
        
        # Set up Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            trim_blocks=True,
            lstrip_blocks=True
        )
    
    def _load_profile(self, profile_path: str) -> Dict:
        """Load user profile from JSON."""
        with open(profile_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def get_available_templates(self) -> list:
        """List available email templates."""
        templates = []
        for f in self.templates_dir.glob("*.txt"):
            templates.append(f.stem)
        return templates
    
    def generate(
        self,
        recruiter: Dict,
        template_name: str = "professional",
        custom_note: Optional[str] = None,
        has_attachments: bool = False
    ) -> Dict:
        """
        Generate a personalized email for a recruiter.
        
        Args:
            recruiter: Dict with recruiter_name, recruiter_email, company, role, etc.
            template_name: Name of template file (without .txt)
            custom_note: Optional custom note to include
            has_attachments: Whether attachments are being added
        
        Returns:
            Dict with subject and body keys
        """
        template_file = f"{template_name}.txt"
        
        try:
            template = self.env.get_template(template_file)
        except Exception as e:
            raise ValueError(f"Template '{template_name}' not found: {e}")
        
        # Prepare context
        context = {
            "recruiter_name": recruiter.get("recruiter_name", "Hiring Manager"),
            "recruiter_email": recruiter.get("recruiter_email", ""),
            "company": recruiter.get("company", "your company"),
            "role": recruiter.get("role", "AI/ML"),
            "company_type": recruiter.get("company_type", ""),
            "company_note": custom_note or recruiter.get("notes", ""),
            **self.profile  # Include all profile data
        }
        
        # Render template
        rendered = template.render(**context)
        
        # Extract subject (first line) and body
        lines = rendered.strip().split('\n')
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
            body += "\n\nI've attached my resume for your reference."
        
        return {"subject": subject, "body": body}
    
    def generate_batch(
        self,
        recruiters: list,
        template_name: str = "professional"
    ) -> list:
        """
        Generate emails for multiple recruiters.
        
        Returns:
            List of dicts with recruiter info and generated email
        """
        results = []
        
        for recruiter in recruiters:
            try:
                result = self.generate(recruiter, template_name)
                results.append({
                    "recruiter": recruiter,
                    "subject": result["subject"],
                    "body": result["body"],
                    "status": "generated"
                })
            except Exception as e:
                results.append({
                    "recruiter": recruiter,
                    "subject": None,
                    "body": None,
                    "status": "error",
                    "error": str(e)
                })
        
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
