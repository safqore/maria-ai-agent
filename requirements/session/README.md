# Maria AI Agent Session Management

This document provides an overview of the session management implementation for the Maria AI Agent project. The session management system is designed to track user interactions, associate uploaded files with specific users, and provide a consistent experience across sessions. Last updated on June 26, 2025.

## Requirements & Decisions

### Session Lifecycle
- A session begins when the frontend generates a UUID (if one does not exist in localStorage)
- The UUID is stored in both localStorage and React state for persistence across reloads
- A session is only considered complete after the user provides and verifies their email address
- Incomplete sessions and their data (including uploaded files) are deleted if abandoned
- If the UUID is missing or tampered with, the frontend generates a new UUID and shows a reset message

### Security & Privacy
- All data transmission uses SSL/TLS
- GDPR compliance with explicit user consent for storing personal data
- Users can withdraw consent or delete their account via the chatbot interface after verification
- Data minimization, access, portability, rectification, and retention policies are enforced

### Orphaned File Cleanup Implementation
- Files in S3 under `uploads/{uuid}/` where the UUID is not in the database and the folder is older than 30 minutes
- Cleanup process runs every 30 minutes as a scheduled automation
- Before deletion, the process double-checks the UUID against the database for safety
- All deletions and errors are logged for audit and recovery

## Overview

The session management system implements several key features:

- Unique session identifier (UUID) generation and validation (Implemented)
- Session persistence with browser localStorage (Implemented)
- User session persistence in a database (Implemented)
- Association of uploaded files with user sessions via UUID namespacing (Implemented)
- Comprehensive audit logging for session events (Implemented)
- Automatic cleanup of orphaned files (Implemented)
- Session Context for React components (In Progress)

## Implementation Approach

The implementation follows a service-oriented architecture with clean separation of concerns:

1. **Backend Services**:
   - Session service for UUID management
   - Audit logging service for tracking events
   - File upload service with session association

2. **Frontend Integration**:
   - Session management hooks and context
   - Persistent session storage in the browser
   - File upload integration with session IDs

## Implementation Decisions

### UUID Management
- Frontend is responsible for UUID generation, with backend validation
- Backend ensures UUIDs are never duplicated and always unique for every session
- Validation and generation endpoints use separate routes following single responsibility principle
- All validation and generation attempts are logged as audit events
- On UUID collision, the backend retries up to 3 times to generate a unique UUID

### Security Implementation
- CORS restricts backend endpoints to only accept requests from the frontend domain
- Rate limiting (10 requests/minute) prevents abuse and DDoS attacks
- All input is strictly validated, and endpoints have reasonable timeouts
- Audit logs and error logs are monitored for suspicious activity

### Error Handling
- Session reset message: "Your session has been reset due to a technical issue. Please start again."
- General error message: "The system has encountered an error, which has been notified to the administrator to investigate. Please try again later."
- Admin email notifications include relevant logs with user UUID, error logs, timestamp, and user actions

## Directory Structure

```
backend/
├── app/
│   ├── models/
│   │   ├── user_session.py    # Session data model
│   │   └── audit_log.py       # Audit logging model
│   ├── routes/
│   │   └── session.py         # API endpoints for session management
│   ├── services/
│   │   ├── session_service.py # Business logic for session management
│   │   └── audit_service.py   # Audit logging functionality
│   └── utils/
│       ├── uuid_helpers.py    # UUID validation and generation
│       └── orphaned_file_cleanup.py # Cleanup utility
└── migrations/
    └── 001_create_user_sessions.sql # Database migration

frontend/
├── src/
│   ├── hooks/
│   │   └── useSessionUUID.ts  # Session management hook
│   ├── contexts/
│   │   └── SessionContext.tsx # Context provider for session data
│   ├── api/
│   │   └── sessionApi.ts      # API client for session endpoints
│   └── components/
│       └── shared/
│           └── SessionResetAlert.tsx # UI for session reset
```

## Key Components

### Backend (Implemented)

- **UserSession Model**: Stores session data including UUID, user information, and timestamps
- **AuditLog Model**: Records all session-related events for security and debugging
- **Session Service**: Business logic for UUID validation, generation, and session management
- **Session API**: Endpoints for UUID validation and generation with rate limiting
- **Audit Logging Service**: Comprehensive event logging for security and debugging
- **Orphaned File Cleanup**: Utility to remove files that aren't associated with valid sessions

### Frontend

- **SessionApi**: API client for session endpoints (Implemented)
- **sessionUtils**: Utility functions for session management (Implemented)
- **useSessionUUID Hook**: Custom hook for managing session state and persistence (Implemented)
- **SessionContext**: React context for sharing session data across components (In Progress)
- **SessionResetAlert**: Component to notify users when session reset is required (Not Started)

## Documentation

- [Index](index.md): Starting point for session documentation
- [Testing Plan](testing.md): Testing strategy for session functionality
- [Tracking](tracking.md): Implementation progress tracking
- [Next Steps](next-steps.md): Upcoming tasks and future improvements

## Implementation Plan

For the detailed implementation plan with code examples, see [plan.md](plan.md).
