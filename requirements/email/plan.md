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

### Technical Specifications ✅
- **Rate Limiting**: Database-based using existing PostgreSQL infrastructure
- **Security**: bcrypt hashing with salt rounds=12, database audit logging
- **Error Handling**: Standard HTTP codes with user-friendly messages
- **Testing**: Real Gmail integration with personal email for development

### Implementation Phases
- **Phase 1**: Backend Foundation (EmailVerification model, services)
- **Phase 2**: API Endpoints (email verification and validation)  
- **Phase 3**: Frontend Components (React components and FSM integration)
- **Phase 4**: Testing & Deployment (end-to-end testing and production deployment)

## Backend Implementation

### Email Verification Model

```python
# app/models/email_verification.py
from datetime import datetime, timedelta
from sqlalchemy import Column, String, DateTime, Integer, Boolean
from app.database import Base
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
    
    # Audit fields
    ip_address = Column(String)
    user_agent = Column(String)
    verification_attempts_log = Column(String)  # JSON string for attempt history
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
from app.models.email_verification import EmailVerification
from app.services.email_service import EmailService
from app.database import db_session
from flask import request
import json
import logging

logger = logging.getLogger(__name__)

class VerificationService:
    def __init__(self):
        self.email_service = EmailService()

    def _check_rate_limit(self, existing_verification) -> dict:
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

    def send_verification_code(self, session_id: str, email: str) -> dict:
        """Send verification code to email with rate limiting"""
        try:
            existing = db_session.query(EmailVerification).filter_by(
                session_id=session_id, email_plain=email
            ).first()

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
                if existing:
                    existing.verification_code = code
                    existing.resend_attempts += 1
                    existing.last_resend_at = datetime.utcnow()
                    existing.expires_at = datetime.utcnow() + timedelta(minutes=10)
                    existing.attempts = 0
                else:
                    verification = EmailVerification(
                        session_id=session_id,
                        email_plain=email,
                        email_hash=self.email_service.hash_email(email),
                        verification_code=code,
                        ip_address=request.environ.get('REMOTE_ADDR'),
                        user_agent=request.environ.get('HTTP_USER_AGENT'),
                        verification_attempts_log=json.dumps([])
                    )
                    db_session.add(verification)
                
                db_session.commit()
                logger.info(f"Verification code sent for session {session_id}")
                return {'success': True, 'status_code': 200}
            else:
                logger.error(f"Failed to send verification email for session {session_id}")
                return {'success': False, 'error': 'Failed to send email', 'status_code': 500}
                
        except Exception as e:
            logger.error(f"Error in send_verification_code: {str(e)}")
            return {'success': False, 'error': 'Internal server error', 'status_code': 500}

    def verify_code(self, session_id: str, code: str) -> dict:
        """Verify the entered code with attempt tracking"""
        try:
            verification = db_session.query(EmailVerification).filter_by(
                session_id=session_id
            ).first()

            if not verification:
                return {'success': False, 'error': 'No verification found', 'status_code': 400}

            if datetime.utcnow() > verification.expires_at:
                logger.info(f"Verification code expired for session {session_id}")
                return {'success': False, 'error': 'Verification code expired', 'status_code': 400}

            if verification.attempts >= verification.max_attempts:
                logger.warning(f"Maximum attempts exceeded for session {session_id}")
                return {'success': False, 'error': 'Maximum attempts exceeded', 'status_code': 400}

            # Log attempt
            attempts_log = json.loads(verification.verification_attempts_log or '[]')
            attempts_log.append({
                'timestamp': datetime.utcnow().isoformat(),
                'code_entered': code,
                'ip_address': request.environ.get('REMOTE_ADDR')
            })
            verification.verification_attempts_log = json.dumps(attempts_log)

            if verification.verification_code == code.upper():
                verification.is_verified = True
                db_session.commit()
                logger.info(f"Email verified successfully for session {session_id}")
                return {'success': True, 'status_code': 200}
            else:
                verification.attempts += 1
                db_session.commit()
                
                attempts_remaining = verification.max_attempts - verification.attempts
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

### Data Cleanup Service

```python
# app/services/cleanup_service.py
from datetime import datetime, timedelta
from app.models.email_verification import EmailVerification
from app.database import db_session
import logging

logger = logging.getLogger(__name__)

class CleanupService:
    def cleanup_expired_verifications(self):
        """Clean up expired verification records (24-hour retention)"""
        try:
            cutoff_time = datetime.utcnow() - timedelta(hours=24)
            
            expired_records = db_session.query(EmailVerification).filter(
                EmailVerification.created_at < cutoff_time
            ).all()
            
            for record in expired_records:
                db_session.delete(record)
            
            db_session.commit()
            logger.info(f"Cleaned up {len(expired_records)} expired verification records")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
            db_session.rollback()
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
    """Initiate email verification process"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        session_id = data.get('session_id')

        # Validate email format
        if not is_valid_email(email):
            return jsonify({
                'error': 'Please enter a valid email address. Thank you!',
                'field': 'email'
            }), 400

        verification_service = VerificationService()
        result = verification_service.send_verification_code(session_id, email)

        if result['success']:
            return jsonify({'message': 'Verification code sent successfully'}), result['status_code']
        else:
            return jsonify({'error': result['error']}), result['status_code']
            
    except Exception as e:
        logger.error(f"Error in initiate_email_verification: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@email_verification_bp.route('/verify-code', methods=['POST'])
@require_session
def verify_code():
    """Verify the entered code"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        code = data.get('code', '').strip()

        # Validate code format
        if not code or len(code) != 6 or not code.isdigit():
            return jsonify({
                'error': 'Please enter a valid 6-digit code',
                'field': 'code'
            }), 400

        verification_service = VerificationService()
        result = verification_service.verify_code(session_id, code)

        if result['success']:
            return jsonify({
                'message': 'Email verified successfully',
                'verified': True
            }), result['status_code']
        else:
            response_data = {'error': result['error']}
            if 'attempts_remaining' in result:
                response_data['attempts_remaining'] = result['attempts_remaining']
            if 'reset_session' in result:
                response_data['reset_session'] = result['reset_session']
            
            return jsonify(response_data), result['status_code']
            
    except Exception as e:
        logger.error(f"Error in verify_code: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@email_verification_bp.route('/resend-code', methods=['POST'])
@require_session
def resend_verification_code():
    """Resend verification code"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        email = data.get('email', '').strip().lower()

        verification_service = VerificationService()
        result = verification_service.send_verification_code(session_id, email)

        if result['success']:
            return jsonify({'message': 'Verification code resent successfully'}), result['status_code']
        else:
            return jsonify({'error': result['error']}), result['status_code']
            
    except Exception as e:
        logger.error(f"Error in resend_verification_code: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
```

## Frontend Implementation

### Email Verification Hook

```typescript
// src/hooks/useEmailVerification.ts
import { useState, useCallback, useEffect } from "react";
import { emailVerificationApi } from "../api/emailVerificationApi";

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
      
      if (errorData?.reset_session) {
        // Reset session by reloading page
        window.location.reload();
      }
    }
  }, [sessionId]);

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

### PostgreSQL Email Verification Schema

```sql
-- migrations/002_create_email_verification.sql
CREATE TABLE email_verifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(36) NOT NULL,
    email_hash VARCHAR(255) NOT NULL,
    email_plain VARCHAR(255) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes'),
    is_verified BOOLEAN DEFAULT FALSE,
    resend_attempts INTEGER DEFAULT 0,
    max_resend_attempts INTEGER DEFAULT 3,
    last_resend_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    verification_attempts_log TEXT,
    
    INDEX idx_session_id (session_id),
    INDEX idx_email_hash (email_hash),
    INDEX idx_expires_at (expires_at),
    INDEX idx_created_at (created_at)
);

-- Create cleanup job (can be run manually or via cron)
-- DELETE FROM email_verifications WHERE created_at < NOW() - INTERVAL '24 hours';
```

## Configuration

### Environment Variables

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@yourcompany.com
SMTP_FROM_NAME=Maria AI Agent

# Environment-specific email subjects
EMAIL_SUBJECT_PREFIX=[DEV]  # [DEV] for development, [UAT] for UAT, empty for production
```

## Implementation Timeline

- **Week 1**: Backend Foundation (model, services, database)
- **Week 2**: API Endpoints (routes, validation, integration)
- **Week 3**: Frontend Components (hooks, components, FSM)
- **Week 4**: Testing, optimization, deployment

## Testing Strategy

### Development Testing
- **Email Configuration**: Use personal Gmail account in .env
- **Database**: Use existing PostgreSQL test database
- **Integration**: Real SMTP integration (no mocking)
- **Cleanup**: Automatic test data cleanup after each run

### Production Testing
- **Email Delivery**: Monitor Gmail sending quotas
- **Error Handling**: Test all error scenarios
- **Performance**: API response time monitoring
- **Security**: Rate limiting and audit logging verification
