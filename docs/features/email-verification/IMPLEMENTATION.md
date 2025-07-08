# Email Verification - Implementation Details

**Last Updated:** 2024-12-21
## Implementation Overview
Email verification integrates with existing chat interface via finite state machine.
## Core Implementation Components

### 1. Chat Interface Integration
**Integration Point:** Existing chat finite state machine
**New States Required:**
- `EMAIL_VERIFICATION_PENDING` - After valid email entered
- `EMAIL_CODE_ENTRY` - Waiting for verification code
- `EMAIL_VERIFIED` - Successful verification complete

**State Transitions:**
- Valid email format → Send verification email → Request code entry
- Invalid email → Keep asking for correct format
- Code entry → Validate → Success or retry/reset

### 2. Email Service Integration
**Service Requirements:**
- Send verification emails with 6-digit codes
- Template-based email generation
- Delivery tracking and error handling

**Email Template Structure:**
```
Subject: Verify your email address
Body: Your verification code is: [6-DIGIT-CODE]
Code expires in 10 minutes.
```

### 3. Code Generation and Validation
**Generation Logic:**
- 6-character alphanumeric (A-Z, 0-9)
- Cryptographically secure random generation
- Server-side storage with expiration timestamp

**Validation Logic:**
- Case-insensitive comparison
- Expiration check (10-minute window)
- Attempt counting (max 3 failures)
- Rate limiting for resend requests

### 4. UI/UX Changes
**Button Positioning:**
- Move "Done" and "Continue" buttons to bottom instead of right side of uploaded documents
- Add "Resend Code" button with 1-minute cooldown indicator

**Text Updates:**
- Original: "Nice to meet you, fu wu! Let's build your personalised AI agent..."
- Updated: Make more concise and precise (specific text TBD)
- Original: "Great! Now, please enter your email address so I can send you updates and results."
- Updated: "Please enter your email address so I can notify you once your AI agent is ready."

### 5. Session Management Integration
**Reset Trigger:** Use existing session reset functionality
**Reset Conditions:**
- 3 failed code verification attempts
- Session timeout during verification
- User-initiated reset

**Reset Implementation:**
- Call existing `resetSession()` method
- Show remaining attempts to user

### 6. Error Handling
**Email Format Validation:**
- Real-time validation in chat interface
- Clear error messages for invalid formats
- Continue prompting until valid format received

**Code Verification Errors:**
- Display remaining attempts after each failure
- Show clear error messages for invalid codes
- Automatic session reset after 3 failures

**Email Delivery Errors:**
- Handle service unavailability
- Provide fallback messaging
- Enable manual retry mechanisms

## Integration Points

**Existing Systems:**
- Chat interface and finite state machine
- Session management and reset functionality
- File upload flow (button positioning changes)

**New Dependencies:** Email service provider, code generation service, email template system
## Testing Strategy

**Unit Tests:**
- Code generation and validation logic
- Email format validation
- Attempt counting and rate limiting

**Integration Tests:** Chat interface state transitions, email service integration, session reset integration

**End-to-End Tests:** Complete verification flow, error scenarios and recovery, UI/UX changes validation 