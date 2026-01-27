"""
Data Processor Module
Handles loading and processing recruiter data from CSV/JSON files.
"""

import pandas as pd
from pathlib import Path
from typing import List, Dict, Optional
import json


class DataProcessor:
    """Processes recruiter data from CSV files."""
    
    def __init__(self, data_path: Optional[str] = None):
        self.data_path = Path(data_path) if data_path else None
        self.recruiters: List[Dict] = []
    
    def load_csv(self, filepath: str) -> List[Dict]:
        """Load recruiter data from CSV file. Supports both standard and Apollo.io format."""
        df = pd.read_csv(filepath)
        
        # Check if this is an Apollo.io export (has 'First Name' column)
        if 'First Name' in df.columns:
            df = self._convert_apollo_format(df)
        
        # Validate required columns
        required_cols = ['recruiter_name', 'recruiter_email', 'company', 'role']
        missing = [col for col in required_cols if col not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns: {missing}")
        
        # Fill optional columns with defaults
        if 'company_type' not in df.columns:
            df['company_type'] = 'unknown'
        if 'notes' not in df.columns:
            df['notes'] = ''
        
        self.recruiters = df.to_dict('records')
        return self.recruiters
    
    def _convert_apollo_format(self, df: pd.DataFrame) -> pd.DataFrame:
        """Convert Apollo.io export format to standard format."""
        # Create recruiter_name from First Name + Last Name
        df['recruiter_name'] = df['First Name'].fillna('') + ' ' + df['Last Name'].fillna('')
        df['recruiter_name'] = df['recruiter_name'].str.strip()
        
        # Map other columns
        df['recruiter_email'] = df['Email']
        df['company'] = df['Company Name']
        df['role'] = df.get('Title', 'AI/ML Engineer').fillna('AI/ML Engineer')
        
        # Determine company_type based on employee count
        def get_company_type(employees):
            try:
                emp = int(employees)
                if emp < 50:
                    return 'startup'
                elif emp < 500:
                    return 'mid-size'
                else:
                    return 'enterprise'
            except (ValueError, TypeError):
                return 'unknown'
        
        if '# Employees' in df.columns:
            df['company_type'] = df['# Employees'].apply(get_company_type)
        else:
            df['company_type'] = 'unknown'
        
        # Use Industry + Keywords as notes
        df['notes'] = df.get('Industry', '').fillna('') + ' | Keywords: ' + df.get('Keywords', '').fillna('')
        df['notes'] = df['notes'].str.strip(' |: ')
        
        # Keep only the columns we need
        return df[['recruiter_name', 'recruiter_email', 'company', 'role', 'company_type', 'notes']]
    
    def load_json(self, filepath: str) -> List[Dict]:
        """Load recruiter data from JSON file."""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if isinstance(data, list):
            self.recruiters = data
        else:
            self.recruiters = data.get('recruiters', [])
        
        return self.recruiters
    
    def load(self, filepath: str) -> List[Dict]:
        """Auto-detect file type and load data."""
        path = Path(filepath)
        
        if path.suffix.lower() == '.csv':
            return self.load_csv(filepath)
        elif path.suffix.lower() == '.json':
            return self.load_json(filepath)
        else:
            raise ValueError(f"Unsupported file type: {path.suffix}")
    
    def validate_emails(self) -> List[Dict]:
        """Basic email validation."""
        import re
        email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        
        valid_recruiters = []
        invalid_emails = []
        
        for recruiter in self.recruiters:
            email = recruiter.get('recruiter_email', '')
            if email_pattern.match(email):
                valid_recruiters.append(recruiter)
            else:
                invalid_emails.append({
                    'name': recruiter.get('recruiter_name'),
                    'email': email
                })
        
        if invalid_emails:
            print(f"Warning: {len(invalid_emails)} invalid emails found:")
            for item in invalid_emails:
                print(f"  - {item['name']}: {item['email']}")
        
        return valid_recruiters
    
    def filter_by_company_type(self, company_type: str) -> List[Dict]:
        """Filter recruiters by company type."""
        return [r for r in self.recruiters 
                if r.get('company_type', '').lower() == company_type.lower()]
    
    def get_stats(self) -> Dict:
        """Get statistics about loaded data."""
        if not self.recruiters:
            return {"total": 0}
        
        company_types = {}
        for r in self.recruiters:
            ct = r.get('company_type', 'unknown')
            company_types[ct] = company_types.get(ct, 0) + 1
        
        return {
            "total": len(self.recruiters),
            "by_company_type": company_types,
            "unique_companies": len(set(r.get('company') for r in self.recruiters))
        }


def load_profile(profile_path: str = "config/profile.json") -> Dict:
    """Load user profile from JSON file."""
    with open(profile_path, 'r', encoding='utf-8') as f:
        return json.load(f)
