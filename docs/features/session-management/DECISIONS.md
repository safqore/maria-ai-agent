# Session Management Decisions

## Session Lifecycle Decisions

### Session Start Strategy
- **Decision**: Frontend generates UUID if not in localStorage
- **Rationale**: Reduces server load, provides offline capability
- **Implementation**: UUID v4 generation with localStorage persistence

### Session Storage Strategy
- **Decision**: Store UUID in both localStorage and React state
- **Rationale**: Persistence across reloads with real-time state management
- **Implementation**: localStorage for persistence, React state for UI

### Session Completion Criteria
- **Decision**: Session complete only after email verification
- **Rationale**: Ensures user identity before proceeding
- **Implementation**: Track verification status in session state

### Session Reset Strategy
- **Decision**: Generate new UUID and show reset message
- **Rationale**: Maintains security while providing clear user feedback
- **Implementation**: Remove UUID from localStorage, generate new one, reload app

### Orphaned Data Cleanup
- **Decision**: Delete abandoned sessions and files after 30 minutes
- **Rationale**: Prevents data accumulation while allowing reasonable time
- **Implementation**: Background cleanup process with UUID validation

## User Experience Decisions

### Session Reset Communication
- **Decision**: Modal and toast notification for reset events
- **Rationale**: Clear user communication for technical issues
- **Implementation**: "Your session has been reset due to a technical issue"

### Session State Sharing
- **Decision**: React Context and custom hooks (no props drilling)
- **Rationale**: Eliminates prop drilling, provides component isolation
- **Implementation**: SessionContext with proper providers

### Session Security
- **Decision**: SSL/TLS, GDPR compliance, explicit consent
- **Rationale**: Protects user privacy and ensures compliance
- **Implementation**: Encrypted transmission, user data controls

## Technical Decisions

### UUID Uniqueness
- **Decision**: Backend validates and retries up to 3 times on collision
- **Rationale**: Ensures uniqueness while handling edge cases
- **Implementation**: Validation with retry logic

### Rate Limiting
- **Decision**: 10 requests/minute per IP address
- **Rationale**: Prevents abuse while allowing normal usage
- **Implementation**: Flask-Limiter with in-memory storage

### Error Handling
- **Decision**: Consistent error handling between frontend and backend
- **Rationale**: Provides reliable user experience
- **Implementation**: Structured error responses with proper logging

## Cross-References
- Architecture: decisions.md (Session Management architecture decisions)
- Integration: integration-map.md (Session dependencies)
- Patterns: patterns.md (Session management patterns) 