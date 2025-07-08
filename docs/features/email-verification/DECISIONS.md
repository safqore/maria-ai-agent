# Email Verification - Technical Decisions

**Last Updated:** 2024-12-21
## Core Technical Decisions

### Verification Code Format
- **Decision:** 6-digit numeric code (not alphanumeric)
- **Rationale:** Better user experience, easier to enter on mobile devices

### Code Validity Period
- **Decision:** 10-minute expiration
- **Rationale:** Security best practice while allowing reasonable time for users

### Failed Attempt Handling
- **Decision:** 3 incorrect attempts → session reset via SessionContext
- **Rationale:** Consistent with existing session reset behavior

### Resend Functionality
- **Decision:** 30-second cooldown between resends, maximum 3 attempts
- **Rationale:** Faster feedback than 1-minute, prevents spam while allowing retries

### Email Format Validation
- **Decision:** Real-time validation in chat interface before sending
- **Rationale:** Immediate feedback and reduced server load

### Integration Approach
- **Decision:** Integrate with existing finite state machine using nextTransition
- **Rationale:** Consistent with existing chat FSM pattern

### Security Implementation
- **Decision:** bcrypt hashing (rounds=12) for email addresses with audit logging
- **Rationale:** Protects user privacy while maintaining security audit trail

### Database Strategy
- **Decision:** SQLite for all environments (development, testing, production)
- **Rationale:** Consistent with existing testing strategy, no external dependencies

### Testing Approach
- **Decision:** Real Gmail SMTP integration with personal email for development
- **Rationale:** Ensures production-like testing without mocking complexity

### Success Flow
- **Decision:** Show confirmation message with future notification promise
- **Message:** "Thank you for verifying your email address. We will email you once your AI agent is ready." 