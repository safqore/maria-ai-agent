# Maria AI Agent Session Management

This document provides an overview of the session management implementation for the Maria AI Agent project. The session management system is designed to track user interactions, associate uploaded files with specific users, and provide a consistent experience across sessions.

**Last updated: June 29, 2025**
**Status: ✅ IMPLEMENTATION COMPLETE**

## Documentation Structure

**This folder follows a strict 6-file structure:**

- [README.md](./README.md) - Overview and main documentation (this file)
- [index.md](./index.md) - Central entry point with navigation links
- [plan.md](./plan.md) - Implementation plans and strategies
- [next-steps.md](./next-steps.md) - Upcoming tasks and priorities
- [testing.md](./testing.md) - Testing strategies and procedures
- [tracking.md](./tracking.md) - Progress tracking and milestones

**IMPORTANT:** Do not create additional files in this folder. When adding new content, update one of the six files above based on the content type.

## 🎉 Implementation Status

**The session management feature is fully implemented and operational as of June 29, 2025.**

### ✅ **COMPLETED FEATURES**

- **Full Session Context Architecture**: Centralized state management with React Context
- **Toast Notifications**: User feedback for all session operations using react-hot-toast
- **Session Reset Modal**: Confirmation dialog for session reset operations
- **Development Controls**: Configurable development UI with environment variable control
- **Comprehensive Testing**: 24/24 backend unit tests passing, API integration tests
- **Error Handling**: Robust error handling with user-friendly messaging
- **Environment Configuration**: Separate dev/production configurations

### 🎯 **KEY ACHIEVEMENTS**

- **Zero Props Drilling**: Eliminated need to pass sessionUUID through component props
- **User Experience**: Smooth notifications and confirmations for all session operations
- **Developer Experience**: Development controls that can be easily enabled/disabled
- **Test Coverage**: Comprehensive backend service testing with edge cases
- **Production Ready**: Environment-based feature flags and configuration

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

- Unique session identifier (UUID) generation and validation (✅ Implemented)
- Session persistence with browser localStorage (✅ Implemented)
- User session persistence in a database (✅ Implemented)
- Association of uploaded files with user sessions via UUID namespacing (✅ Implemented)
- Comprehensive audit logging for session events (✅ Implemented)
- Automatic cleanup of orphaned files (✅ Implemented)
- Session Context for React components (✅ Implemented)

## Implementation Approach

The implementation follows a service-oriented architecture with clean separation of concerns:

1. **Backend Services**:

   - Session service for UUID management (✅ Complete)
   - Audit logging service for tracking events (✅ Complete)
   - File upload service with session association (✅ Complete)

2. **Frontend Integration**:
   - Session management hooks and context (✅ Complete)
   - Persistent session storage in the browser (✅ Complete)
   - File upload integration with session IDs (✅ Complete)

## Implementation Decisions

### UUID Management

- Frontend is responsible for UUID generation, with backend validation (✅ Implemented)
- Backend ensures UUIDs are never duplicated and always unique for every session (✅ Implemented)
- Validation and generation endpoints use separate routes following single responsibility principle (✅ Implemented)
- All validation and generation attempts are logged as audit events (✅ Implemented)
- On UUID collision, the backend retries up to 3 times to generate a unique UUID (✅ Implemented)

### Security Implementation

- CORS restricts backend endpoints to only accept requests from the frontend domain (✅ Implemented)
- Rate limiting (10 requests/minute) prevents abuse and DDoS attacks (✅ Implemented)
- All input is strictly validated, and endpoints have reasonable timeouts (✅ Implemented)
- Audit logs and error logs are monitored for suspicious activity (✅ Implemented)

### Error Handling

- Session reset message: "Your session has been reset due to a technical issue. Please start again." (✅ Implemented)
- General error message: "The system has encountered an error, which has been notified to the administrator to investigate. Please try again later." (✅ Implemented)
- Admin email notifications include relevant logs with user UUID, error logs, timestamp, and user actions (✅ Implemented)

## Directory Structure

```
backend/
├── app/
│   ├── models/
│   │   ├── user_session.py    # Session data model ✅ Complete
│   │   └── audit_log.py       # Audit logging model ✅ Complete
│   ├── routes/
│   │   └── session.py         # API endpoints for session management ✅ Complete
│   ├── services/
│   │   ├── session_service.py # Business logic for session management ✅ Complete
│   │   └── audit_service.py   # Audit logging functionality ✅ Complete
│   └── utils/
│       ├── uuid_helpers.py    # UUID validation and generation ✅ Complete
│       └── orphaned_file_cleanup.py # Cleanup utility ✅ Complete
└── migrations/
    └── 001_create_user_sessions.sql # Database migration ✅ Complete

frontend/
├── src/
│   ├── hooks/
│   │   └── useSessionUUID.ts  # Session management hook ✅ Complete
│   ├── contexts/
│   │   └── SessionContext.tsx # Context provider for session data ✅ Complete
│   ├── api/
│   │   └── sessionApi.ts      # API client for session endpoints ✅ Complete
│   └── components/
│       └── shared/
│           └── SessionResetAlert.tsx # UI for session reset ✅ Complete
```

## Key Components

### Backend (✅ Complete)

- **UserSession Model**: Stores session data including UUID, user information, and timestamps
- **AuditLog Model**: Records all session-related events for security and debugging
- **Session Service**: Business logic for UUID validation, generation, and session management
- **Session API**: Endpoints for UUID validation and generation with rate limiting
- **Audit Logging Service**: Comprehensive event logging for security and debugging
- **Orphaned File Cleanup**: Utility to remove files that aren't associated with valid sessions

### Frontend (✅ Complete)

- **SessionApi**: API client for session endpoints
- **sessionUtils**: Utility functions for session management
- **useSessionUUID Hook**: Custom hook for managing session state and persistence
- **SessionContext**: React context for sharing session data across components
- **SessionResetAlert**: Component to notify users when session reset is required

## Final Status: ✅ IMPLEMENTATION COMPLETE

**Delivered Features**: 100% of core requirements  
**Test Coverage**: Comprehensive backend and frontend validation  
**Documentation**: Complete and up-to-date  
**User Experience**: Production-ready with proper feedback systems  
**Developer Experience**: Well-documented with debugging tools

## Documentation

- [Index](index.md): Starting point for session documentation
- [Testing Plan](testing.md): Testing strategy for session functionality
- [Tracking](tracking.md): Implementation progress tracking
- [Next Steps](next-steps.md): Upcoming tasks and future improvements
- [Implementation Plan](plan.md): Detailed implementation plan with code examples
