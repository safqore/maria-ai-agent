# Email Verification System

**Status: Ready for Implementation**  
**Critical Blockers: SMTP Configuration + Database Migration Approval**

## Core Requirements

### Email Verification Flow
- **Email Format Validation**: Blocking validation - user cannot proceed until valid email format
- **Verification Code**: 6-digit numeric code sent via email
- **Attempt Limits**: Maximum 3 attempts to enter correct code
- **Session Reset**: Automatic session reset after 3 failed attempts
- **Code Expiration**: 10-minute expiration
- **Success Message**: "Thank you for verifying your email address. We will email you once your AI agent is ready."

### Email Resend Requirements
- **Resend Button**: Available in chat interface
- **Rate Limiting**: 30-second cooldown between resend requests
- **Attempt Limit**: Maximum 3 resend attempts per session
- **Code Regeneration**: New code generated with each resend

### UI Enhancement Requirements
- **Button Position**: Move "done and continue" button to bottom of document upload area
- **Email Request Text**: "please enter your email address so I can notify you once your AI agent is ready"

## Implementation Approach

### FSM Integration
Additional states added to existing chat finite state machine:
- `COLLECTING_EMAIL` → `EMAIL_FORMAT_VALIDATION` → `EMAIL_VERIFICATION` → `EMAIL_VERIFIED` → `CREATE_BOT`

### Backend Services
- **Email Service**: SMTP integration and code generation
- **Verification Service**: Code validation and attempt tracking
- **Rate Limiting**: 30-second cooldown enforcement

### Frontend Components
- **Email Input**: Real-time validation with blocking behavior
- **Code Input**: 6-digit entry with attempt tracking
- **Resend Button**: Cooldown timer and attempt limits

## Technical Decisions

### Confirmed Specifications
- **SMTP**: Gmail SMTP (smtp.gmail.com:587) via .env configuration
- **Email Template**: HTML template with environment-specific subject prefixes
- **Environment Handling**: [DEV]/[UAT] prefixes for lower environments, no prefix for PROD
- **Database**: email_verifications table with proper indexing

### Security Requirements
- **Code Expiration**: 10-minute expiration balances security with user convenience
- **Attempt Limits**: 3 attempts to prevent abuse while allowing for user errors
- **Session Integration**: Reuse existing session reset mechanism

## Implementation Files

### Backend
- `app/models/email_verification.py` - EmailVerification model
- `app/services/email_service.py` - Email sending service
- `app/services/verification_service.py` - Verification logic service
- `app/routes/email_verification.py` - Email verification endpoints
- `migrations/002_create_email_verification.sql` - Database schema

### Frontend
- `src/hooks/useEmailVerification.ts` - Email verification hook
- `src/components/emailVerification/EmailInput.tsx` - Email input component
- `src/components/emailVerification/CodeInput.tsx` - Code input component
- `src/state/FiniteStateMachine.ts` - FSM state updates

## Documentation Links

- [Implementation Plan](plan.md) - Detailed implementation with code examples
- [Next Steps](next-steps.md) - Current blockers and immediate tasks
- [Testing Strategy](testing.md) - Comprehensive testing approach
- [Progress Tracking](tracking.md) - Implementation progress
- [Index](index.md) - Documentation overview
