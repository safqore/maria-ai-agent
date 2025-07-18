# Email Verification Decisions

## Email Service
- **Provider:** Gmail SMTP (smtp.gmail.com:587) with app password
- **Template:** HTML templates with Maria branding
- **Sender:** noreply@safqore.com (Maria AI Agent)

## User Experience
- **Post-Verification:** Automatic FSM transition (no manual continue)
- **Session Reset:** Use SessionContext.resetSession() pattern
- **Error Tone:** Polite messaging with "please" and "thanks"

## Technical Implementation
- **Rate Limiting:** 30-second cooldown, 3 resend attempts
- **Code Format:** 6-digit numeric (easier typing vs alphanumeric)
- **Expiration:** 10-minute code lifespan (industry standard)
- **Security:** bcrypt email hashing (salt rounds=12)
- **Storage:** Plain text codes (short-lived, 10min expiration)
- **Integration:** nextTransition property for FSM responses
- **Retention:** 24-hour auto-cleanup via repository

## Architecture Alignment
- **Repository:** Extends BaseRepository pattern
- **Transactions:** TransactionContext for all operations
- **Audit:** Use existing audit_utils.log_audit_event
- **Testing:** SQLite fixtures for all test environments
- **Session Management:** Leverage existing SessionResetModal
- **FSM Integration:** Follow existing ChatContext pattern

**Rationale:** All decisions prioritize consistency with existing patterns, user experience, and security while maintaining architectural compliance. 