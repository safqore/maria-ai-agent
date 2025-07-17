"""
Email Service for sending verification emails.

This service handles SMTP integration with Gmail, verification code generation,
email template rendering, and proper error handling for email operations.
"""

import os
import re
import secrets
import smtplib
import string
from datetime import UTC, datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

import bcrypt
from flask import current_app

from app.utils.audit_utils import log_audit_event


class EmailService:
    """
    Service for email operations including verification code generation and sending.
    
    Handles SMTP integration with Gmail, email template rendering, and
    proper security measures including bcrypt hashing for email addresses.
    """

    def __init__(self):
        """Initialize the email service with SMTP configuration."""
        self.smtp_server = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.username = os.getenv('SMTP_USERNAME')
        self.password = os.getenv('SMTP_PASSWORD')
        self.sender_email = os.getenv('SENDER_EMAIL', 'noreply@safqore.com')
        self.sender_name = os.getenv('SENDER_NAME', 'Maria')

    def generate_verification_code(self) -> str:
        """
        Generate a 6-digit numeric verification code.
        
        Returns:
            6-digit numeric string
        """
        return ''.join(secrets.choice(string.digits) for _ in range(6))

    def hash_email(self, email: str) -> str:
        """
        Hash email address using bcrypt for storage.
        
        Args:
            email: Email address to hash
            
        Returns:
            Hashed email string
        """
        return bcrypt.hashpw(email.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')

    def validate_email_format(self, email: str) -> bool:
        """
        Validate email format using regex.
        
        Args:
            email: Email address to validate
            
        Returns:
            True if valid format, False otherwise
        """
        # More strict regex that prevents consecutive dots and other invalid patterns
        pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$'
        
        # Additional checks for common invalid patterns
        if not re.match(pattern, email):
            return False
        
        # Check for consecutive dots
        if '..' in email:
            return False
            
        # Check for dots at start or end of local part
        local_part, domain = email.split('@', 1)
        if local_part.startswith('.') or local_part.endswith('.'):
            return False
            
        # Check for dots at start or end of domain
        if domain.startswith('.') or domain.endswith('.'):
            return False
            
        return True

    def create_email_template(self, code: str, environment: str = 'development') -> tuple[str, str]:
        """
        Create email template with verification code.
        
        Args:
            code: 6-digit verification code
            environment: Environment name for subject prefix
            
        Returns:
            Tuple of (subject, html_content)
        """
        subject_prefix = f"[{environment.upper()}] " if environment != 'production' else ""
        subject = f"{subject_prefix}Your Maria AI Agent Verification Code"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Maria AI Agent - Email Verification</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .verification-code {{
                    background: #fff;
                    border: 2px solid #667eea;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    font-size: 24px;
                    font-weight: bold;
                    color: #667eea;
                    margin: 20px 0;
                    letter-spacing: 3px;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    color: #666;
                    font-size: 14px;
                }}
                .warning {{
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 5px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #856404;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Maria AI Agent</h1>
                <p>Email Verification Required</p>
            </div>
            
            <div class="content">
                <h2>Hello!</h2>
                <p>Thank you for creating your Maria AI Agent. To complete the setup process, please verify your email address using the code below:</p>
                
                <div class="verification-code">
                    {code}
                </div>
                
                <p>This verification code will expire in <strong>10 minutes</strong> for security purposes.</p>
                
                <div class="warning">
                    <strong>Security Notice:</strong> Never share this code with anyone. Maria AI Agent staff will never ask for your verification code.
                </div>
                
                <p>If you didn't request this verification code, please ignore this email.</p>
                
                <p>Best regards,<br>The Maria AI Agent Team</p>
            </div>
            
            <div class="footer">
                <p>This is an automated message from Maria AI Agent. Please do not reply to this email.</p>
                <p>&copy; 2024 Maria AI Agent. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        return subject, html_content

    def send_verification_email(self, email: str, code: str, session_id: str) -> bool:
        """
        Send verification email with the provided code.
        
        Args:
            email: Recipient email address
            code: 6-digit verification code
            session_id: Session ID for audit logging
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Validate email format
            if not self.validate_email_format(email):
                current_app.logger.warning(f"Invalid email format: {email}")
                return False

            # Check SMTP configuration
            if not all([self.username, self.password]):
                current_app.logger.error("SMTP credentials not configured")
                return False

            # Create email content
            subject, html_content = self.create_email_template(code)
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.sender_name} <{self.sender_email}>"
            msg['To'] = email
            
            # Add HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            
            # Log successful email send
            log_audit_event(
                session_id=session_id,
                event_type="email_verification_sent",
                details={
                    "email": self.hash_email(email),
                    "code_length": len(code),
                    "smtp_server": self.smtp_server
                }
            )
            
            current_app.logger.info(f"Verification email sent to {email}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            current_app.logger.error(f"SMTP authentication failed: {e}")
            return False
        except smtplib.SMTPRecipientsRefused as e:
            current_app.logger.error(f"Email recipient refused: {e}")
            return False
        except smtplib.SMTPServerDisconnected as e:
            current_app.logger.error(f"SMTP server disconnected: {e}")
            return False
        except Exception as e:
            current_app.logger.error(f"Failed to send verification email: {e}")
            return False

    def get_verification_expiry(self, minutes: int = 10) -> datetime:
        """
        Get verification code expiry time.
        
        Args:
            minutes: Minutes until expiry (default 10)
            
        Returns:
            Expiry datetime
        """
        return datetime.now(UTC) + timedelta(minutes=minutes) 