# Email Verification System - Implementation Plan

**Status: Complete - Ready for Implementation**  
**Critical Blockers: SMTP Configuration + Database Migration Approval**

## Implementation Overview

### Core Features
- **Email Format Validation**: Blocking validation - user cannot proceed until valid email format
- **FSM Integration**: Additional states added to existing chat finite state machine
- **Verification Code System**: 6-digit numeric code generation and email sending
- **Attempt Management**: 3-attempt system with session reset on failure
- **Rate Limiting**: 30-second cooldown between resend requests with 3 max attempts
- **Code Expiration**: 10-minute expiration for verification codes

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

class EmailVerification(Base):
    __tablename__ = 'email_verifications'

    id = Column(String, primary_key=True)
    session_id = Column(String, nullable=False)
    email = Column(String, nullable=False)
    verification_code = Column(String, nullable=False)
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(minutes=10))
    is_verified = Column(Boolean, default=False)
    resend_attempts = Column(Integer, default=0)
    max_resend_attempts = Column(Integer, default=3)
    last_resend_at = Column(DateTime)
```

### Email Service Implementation

```python
# app/services/email_service.py
import smtplib
import secrets
import string
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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

            return True
        except Exception as e:
            print(f"Email sending failed: {str(e)}")
            return False
```

### Verification Service Implementation

```python
# app/services/verification_service.py
from datetime import datetime, timedelta
from app.models.email_verification import EmailVerification
from app.services.email_service import EmailService
from app.database import db_session

class VerificationService:
    def __init__(self):
        self.email_service = EmailService()

    def send_verification_code(self, session_id: str, email: str) -> dict:
        """Send verification code to email"""
        existing = db_session.query(EmailVerification).filter_by(
            session_id=session_id, email=email
        ).first()

        if existing:
            # Check resend limits and cooldown
            if existing.resend_attempts >= existing.max_resend_attempts:
                return {'success': False, 'error': 'Please try again later. Thank you for your patience!'}
            
            if existing.last_resend_at and \
               datetime.utcnow() - existing.last_resend_at < timedelta(seconds=30):
                return {'success': False, 'error': 'Please wait 30 seconds before requesting another code. Thank you!'}

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
                    email=email,
                    verification_code=code
                )
                db_session.add(verification)
            
            db_session.commit()
            return {'success': True}
        else:
            return {'success': False, 'error': 'Failed to send email'}

    def verify_code(self, session_id: str, code: str) -> dict:
        """Verify the entered code"""
        verification = db_session.query(EmailVerification).filter_by(
            session_id=session_id
        ).first()

        if not verification:
            return {'success': False, 'error': 'No verification found'}

        if datetime.utcnow() > verification.expires_at:
            return {'success': False, 'error': 'Verification code expired'}

        if verification.attempts >= verification.max_attempts:
            return {'success': False, 'error': 'Maximum attempts exceeded'}

        if verification.verification_code == code.upper():
            verification.is_verified = True
            db_session.commit()
            return {'success': True}
        else:
            verification.attempts += 1
            db_session.commit()
            
            attempts_remaining = verification.max_attempts - verification.attempts
            if attempts_remaining == 0:
                return {
                    'success': False,
                    'error': 'Maximum attempts exceeded. Session will be reset.',
                    'reset_session': True
                }
            else:
                return {
                    'success': False,
                    'error': 'Invalid code',
                    'attempts_remaining': attempts_remaining
                }
```

## API Endpoints

### Email Verification Routes

```python
# app/routes/email_verification.py
from flask import Blueprint, request, jsonify
from app.services.verification_service import VerificationService
from app.utils.auth import require_session

email_verification_bp = Blueprint('email_verification', __name__)

@email_verification_bp.route('/verify-email', methods=['POST'])
@require_session
def initiate_email_verification():
    """Initiate email verification process"""
    data = request.get_json()
    email = data.get('email')
    session_id = data.get('session_id')

    # Validate email format
    if not is_valid_email(email):
        return jsonify({'error': 'Please enter a valid email address. Thank you!'}), 400

    verification_service = VerificationService()
    result = verification_service.send_verification_code(session_id, email)

    if result['success']:
        return jsonify({'message': 'Verification code sent successfully'}), 200
    else:
        return jsonify({'error': result['error']}), 400

@email_verification_bp.route('/verify-code', methods=['POST'])
@require_session
def verify_code():
    """Verify the entered code"""
    data = request.get_json()
    session_id = data.get('session_id')
    code = data.get('code')

    verification_service = VerificationService()
    result = verification_service.verify_code(session_id, code)

    if result['success']:
        return jsonify({
            'message': 'Email verified successfully',
            'verified': True
        }), 200
    else:
        return jsonify({
            'error': result['error'],
            'attempts_remaining': result.get('attempts_remaining', 0)
        }), 400
```

## Frontend Implementation

### Email Verification Hook

```typescript
// src/hooks/useEmailVerification.ts
import { useState, useCallback } from "react";
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
        error: error.message || "Failed to send verification code",
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
        window.location.reload();
      }
    }
  }, [sessionId]);

  return { state, sendVerificationCode, verifyCode };
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
    if (!validateEmail(email)) {
      setIsValid(false);
      return;
    }
    onSubmit(email);
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
            onChange={(e) => {
              setEmail(e.target.value);
              setIsValid(validateEmail(e.target.value) || e.target.value === "");
            }}
            placeholder="Enter your email address"
            className={`form-control ${!isValid ? "is-invalid" : ""}`}
            disabled={isLoading}
            required
          />
          {!isValid && (
            <div className="invalid-feedback">Please enter a valid email address</div>
          )}
        </div>
        
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        
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
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              if (value.length <= 6) setCode(value);
            }}
            placeholder="Enter 6-digit code"
            className="form-control code-input"
            disabled={isLoading}
            maxLength={6}
            required
          />
          {attemptsRemaining > 0 && (
            <small className="form-text text-muted">
              {attemptsRemaining} attempts remaining
            </small>
          )}
        </div>
        
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        
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

## FSM Integration

### State Updates

```typescript
// src/state/FiniteStateMachine.ts
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
  EMAIL_VERIFICATION_COMPLETE = 'EMAIL_VERIFICATION_COMPLETE',
}

// State transition map
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
    [Transitions.CODE_VERIFIED]: States.EMAIL_VERIFIED,
    [Transitions.CODE_INVALID]: States.EMAIL_VERIFICATION,
    [Transitions.RESEND_CODE]: States.EMAIL_VERIFICATION,
  },
  [States.EMAIL_VERIFIED]: {
    [Transitions.EMAIL_VERIFICATION_COMPLETE]: States.CREATE_BOT,
  },
};
```

## Database Migration

### Email Verification Schema

```sql
-- migrations/002_create_email_verification.sql
CREATE TABLE email_verifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    session_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 10 MINUTE),
    is_verified BOOLEAN DEFAULT FALSE,
    resend_attempts INTEGER DEFAULT 0,
    max_resend_attempts INTEGER DEFAULT 3,
    last_resend_at TIMESTAMP,
    
    INDEX idx_session_id (session_id),
    INDEX idx_email (email),
    INDEX idx_expires_at (expires_at)
);
```

## Implementation Timeline

- **Week 1**: Backend Foundation (model, services, database)
- **Week 2**: API Endpoints (routes, validation, integration)
- **Week 3**: Frontend Components (hooks, components, FSM)
- **Week 4**: Testing, optimization, deployment
