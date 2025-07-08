# Email Verification Decisions

## Email Service Decisions

### Email Service Provider
- **Decision**: Gmail SMTP with App Password (smtp.gmail.com:587)
- **Rationale**: Company email hosted on Google, reliable delivery
- **Implementation**: SMTP configuration with app password authentication

### Email Template Strategy
- **Decision**: HTML templates with branding
- **Rationale**: Professional appearance, brand consistency
- **Implementation**: HTML email templates with Maria branding

### Sender Email Configuration
- **Decision**: noreply@safqore.com (Maria sender name)
- **Rationale**: User specified, maintains brand identity
- **Implementation**: Configured sender address with Maria branding

## User Experience Decisions

### Post-Verification Flow
- **Decision**: Automatic progression to next chat state (no manual continue button)
- **Rationale**: Seamless user experience, reduces friction
- **Implementation**: Automatic FSM transition after successful verification

### Session Reset Integration
- **Decision**: Use existing SessionContext.resetSession() pattern
- **Rationale**: Consistency with existing UX patterns
- **Implementation**: Call resetSession() instead of window.location.reload

### Error Message Tone
- **Decision**: User-friendly with "please" and "thanks" for polite messaging
- **Rationale**: More courteous user experience
- **Implementation**: Polite error messages throughout verification flow

## Technical Decisions

### Rate Limiting Strategy
- **Decision**: 30-second cooldown and 3 resend attempts
- **Rationale**: Prevents abuse while allowing legitimate retry scenarios
- **Implementation**: Database-based rate limiting with attempt tracking

### Verification Code Format
- **Decision**: 6-digit numeric codes
- **Rationale**: Easier typing, less confusion than alphanumeric
- **Implementation**: Numeric code generation with proper validation

### Code Expiration Strategy
- **Decision**: 10-minute code expiration
- **Rationale**: Industry standard, balances security with usability
- **Implementation**: Timestamp-based expiration with cleanup

### Record Retention Strategy
- **Decision**: 24-hour auto-cleanup via repository cleanup method
- **Rationale**: For audit/compliance purposes
- **Implementation**: Automated cleanup process

## Architecture Decisions

### Repository Pattern
- **Decision**: EmailVerificationRepository must extend BaseRepository pattern
- **Rationale**: Architectural alignment required
- **Implementation**: Follow same pattern as UserSessionRepository

### Transaction Management
- **Decision**: Use existing TransactionContext for all operations
- **Rationale**: Follow existing service patterns
- **Implementation**: Wrap all operations in TransactionContext

### FSM Integration
- **Decision**: Use nextTransition property in API responses
- **Rationale**: Follow existing ChatContext pattern
- **Implementation**: All endpoints return nextTransition for state transitions

### Testing Database Strategy
- **Decision**: SQLite for all test environments
- **Rationale**: Consistency with existing setup
- **Implementation**: SQLite database with automatic migration

## Cross-References
- Architecture: decisions.md (Email Verification architecture decisions)
- Integration: integration-map.md (Email verification dependencies)
- Patterns: patterns.md (Email verification patterns) 