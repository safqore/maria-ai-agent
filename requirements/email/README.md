# Email Verification System

**Status: Ready for Implementation**  
**Critical Blockers: SMTP Configuration + Database Migration**

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

## Technical Specifications ✅

### Rate Limiting Strategy
- **Implementation**: Database-based using existing PostgreSQL infrastructure
- **Storage**: Use `email_verifications` table timestamps for cooldown tracking
- **Cleanup**: Automatic via record expiration (no additional infrastructure needed)

### Security Implementation
- **Email Hashing**: bcrypt with salt rounds=12 for stored email addresses
- **Audit Logging**: Database logging in `email_verifications` table with IP and user agent
- **Data Retention**: 24-hour auto-cleanup via scheduled job
- **Code Storage**: Plain text in database (short-lived, 10-minute expiration)

### Error Handling
- **HTTP Status Codes**: 
  - 400: Invalid email format, invalid code
  - 429: Rate limit exceeded  
  - 500: Email sending failure
- **Error Messages**: User-friendly format with consistent structure
- **Logging**: Python logging module with structured format

### Testing Setup
- **Development Email**: Personal email address in .env for testing
- **Test Database**: Use existing PostgreSQL test database setup
- **Mock Services**: No SMTP mocking - use real Gmail for integration testing
- **Test Data**: Auto-cleanup after each test run using existing patterns

## Implementation Approach

### FSM Integration
Additional states added to existing chat finite state machine:
- `COLLECTING_EMAIL` → `EMAIL_FORMAT_VALIDATION` → `EMAIL_VERIFICATION` → `EMAIL_VERIFIED` → `CREATE_BOT`

### Backend Services
- **Email Service**: SMTP integration, code generation, and bcrypt hashing
- **Verification Service**: Code validation, attempt tracking, and rate limiting
- **Cleanup Service**: 24-hour data retention and automatic cleanup

### Frontend Components
- **Email Input**: Real-time validation with blocking behavior
- **Code Input**: 6-digit entry with attempt tracking and cooldown timer
- **Resend Button**: Cooldown timer and attempt limits with real-time countdown

## Technical Decisions

### Confirmed Specifications
- **SMTP**: Gmail SMTP (smtp.gmail.com:587) via .env configuration
- **Email Template**: HTML template with environment-specific subject prefixes
- **Environment Handling**: [DEV]/[UAT] prefixes for lower environments, no prefix for PROD
- **Database**: PostgreSQL email_verifications table with proper indexing and audit fields

### Security Requirements
- **Code Expiration**: 10-minute expiration balances security with user convenience
- **Attempt Limits**: 3 attempts to prevent abuse while allowing for user errors
- **Session Integration**: Reuse existing session reset mechanism
- **Audit Trail**: Complete logging of verification attempts with IP tracking

## Implementation Files

### Backend
- `app/models/email_verification.py` - EmailVerification model with audit fields
- `app/services/email_service.py` - Email sending service with bcrypt hashing
- `app/services/verification_service.py` - Verification logic with rate limiting
- `app/services/cleanup_service.py` - Data cleanup and retention service
- `app/routes/email_verification.py` - Email verification endpoints with error handling
- `migrations/002_create_email_verification.sql` - PostgreSQL database schema

### Frontend
- `src/hooks/useEmailVerification.ts` - Email verification hook with countdown timer
- `src/components/emailVerification/EmailInput.tsx` - Email input component
- `src/components/emailVerification/CodeInput.tsx` - Code input component
- `src/api/emailVerificationApi.ts` - API client for email verification
- `src/state/FiniteStateMachine.ts` - FSM state updates

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

## Documentation Links

- [Implementation Plan](plan.md) - Detailed implementation with code examples
- [Next Steps](next-steps.md) - Current blockers and immediate tasks
- [Testing Strategy](testing.md) - Comprehensive testing approach
- [Progress Tracking](tracking.md) - Implementation progress
- [Index](index.md) - Documentation overview
