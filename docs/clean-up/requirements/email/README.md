# Email Verification System

**Status: Ready for Implementation**  
**Critical Blockers: SMTP Configuration + Database Migration**

## Core Requirements

### Email Verification Flow
- **Email Format Validation**: Blocking validation - user cannot proceed until valid email format
- **Verification Code**: 6-digit numeric code sent via email
- **Attempt Limits**: Maximum 3 attempts to enter correct code
- **Session Reset**: Using existing SessionContext pattern (no window.reload)
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

## Technical Specifications ✅ **ALIGNED WITH EXISTING PATTERNS**

### Repository Pattern
- **EmailVerificationRepository**: Following BaseRepository pattern used by UserSessionRepository
- **Factory Pattern**: get_email_verification_repository() following existing factory.py pattern
- **Database Access**: All operations through repository layer (no direct queries)

### Transaction Management
- **TransactionContext**: All database operations use existing TransactionContext
- **Atomic Operations**: Email verification and session operations are atomic
- **Error Handling**: Proper rollback and error handling following existing patterns

### Session Integration
- **SessionContext**: Use existing SessionContext.resetSession() for session resets
- **Session Modal**: Leverage existing SessionResetModal for user confirmation
- **No window.reload**: Eliminated direct page reloads in favor of SessionContext

### FSM Integration
- **nextTransition Property**: API responses use nextTransition (not nextState)
- **Transition Handling**: Follow existing ChatContext pattern for FSM transitions
- **State Management**: Integrate with existing FiniteStateMachine.ts patterns

### Database Strategy
- **SQLite**: Use SQLite for all test environments (following questions-and-assumptions.md)
- **Migration**: Alembic migrations following existing pattern
- **Testing**: Automatic migration before tests using existing setup

### Security Implementation
- **Email Hashing**: bcrypt with salt rounds=12 for stored email addresses
- **Audit Logging**: Use existing audit_utils.log_audit_event pattern
- **Data Retention**: 24-hour auto-cleanup via repository cleanup method
- **Code Storage**: Plain text in database (short-lived, 10-minute expiration)

### Error Handling
- **Structured Errors**: Following existing errors.py pattern
- **HTTP Status Codes**: 
  - 400: Invalid email format, invalid code
  - 429: Rate limit exceeded  
  - 500: Email sending failure
- **Error Messages**: User-friendly format with consistent structure
- **Logging**: Python logging module following existing patterns

### Testing Setup
- **Development Email**: Personal email address in .env for testing
- **Test Database**: SQLite (maria_ai_test.db) following existing pattern
- **Mock Services**: No SMTP mocking - use real Gmail for integration testing
- **Test Data**: Auto-cleanup after each test run using repository patterns

## Implementation Approach

### FSM Integration
Additional states added to existing chat finite state machine:
- `COLLECTING_EMAIL` → `EMAIL_FORMAT_VALIDATION` → `EMAIL_VERIFICATION` → `EMAIL_VERIFIED` → `CREATE_BOT`

### Backend Services
- **EmailVerificationRepository**: Database operations following BaseRepository pattern
- **EmailService**: SMTP integration, code generation, and bcrypt hashing
- **VerificationService**: Code validation, attempt tracking, using TransactionContext
- **CleanupService**: 24-hour data retention using repository cleanup methods

### Frontend Components
- **Email Input**: Real-time validation with blocking behavior
- **Code Input**: 6-digit entry with attempt tracking and cooldown timer
- **Resend Button**: Cooldown timer and attempt limits with real-time countdown
- **Session Reset**: Use SessionContext.resetSession() for proper session handling

## Technical Decisions

### Confirmed Specifications
- **SMTP**: Gmail SMTP (smtp.gmail.com:587) via .env configuration
- **Email Template**: HTML template with environment-specific subject prefixes
- **Environment Handling**: [DEV]/[UAT] prefixes for lower environments, no prefix for PROD
- **Database**: SQLite for all environments with proper indexing and audit fields

### Architectural Alignment
- **Repository Pattern**: EmailVerificationRepository extends BaseRepository<EmailVerification>
- **Transaction Management**: All operations use TransactionContext for atomicity
- **Session Management**: Integration with existing SessionContext (no direct window.reload)
- **FSM Integration**: Use nextTransition property in API responses
- **Error Handling**: Follow existing errors.py and structured logging patterns

### Security Requirements
- **Code Expiration**: 10-minute expiration balances security with user convenience
- **Attempt Limits**: 3 attempts to prevent abuse while allowing for user errors
- **Session Integration**: Leverage existing session reset mechanism via SessionContext
- **Audit Trail**: Complete logging using existing audit_utils.log_audit_event

## Implementation Files

### Backend
- `app/models/email_verification.py` - EmailVerification model
- `app/repositories/email_verification_repository.py` - Repository following BaseRepository pattern
- `app/repositories/factory.py` - Factory method additions
- `app/services/email_service.py` - Email sending service with bcrypt hashing
- `app/services/verification_service.py` - Verification logic with TransactionContext
- `app/routes/email_verification.py` - API endpoints with nextTransition integration
- `migrations/002_create_email_verification_sqlite.sql` - SQLite database schema

### Frontend
- `src/hooks/useEmailVerification.ts` - Email verification hook with SessionContext integration
- `src/components/emailVerification/EmailInput.tsx` - Email input component
- `src/components/emailVerification/CodeInput.tsx` - Code input component
- `src/api/emailVerificationApi.ts` - API client for email verification
- `src/state/FiniteStateMachine.ts` - FSM state and transition updates

## Configuration

### Environment Variables
```env
# SMTP Configuration (following existing patterns)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@yourcompany.com
SMTP_FROM_NAME=Maria AI Agent

# Environment-specific email subjects
EMAIL_SUBJECT_PREFIX=[DEV]  # [DEV] for development, [UAT] for UAT, empty for production

# Database (following existing patterns)
DATABASE_URL=sqlite:///maria_ai_dev.db
TEST_DATABASE_URL=sqlite:///maria_ai_test.db
```

## Documentation Links

- [Implementation Plan](plan.md) - Detailed implementation with code examples aligned to existing patterns
- [Next Steps](next-steps.md) - Current blockers and immediate tasks
- [Testing Strategy](testing.md) - Comprehensive testing approach using existing patterns
- [Progress Tracking](tracking.md) - Implementation progress
- [Index](index.md) - Documentation overview

**All requirements now aligned with existing architectural patterns and eliminate conflicts identified in cross-check.**
