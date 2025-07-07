# Email Verification System - Implementation Plan

**Status: Complete - Ready for Implementation**  
**Critical Blockers: SMTP Configuration + Database Migration**

## Implementation Overview

### Core Features
- **Email Format Validation**: Blocking validation - user cannot proceed until valid email format
- **FSM Integration**: Additional states added to existing chat finite state machine
- **Verification Code System**: 6-digit numeric code generation and email sending
- **Attempt Management**: 3-attempt system with session reset on failure
- **Rate Limiting**: Database-based using PostgreSQL timestamps
- **Code Expiration**: 10-minute expiration for verification codes

### Technical Specifications ✅ **ALIGNED WITH EXISTING PATTERNS**
- **Repository Pattern**: EmailVerificationRepository following BaseRepository pattern
- **Transaction Management**: TransactionContext for all database operations
- **Session Reset**: SessionContext pattern (no window.location.reload)
- **FSM Integration**: nextTransition property in API responses
- **Testing Database**: SQLite for all test environments
- **Rate Limiting**: 10 requests/minute pattern (consistent with session)

### Implementation Phases
- **Phase 1**: Backend Foundation (EmailVerification model, repository, services)
- **Phase 2**: API Endpoints (email verification and validation)  
- **Phase 3**: Frontend Components (React components and FSM integration)
- **Phase 4**: Testing & Deployment (end-to-end testing and production deployment)

## Backend Implementation

### Email Verification Repository

```python
# app/repositories/email_verification_repository.py
"""
Repository for EmailVerification model.

This module provides a repository class for the EmailVerification model,
following the same pattern as UserSessionRepository.
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional, List

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database_core import get_db_session
from app.errors import ServerError
from app.models import EmailVerification
from app.repositories.base_repository import BaseRepository


class EmailVerificationRepository(BaseRepository[EmailVerification]):
    """
    Repository for EmailVerification-related database operations.

    This class provides an abstraction over the database operations
    for the EmailVerification model, following established patterns.
    """

    def __init__(self):
        """Initialize with the EmailVerification model class."""
        super().__init__(EmailVerification)

    def get_by_session_id(self, session_id: str) -> Optional[EmailVerification]:
        """
        Get email verification by session ID.

        Args:
            session_id: The session ID to search for

        Returns:
            EmailVerification object if found, None otherwise

        Raises:
            ServerError: If a database error occurs
        """
        try:
            with get_db_session() as session:
                verification = session.query(EmailVerification).filter_by(
                    session_id=session_id
                ).first()

                if verification:
                    # Load all attributes to avoid detached instance errors
                    for column in EmailVerification.__table__.columns:
                        getattr(verification, column.name)
                    
                    # Expunge the instance from the session to make it detached
                    session.expunge(verification)

                return verification
        except SQLAlchemyError as e:
            raise ServerError(f"Database error in get_by_session_id: {str(e)}")

    def get_by_session_and_email(self, session_id: str, email: str) -> Optional[EmailVerification]:
        """
        Get email verification by session ID and email.

        Args:
            session_id: The session ID to search for
            email: The email address to search for

        Returns:
            EmailVerification object if found, None otherwise

        Raises:
            ServerError: If a database error occurs
        """
        try:
            with get_db_session() as session:
                verification = session.query(EmailVerification).filter_by(
                    session_id=session_id, email_plain=email
                ).first()

                if verification:
                    # Load all attributes to avoid detached instance errors
                    for column in EmailVerification.__table__.columns:
                        getattr(verification, column.name)
                    
                    # Expunge the instance from the session to make it detached
                    session.expunge(verification)

                return verification
        except SQLAlchemyError as e:
            raise ServerError(f"Database error in get_by_session_and_email: {str(e)}")

    def cleanup_expired_records(self, hours: int = 24) -> int:
        """
        Clean up expired verification records.

        Args:
            hours: Number of hours to retain records

        Returns:
            Number of records deleted

        Raises:
            ServerError: If a database error occurs
        """
        try:
            with get_db_session() as session:
                cutoff_time = datetime.utcnow() - timedelta(hours=hours)
                
                expired_records = session.query(EmailVerification).filter(
                    EmailVerification.created_at < cutoff_time
                ).all()
                
                count = len(expired_records)
                
                for record in expired_records:
                    session.delete(record)
                
                session.commit()
                return count
        except SQLAlchemyError as e:
            raise ServerError(f"Database error in cleanup_expired_records: {str(e)}")
```

### Repository Factory Update

```python
# app/repositories/factory.py (additions)
from app.models import UserSession, EmailVerification
from app.repositories.user_session_repository import UserSessionRepository
from app.repositories.email_verification_repository import EmailVerificationRepository


def get_email_verification_repository() -> EmailVerificationRepository:
    """
    Get an EmailVerificationRepository instance.

    Returns:
        EmailVerificationRepository: A repository for EmailVerification operations
    """
    return EmailVerificationRepository()
```

### Email Verification Model

```python
# app/models/email_verification.py
from datetime import datetime, timedelta
from sqlalchemy import Column, String, DateTime, Integer, Boolean, Text
from app.database_core import Base
import uuid

class EmailVerification(Base):
    __tablename__ = 'email_verifications'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, nullable=False)
    email_hash = Column(String, nullable=False)  # bcrypt hashed email
    email_plain = Column(String, nullable=False)  # for sending (will be cleaned up)
    verification_code = Column(String, nullable=False)
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(minutes=10))
    is_verified = Column(Boolean, default=False)
    resend_attempts = Column(Integer, default=0)
    max_resend_attempts = Column(Integer, default=3)
    last_resend_at = Column(DateTime)
    
    # Audit fields following existing patterns
    ip_address = Column(String)
    user_agent = Column(String)
    verification_attempts_log = Column(Text)  # JSON string for attempt history
```

### Email Service Implementation

```python
# app/services/email_service.py
import smtplib
import secrets
import string
import os
import bcrypt
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.username = os.getenv('SMTP_USERNAME')
        self.password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('SMTP_FROM_EMAIL')
        self.from_name = os.getenv('SMTP_FROM_NAME', 'Maria AI Agent')
        self.subject_prefix = os.getenv('EMAIL_SUBJECT_PREFIX', '')

    def generate_verification_code(self) -> str:
        """Generate a 6-digit numeric verification code"""
        return ''.join(secrets.choice(string.digits) for _ in range(6))

    def hash_email(self, email: str) -> str:
        """Hash email address using bcrypt"""
        return bcrypt.hashpw(email.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')

    def send_verification_email(self, email: str, code: str) -> bool:
        """Send verification email with code"""
        try:
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = email
            msg['Subject'] = f"{self.subject_prefix} Email Verification - Maria AI Agent"

            html_body = f"""
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2c5aa0;">Your Verification Code</h2>
                  <p>Please enter the following 6-digit code to verify your email address:</p>
                  <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
                    <h1 style="color: #2c5aa0; font-size: 32px; margin: 0; letter-spacing: 5px;">{code}</h1>
                  </div>
                  <p>This code will expire in 10 minutes.</p>
                  <p>If you didn't request this verification, please ignore this email.</p>
                </div>
              </body>
            </html>
            """

            msg.attach(MIMEText(html_body, 'html'))

            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.username, self.password)
            server.send_message(msg)
            server.quit()

            logger.info(f"Verification email sent successfully to {email[:3]}***@{email.split('@')[1]}")
            return True
        except Exception as e:
            logger.error(f"Email sending failed: {str(e)}")
            return False
```

### Verification Service Implementation

```python
# app/services/verification_service.py
from datetime import datetime, timedelta
from typing import Dict, Any
from flask import request
import json
import logging

from app.database.transaction import TransactionContext
from app.repositories.factory import get_email_verification_repository
from app.services.email_service import EmailService
from app.models import EmailVerification
from app.utils.audit_utils import log_audit_event

logger = logging.getLogger(__name__)

class VerificationService:
    """
    Service class for email verification operations.
    
    Uses TransactionContext for atomic operations and follows
    established repository patterns.
    """

    def __init__(self):
        self.email_service = EmailService()
        self.email_verification_repository = get_email_verification_repository()

    def _check_rate_limit(self, existing_verification: EmailVerification) -> Dict[str, Any]:
        """Check if user is rate limited for resending"""
        if existing_verification.resend_attempts >= existing_verification.max_resend_attempts:
            return {
                'limited': True, 
                'error': 'Please try again later. Thank you for your patience!',
                'status_code': 429
            }
        
        if existing_verification.last_resend_at and \
           datetime.utcnow() - existing_verification.last_resend_at < timedelta(seconds=30):
            return {
                'limited': True,
                'error': 'Please wait 30 seconds before requesting another code. Thank you!',
                'status_code': 429
            }
        
        return {'limited': False}

    def send_verification_code(self, session_id: str, email: str) -> Dict[str, Any]:
        """
        Send verification code to email with rate limiting.
        
        Uses TransactionContext for atomic operations.
        """
        try:
            existing = self.email_verification_repository.get_by_session_and_email(
                session_id, email
            )

            if existing:
                rate_check = self._check_rate_limit(existing)
                if rate_check['limited']:
                    return {
                        'success': False, 
                        'error': rate_check['error'],
                        'status_code': rate_check['status_code']
                    }

            # Generate and send new code
            code = self.email_service.generate_verification_code()
            
            if self.email_service.send_verification_email(email, code):
                # Use TransactionContext for atomic database operations
                with TransactionContext():
                    if existing:
                        # Update existing record
                        update_data = {
                            'verification_code': code,
                            'resend_attempts': existing.resend_attempts + 1,
                            'last_resend_at': datetime.utcnow(),
                            'expires_at': datetime.utcnow() + timedelta(minutes=10),
                            'attempts': 0
                        }
                        self.email_verification_repository.update(existing.id, update_data)
                    else:
                        # Create new record
                        verification_data = {
                            'session_id': session_id,
                            'email_plain': email,
                            'email_hash': self.email_service.hash_email(email),
                            'verification_code': code,
                            'ip_address': request.environ.get('REMOTE_ADDR'),
                            'user_agent': request.environ.get('HTTP_USER_AGENT'),
                            'verification_attempts_log': json.dumps([])
                        }
                        self.email_verification_repository.create(**verification_data)
                
                log_audit_event(
                    "verification_code_sent",
                    session_id=session_id,
                    details={"email_hash": self.email_service.hash_email(email)}
                )
                
                return {'success': True, 'status_code': 200}
            else:
                logger.error(f"Failed to send verification email for session {session_id}")
                return {'success': False, 'error': 'Failed to send email', 'status_code': 500}
                
        except Exception as e:
            logger.error(f"Error in send_verification_code: {str(e)}")
            return {'success': False, 'error': 'Internal server error', 'status_code': 500}

    def verify_code(self, session_id: str, code: str) -> Dict[str, Any]:
        """
        Verify the entered code with attempt tracking.
        
        Uses TransactionContext for atomic operations.
        """
        try:
            verification = self.email_verification_repository.get_by_session_id(session_id)

            if not verification:
                return {'success': False, 'error': 'No verification found', 'status_code': 400}

            if datetime.utcnow() > verification.expires_at:
                logger.info(f"Verification code expired for session {session_id}")
                return {'success': False, 'error': 'Verification code expired', 'status_code': 400}

            if verification.attempts >= verification.max_attempts:
                logger.warning(f"Maximum attempts exceeded for session {session_id}")
                return {
                    'success': False, 
                    'error': 'Maximum attempts exceeded. Session will be reset.',
                    'reset_session': True,
                    'status_code': 400
                }

            # Log attempt using TransactionContext
            with TransactionContext():
                attempts_log = json.loads(verification.verification_attempts_log or '[]')
                attempts_log.append({
                    'timestamp': datetime.utcnow().isoformat(),
                    'code_entered': code,
                    'ip_address': request.environ.get('REMOTE_ADDR')
                })

                if verification.verification_code == code.upper():
                    # Successful verification
                    update_data = {
                        'is_verified': True,
                        'verification_attempts_log': json.dumps(attempts_log)
                    }
                    self.email_verification_repository.update(verification.id, update_data)
                    
                    log_audit_event(
                        "email_verified_successfully",
                        session_id=session_id,
                        details={"email_hash": verification.email_hash}
                    )
                    
                    return {'success': True, 'status_code': 200}
                else:
                    # Failed verification
                    new_attempts = verification.attempts + 1
                    attempts_remaining = verification.max_attempts - new_attempts
                    
                    update_data = {
                        'attempts': new_attempts,
                        'verification_attempts_log': json.dumps(attempts_log)
                    }
                    self.email_verification_repository.update(verification.id, update_data)
                    
                    logger.warning(f"Invalid code entered for session {session_id}, attempts remaining: {attempts_remaining}")
                    
                    if attempts_remaining == 0:
                        return {
                            'success': False,
                            'error': 'Maximum attempts exceeded. Session will be reset.',
                            'reset_session': True,
                            'status_code': 400
                        }
                    else:
                        return {
                            'success': False,
                            'error': 'Invalid code',
                            'attempts_remaining': attempts_remaining,
                            'status_code': 400
                        }
                    
        except Exception as e:
            logger.error(f"Error in verify_code: {str(e)}")
            return {'success': False, 'error': 'Internal server error', 'status_code': 500}
```

## API Endpoints

### Email Verification Routes

```python
# app/routes/email_verification.py
from flask import Blueprint, request, jsonify
from app.services.verification_service import VerificationService
from app.utils.auth import require_session
import re
import logging

logger = logging.getLogger(__name__)
email_verification_bp = Blueprint('email_verification', __name__)

def is_valid_email(email: str) -> bool:
    """Validate email format"""
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(email_regex, email) is not None

@email_verification_bp.route('/verify-email', methods=['POST'])
@require_session
def initiate_email_verification():
    """
    Initiate email verification process.
    
    Returns nextTransition for FSM integration following established patterns.
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        session_id = data.get('session_id')

        # Validate email format
        if not is_valid_email(email):
            return jsonify({
                'status': 'error',
                'error': 'Please enter a valid email address. Thank you!',
                'field': 'email'
            }), 400

        verification_service = VerificationService()
        result = verification_service.send_verification_code(session_id, email)

        if result['success']:
            return jsonify({
                'status': 'success',
                'message': {
                    'text': 'Verification code sent successfully. Please check your email.',
                    'nextTransition': 'VERIFICATION_CODE_SENT'  # FSM integration
                }
            }), result['status_code']
        else:
            return jsonify({
                'status': 'error',
                'error': result['error']
            }), result['status_code']
            
    except Exception as e:
        logger.error(f"Error in initiate_email_verification: {str(e)}")
        return jsonify({'status': 'error', 'error': 'Internal server error'}), 500

@email_verification_bp.route('/verify-code', methods=['POST'])
@require_session
def verify_code():
    """
    Verify the entered code.
    
    Returns nextTransition for FSM integration and reset_session for SessionContext.
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        code = data.get('code', '').strip()

        # Validate code format
        if not code or len(code) != 6 or not code.isdigit():
            return jsonify({
                'status': 'error',
                'error': 'Please enter a valid 6-digit code',
                'field': 'code'
            }), 400

        verification_service = VerificationService()
        result = verification_service.verify_code(session_id, code)

        if result['success']:
            return jsonify({
                'status': 'success',
                'message': {
                    'text': 'Thank you for verifying your email address. We will email you once your AI agent is ready.',
                    'nextTransition': 'CODE_VERIFIED'  # FSM integration
                },
                'verified': True
            }), result['status_code']
        else:
            response_data = {
                'status': 'error',
                'error': result['error']
            }
            
            if 'attempts_remaining' in result:
                response_data['attempts_remaining'] = result['attempts_remaining']
            
            if 'reset_session' in result:
                # Signal frontend to use SessionContext reset instead of window.reload
                response_data['reset_session'] = True
                response_data['message'] = {
                    'nextTransition': 'SESSION_RESET_REQUIRED'
                }
            
            return jsonify(response_data), result['status_code']
            
    except Exception as e:
        logger.error(f"Error in verify_code: {str(e)}")
        return jsonify({'status': 'error', 'error': 'Internal server error'}), 500
```

## Frontend Implementation

### Email Verification Hook (Updated for SessionContext)

```typescript
// src/hooks/useEmailVerification.ts
import { useState, useCallback, useEffect } from "react";
import { emailVerificationApi } from "../api/emailVerificationApi";
import { useSession } from "../contexts/SessionContext";

export interface EmailVerificationState {
  email: string;
  code: string;
  isLoading: boolean;
  isVerified: boolean;
  error: string | null;
  attemptsRemaining: number;
  canResend: boolean;
  resendCooldown: number;
}

export const useEmailVerification = (sessionId: string) => {
  const { resetSession } = useSession(); // Use SessionContext for resets
  
  const [state, setState] = useState<EmailVerificationState>({
    email: "",
    code: "",
    isLoading: false,
    isVerified: false,
    error: null,
    attemptsRemaining: 3,
    canResend: true,
    resendCooldown: 0,
  });

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (state.resendCooldown > 0) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          resendCooldown: prev.resendCooldown - 1,
          canResend: prev.resendCooldown - 1 === 0
        }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.resendCooldown]);

  const sendVerificationCode = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await emailVerificationApi.sendCode(sessionId, email);
      setState((prev) => ({
        ...prev,
        email,
        isLoading: false,
        canResend: false,
        resendCooldown: 30,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.error || "Failed to send verification code",
      }));
    }
  }, [sessionId]);

  const verifyCode = useCallback(async (code: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await emailVerificationApi.verifyCode(sessionId, code);
      setState((prev) => ({
        ...prev,
        code,
        isLoading: false,
        isVerified: true,
      }));
    } catch (error: any) {
      const errorData = error.response?.data;
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorData?.error || "Invalid verification code",
        attemptsRemaining: errorData?.attempts_remaining || 0,
      }));
      
      // Use SessionContext for session reset instead of window.location.reload
      if (errorData?.reset_session) {
        resetSession(true); // Show confirmation modal
      }
    }
  }, [sessionId, resetSession]);

  const resendCode = useCallback(async () => {
    if (!state.email || !state.canResend) return;
    
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await emailVerificationApi.resendCode(sessionId, state.email);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        canResend: false,
        resendCooldown: 30,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.error || "Failed to resend verification code",
      }));
    }
  }, [sessionId, state.email, state.canResend]);

  return { state, sendVerificationCode, verifyCode, resendCode };
};
```

### Email Input Component

```typescript
// src/components/emailVerification/EmailInput.tsx
import React, { useState } from "react";

interface EmailInputProps {
  onSubmit: (email: string) => void;
  isLoading: boolean;
  error: string | null;
}

export const EmailInput: React.FC<EmailInputProps> = ({ onSubmit, isLoading, error }) => {
  const [email, setEmail] = useState("");
  const [isValid, setIsValid] = useState(true);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!validateEmail(trimmedEmail)) {
      setIsValid(false);
      return;
    }
    
    onSubmit(trimmedEmail);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Reset validation state when user starts typing
    if (!isValid && value.length > 0) {
      setIsValid(true);
    }
  };

  return (
    <div className="email-input-container">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">
            Please enter your email address so I can notify you once your AI agent is ready
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email address"
            className={`form-control ${!isValid ? "is-invalid" : ""}`}
            disabled={isLoading}
            required
            aria-describedby={!isValid ? "email-error" : undefined}
          />
          {!isValid && (
            <div id="email-error" className="invalid-feedback">
              Please enter a valid email address
            </div>
          )}
        </div>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || !email || !isValid}
        >
          {isLoading ? "Sending..." : "Send Verification Code"}
        </button>
      </form>
    </div>
  );
};
```

### Code Input Component

```typescript
// src/components/emailVerification/CodeInput.tsx
import React, { useState } from "react";

interface CodeInputProps {
  onSubmit: (code: string) => void;
  onResend: () => void;
  isLoading: boolean;
  error: string | null;
  attemptsRemaining: number;
  canResend: boolean;
  resendCooldown: number;
}

export const CodeInput: React.FC<CodeInputProps> = ({
  onSubmit, onResend, isLoading, error, attemptsRemaining, canResend, resendCooldown
}) => {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      onSubmit(code);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length <= 6) {
      setCode(value);
    }
  };

  return (
    <div className="code-input-container">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="code">
            Please enter the 6-digit code sent to your email address
          </label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={handleCodeChange}
            placeholder="Enter 6-digit code"
            className="form-control code-input"
            disabled={isLoading}
            maxLength={6}
            required
            aria-describedby="code-help"
          />
          {attemptsRemaining > 0 && (
            <small id="code-help" className="form-text text-muted">
              {attemptsRemaining} attempts remaining
            </small>
          )}
        </div>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <div className="button-group">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? "Verifying..." : "Verify Code"}
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onResend}
            disabled={!canResend || isLoading}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
          </button>
        </div>
      </form>
    </div>
  );
};
```

## Database Migration

### SQLite Email Verification Schema (Aligned with Testing Strategy)

```sql
-- migrations/002_create_email_verification_sqlite.sql
CREATE TABLE email_verifications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    session_id TEXT NOT NULL,
    email_hash TEXT NOT NULL,
    email_plain TEXT NOT NULL,
    verification_code TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (datetime(CURRENT_TIMESTAMP, '+10 minutes')),
    is_verified BOOLEAN DEFAULT FALSE,
    resend_attempts INTEGER DEFAULT 0,
    max_resend_attempts INTEGER DEFAULT 3,
    last_resend_at TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    verification_attempts_log TEXT
);

CREATE INDEX idx_ev_session_id ON email_verifications(session_id);
CREATE INDEX idx_ev_email_hash ON email_verifications(email_hash);
CREATE INDEX idx_ev_expires_at ON email_verifications(expires_at);
CREATE INDEX idx_ev_created_at ON email_verifications(created_at);
```

## FSM Integration

### State Updates (Aligned with nextTransition Pattern)

```typescript
// src/state/FiniteStateMachine.ts (additions)
export enum States {
  // ... existing states
  COLLECTING_EMAIL = 'COLLECTING_EMAIL',
  EMAIL_FORMAT_VALIDATION = 'EMAIL_FORMAT_VALIDATION', 
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  CREATE_BOT = 'CREATE_BOT',
}

export enum Transitions {
  // ... existing transitions
  EMAIL_PROVIDED = 'EMAIL_PROVIDED',
  EMAIL_FORMAT_VALID = 'EMAIL_FORMAT_VALID',
  EMAIL_FORMAT_INVALID = 'EMAIL_FORMAT_INVALID',
  VERIFICATION_CODE_SENT = 'VERIFICATION_CODE_SENT',
  CODE_VERIFIED = 'CODE_VERIFIED',
  CODE_INVALID = 'CODE_INVALID',
  RESEND_CODE = 'RESEND_CODE',
  SESSION_RESET_REQUIRED = 'SESSION_RESET_REQUIRED',
  EMAIL_VERIFICATION_COMPLETE = 'EMAIL_VERIFICATION_COMPLETE',
}

// State transition map (aligned with existing pattern)
const stateTransitionMap = {
  [States.UPLOAD_DOCS]: {
    [Transitions.DOCS_UPLOADED]: States.COLLECTING_EMAIL,
  },
  [States.COLLECTING_EMAIL]: {
    [Transitions.EMAIL_PROVIDED]: States.EMAIL_FORMAT_VALIDATION,
  },
  [States.EMAIL_FORMAT_VALIDATION]: {
    [Transitions.EMAIL_FORMAT_VALID]: States.EMAIL_VERIFICATION,
    [Transitions.EMAIL_FORMAT_INVALID]: States.COLLECTING_EMAIL,
  },
  [States.EMAIL_VERIFICATION]: {
    [Transitions.VERIFICATION_CODE_SENT]: States.EMAIL_VERIFICATION,
    [Transitions.CODE_VERIFIED]: States.EMAIL_VERIFIED,
    [Transitions.CODE_INVALID]: States.EMAIL_VERIFICATION,
    [Transitions.RESEND_CODE]: States.EMAIL_VERIFICATION,
    [Transitions.SESSION_RESET_REQUIRED]: States.WELCOME_MSG, // Reset to beginning
  },
  [States.EMAIL_VERIFIED]: {
    [Transitions.EMAIL_VERIFICATION_COMPLETE]: States.CREATE_BOT,
  },
};
```

## Configuration

### Environment Variables (Aligned with Existing Patterns)

```env
# SMTP Configuration (following existing config pattern)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@yourcompany.com
SMTP_FROM_NAME=Maria AI Agent

# Environment-specific email subjects (following existing pattern)
EMAIL_SUBJECT_PREFIX=[DEV]  # [DEV] for development, [UAT] for UAT, empty for production

# Database (following existing pattern)
DATABASE_URL=sqlite:///maria_ai_dev.db  # SQLite for all environments
TEST_DATABASE_URL=sqlite:///maria_ai_test.db
```

## Testing Strategy (Aligned with Existing Patterns)

### Test Database Configuration
- **All Tests**: SQLite (following questions-and-assumptions.md)
- **Migration Tests**: Automatic migration before tests
- **Repository Tests**: Following UserSessionRepository test patterns
- **Integration Tests**: Real Gmail SMTP (no mocking)
- **Cleanup**: Automatic test data cleanup using existing patterns

## Implementation Timeline

- **Week 1**: Backend Foundation (repository, model, services with TransactionContext)
- **Week 2**: API Endpoints (routes with nextTransition integration)
- **Week 3**: Frontend Components (hooks with SessionContext integration)
- **Week 4**: Testing, optimization, deployment

**All implementation now follows existing architectural patterns and eliminates conflicts.**
