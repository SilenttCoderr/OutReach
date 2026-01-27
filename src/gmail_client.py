"""
Gmail Client Module
Handles Gmail API integration for sending emails and creating drafts.
"""

import base64
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path
from typing import Optional, Dict, List
import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


# Gmail API scopes - only request what we need
SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose'
]

# Token and credentials paths
TOKEN_FILE = 'token.json'
CREDENTIALS_FILE = 'credentials.json'


class GmailClient:
    """Gmail API client for sending emails and creating drafts."""
    
    def __init__(self, user=None):
        self.creds = None
        self.service = None
        self.user_email = None
        self.user = user
        
        # Load client config from env or file
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        
        # Fallback to credentials.json if env vars missing (for backward compat or dev)
        if not self.client_id and os.path.exists(CREDENTIALS_FILE):
            # Attempt to read from file if needed, but for now assume env or param
            pass

    def authenticate(self) -> bool:
        """Authenticate with Gmail API using User object."""
        if not self.user:
            print("Error: No user provided for GmailClient")
            return False
            
        if not self.user.access_token:
            print(f"Error: User {self.user.email} has no access token")
            return False
            
        try:
            # Construct credentials from user data
            from google.oauth2.credentials import Credentials
            
            token_expiry = self.user.token_expiry
            
            self.creds = Credentials(
                token=self.user.access_token,
                refresh_token=self.user.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.client_id,
                client_secret=self.client_secret,
                scopes=SCOPES,
                expiry=token_expiry
            )
            
            # Refresh if expired
            if self.creds.expired and self.creds.refresh_token:
                try:
                    self.creds.refresh(Request())
                    # Update user token in DB - ideally this should be a callback or we do it here if we have DB access
                    # But GmailClient doesn't have DB session. 
                    # For now, we utilize the refreshed credentials in memory.
                    # TODO: Implement token update callback
                except Exception as e:
                    print(f"Error refreshing token: {e}")
                    return False
            
            self.service = build('gmail', 'v1', credentials=self.creds)
            self.user_email = self.user.email
            return True
            
        except Exception as e:
            print(f"Authentication error: {e}")
            return False
    
    def _create_message(
        self,
        to: str,
        subject: str,
        body: str,
        attachment_paths: Optional[list] = None
    ) -> Dict:
        """Create email message in Gmail API format with multiple attachments."""
        message = MIMEMultipart()
        message['to'] = to
        message['from'] = self.user_email
        message['subject'] = subject
        
        # Add body
        message.attach(MIMEText(body, 'plain'))
        
        # Add attachments if provided
        if attachment_paths:
            for attachment_path in attachment_paths:
                if attachment_path and os.path.exists(attachment_path):
                    path = Path(attachment_path)
                    with open(path, 'rb') as f:
                        part = MIMEBase('application', 'octet-stream')
                        part.set_payload(f.read())
                    
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename="{path.name}"'
                    )
                    message.attach(part)
        
        # Encode message
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        return {'raw': raw}
    
    def create_draft(
        self,
        to: str,
        subject: str,
        body: str,
        attachment_paths: Optional[list] = None
    ) -> Optional[Dict]:
        """Create a draft email."""
        if not self.service:
            if not self.authenticate():
                return None
        
        try:
            message = self._create_message(to, subject, body, attachment_paths)
            draft = self.service.users().drafts().create(
                userId='me',
                body={'message': message}
            ).execute()
            
            return {
                'id': draft['id'],
                'message_id': draft['message']['id'],
                'status': 'draft'
            }
        except HttpError as e:
            print(f"Error creating draft: {e}")
            return None
    
    def send_draft(self, draft_id: str) -> Optional[Dict]:
        """Send an existing draft."""
        if not self.service:
            if not self.authenticate():
                return None
        
        try:
            sent = self.service.users().drafts().send(
                userId='me',
                body={'id': draft_id}
            ).execute()
            
            return {
                'id': sent['id'],
                'thread_id': sent.get('threadId'),
                'status': 'sent'
            }
        except HttpError as e:
            print(f"Error sending draft: {e}")
            return None
    
    def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        attachment_path: Optional[str] = None
    ) -> Optional[Dict]:
        """Send an email directly."""
        if not self.service:
            if not self.authenticate():
                return None
        
        try:
            message = self._create_message(to, subject, body, attachment_path)
            sent = self.service.users().messages().send(
                userId='me',
                body=message
            ).execute()
            
            return {
                'id': sent['id'],
                'thread_id': sent.get('threadId'),
                'status': 'sent'
            }
        except HttpError as e:
            print(f"Error sending email: {e}")
            return None
    
    def send_batch(
        self,
        emails: List[Dict],
        delay_seconds: int = 30,
        attachment_path: Optional[str] = None,
        create_drafts: bool = False
    ) -> List[Dict]:
        """
        Send multiple emails with rate limiting.
        
        Args:
            emails: List of dicts with 'to', 'subject', 'body' keys
            delay_seconds: Delay between sends
            attachment_path: Optional attachment
            create_drafts: If True, create drafts instead of sending
        
        Returns:
            List of results
        """
        results = []
        total = len(emails)
        
        for i, email in enumerate(emails, 1):
            print(f"Processing {i}/{total}: {email.get('to')}")
            
            if create_drafts:
                result = self.create_draft(
                    email['to'],
                    email['subject'],
                    email['body'],
                    attachment_path
                )
            else:
                result = self.send_email(
                    email['to'],
                    email['subject'],
                    email['body'],
                    attachment_path
                )
            
            if result:
                result['to'] = email['to']
                results.append(result)
            else:
                results.append({
                    'to': email['to'],
                    'status': 'failed'
                })
            
            # Rate limiting (skip delay on last email)
            if i < total and delay_seconds > 0:
                print(f"  Waiting {delay_seconds}s before next email...")
                time.sleep(delay_seconds)
        
        return results
    
    def test_connection(self) -> bool:
        """Test Gmail API connection."""
        if self.authenticate():
            print("Gmail API connection successful!")
            return True
        return False
