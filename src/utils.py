"""
Utility functions for the cold email outreach system.
"""

from pathlib import Path
from typing import Dict, Optional
import json
import os
from dotenv import load_dotenv


def load_env(env_file: str = ".env") -> Dict:
    """Load environment variables from .env file."""
    load_dotenv(env_file)
    
    return {
        'credentials_file': os.getenv('GOOGLE_CREDENTIALS_FILE', 'credentials.json'),
        'gmail_user': os.getenv('GMAIL_USER_EMAIL', ''),
        'email_delay': int(os.getenv('EMAIL_DELAY_SECONDS', 30)),
        'max_per_day': int(os.getenv('MAX_EMAILS_PER_DAY', 50)),
        'default_template': os.getenv('DEFAULT_TEMPLATE', 'professional')
    }


def format_number(n: int) -> str:
    """Format number with commas."""
    return f"{n:,}"


def truncate_text(text: str, max_length: int = 50) -> str:
    """Truncate text with ellipsis."""
    if len(text) <= max_length:
        return text
    return text[:max_length-3] + "..."


def get_project_root() -> Path:
    """Get the project root directory."""
    return Path(__file__).parent.parent


def ensure_dir(path: str) -> Path:
    """Ensure directory exists, create if not."""
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def read_json(filepath: str) -> Optional[Dict]:
    """Read JSON file safely."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def write_json(filepath: str, data: Dict, indent: int = 2):
    """Write data to JSON file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=indent, ensure_ascii=False)


def confirm_action(message: str) -> bool:
    """Ask user to confirm an action."""
    response = input(f"{message} (y/n): ").strip().lower()
    return response in ['y', 'yes']
