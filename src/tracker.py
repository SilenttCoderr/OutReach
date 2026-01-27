"""
Email Tracker Module
Tracks sent emails and their statuses to prevent duplicates.
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import hashlib


class EmailTracker:
    """Tracks email sending history and status."""
    
    def __init__(self, tracking_file: str = "data/tracking.json"):
        self.tracking_file = Path(tracking_file)
        self.records: Dict[str, Dict] = {}
        self._load()
    
    def _load(self):
        """Load tracking data from file."""
        if self.tracking_file.exists():
            with open(self.tracking_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.records = data.get('records', {})
        else:
            self.records = {}
    
    def _save(self):
        """Save tracking data to file."""
        self.tracking_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.tracking_file, 'w', encoding='utf-8') as f:
            json.dump({
                'last_updated': datetime.now().isoformat(),
                'total_count': len(self.records),
                'records': self.records
            }, f, indent=2)
    
    def _generate_id(self, email: str, company: str) -> str:
        """Generate unique ID for a recruiter."""
        key = f"{email.lower()}:{company.lower()}"
        return hashlib.md5(key.encode()).hexdigest()[:12]
    
    def is_sent(self, recruiter_email: str, company: str) -> bool:
        """Check if email was already sent to this recruiter."""
        record_id = self._generate_id(recruiter_email, company)
        if record_id in self.records:
            status = self.records[record_id].get('status')
            return status in ['sent', 'draft']
        return False
    
    def add_record(
        self,
        recruiter: Dict,
        status: str = "pending",
        subject: Optional[str] = None,
        message_id: Optional[str] = None
    ) -> str:
        """
        Add or update a tracking record.
        
        Args:
            recruiter: Recruiter data dict
            status: One of 'pending', 'draft', 'sent', 'failed'
            subject: Email subject
            message_id: Gmail message ID if available
        
        Returns:
            Record ID
        """
        email = recruiter.get('recruiter_email', '')
        company = recruiter.get('company', '')
        record_id = self._generate_id(email, company)
        
        self.records[record_id] = {
            'id': record_id,
            'recruiter_name': recruiter.get('recruiter_name', ''),
            'recruiter_email': email,
            'company': company,
            'role': recruiter.get('role', ''),
            'status': status,
            'subject': subject,
            'message_id': message_id,
            'created_at': self.records.get(record_id, {}).get('created_at', datetime.now().isoformat()),
            'updated_at': datetime.now().isoformat()
        }
        
        self._save()
        return record_id
    
    def update_status(self, record_id: str, status: str, message_id: Optional[str] = None):
        """Update status of an existing record."""
        if record_id in self.records:
            self.records[record_id]['status'] = status
            self.records[record_id]['updated_at'] = datetime.now().isoformat()
            if message_id:
                self.records[record_id]['message_id'] = message_id
            self._save()
    
    def get_all(self, status: Optional[str] = None) -> List[Dict]:
        """Get all records, optionally filtered by status."""
        records = list(self.records.values())
        
        if status:
            records = [r for r in records if r.get('status') == status]
        
        # Sort by updated_at descending
        records.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
        return records
    
    def get_stats(self) -> Dict:
        """Get statistics about tracked emails."""
        stats = {
            'total': len(self.records),
            'pending': 0,
            'draft': 0,
            'sent': 0,
            'failed': 0
        }
        
        for record in self.records.values():
            status = record.get('status', 'pending')
            if status in stats:
                stats[status] += 1
        
        return stats
    
    def filter_unsent(self, recruiters: List[Dict]) -> List[Dict]:
        """Filter out recruiters who have already been contacted."""
        unsent = []
        for recruiter in recruiters:
            email = recruiter.get('recruiter_email', '')
            company = recruiter.get('company', '')
            if not self.is_sent(email, company):
                unsent.append(recruiter)
        return unsent
    
    def export_csv(self, filepath: str = "data/tracking_export.csv"):
        """Export tracking data to CSV."""
        import pandas as pd
        
        records = self.get_all()
        if not records:
            print("No records to export.")
            return
        
        df = pd.DataFrame(records)
        df.to_csv(filepath, index=False)
        print(f"Exported {len(records)} records to {filepath}")
    
    def clear_failed(self):
        """Clear all failed records to allow retry."""
        to_remove = [rid for rid, rec in self.records.items() 
                     if rec.get('status') == 'failed']
        for rid in to_remove:
            del self.records[rid]
        self._save()
        print(f"Cleared {len(to_remove)} failed records.")
