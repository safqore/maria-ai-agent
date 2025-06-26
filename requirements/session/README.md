# Maria AI Agent Session Management

This document provides an overview of the session management implementation for the Maria AI Agent project. The session management system is designed to track user interactions, associate uploaded files with specific users, and provide a consistent experience across sessions. Last updated on June 26, 2025.

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

For the detailed implementation plan, see [plan.md](plan.md).

## Related Requirements

For the original session requirements and rationale, see [user_session.md](user_session.md).
