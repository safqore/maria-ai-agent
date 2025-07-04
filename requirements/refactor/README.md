# Maria AI Agent Refactoring Project

This document provides an overview of the refactoring project that has successfully implemented key architectural improvements to the Maria AI Agent codebase. Last updated on January 4, 2025.

## What's Been Implemented ✅

### Backend Architecture
- **SQLAlchemy ORM**: Repository pattern with `BaseRepository` and `UserSessionRepository`
- **Flask Blueprints**: Modular route organization with API versioning (`/api/v1/`)
- **Service Layer**: `SessionService` and `UploadService` with business logic separation
- **Transaction Management**: `TransactionContext` for atomic operations
- **Authentication**: API key middleware with proper validation
- **Request Middleware**: Correlation ID tracking, logging, and CORS handling
- **Error Handling**: Centralized error responses with proper HTTP status codes

### Frontend Architecture
- **React Context**: `ChatContext`, `SessionContext`, and `FileUploadContext` for state management
- **Component Structure**: Modular components with proper separation of concerns
- **API Integration**: Client libraries with error handling and retry logic
- **State Management**: React Context pattern with reducers

### Infrastructure
- **File Upload**: End-to-end S3 integration with session validation
- **Database Models**: `UserSession` model with proper SQLAlchemy configuration
- **Environment Setup**: Conda environment requirement documented
- **Testing Infrastructure**: Jest for frontend, pytest for backend

## Technical Implementation Details

### Database and ORM Strategy

**SQLAlchemy Relationship Loading**
- Uses lazy loading (`lazy='select'`) as default strategy for memory efficiency
- Selective eager loading with `joinedload()` for performance-critical paths
- Strategic performance indexes implemented for common query patterns
- UUID handling with automatic string-to-UUID conversion in repository layer

**Transaction Management**
- `TransactionContext` provides atomic operations with automatic commit/rollback
- Integration with repository pattern for consistent transaction boundaries
- Explicit transaction scope for complex operations like session collision handling

### Session Management Implementation

**UUID Collision Handling**
- Automatic detection of UUID collisions during session persistence
- S3 file migration from old UUID to new UUID when collisions occur
- Atomic session creation with S3 migration using `TransactionContext`
- Different HTTP status codes: 201 for new sessions, 200 for collision scenarios

**Session Persistence Flow**
```python
# Session collision logic with S3 migration
if self.user_session_repository.exists(uuid_obj):
    new_uuid = str(uuid.uuid4())
    migrate_s3_files(session_uuid, new_uuid)  # Move S3 files
    session_uuid = new_uuid  # Use new UUID for session creation
```

### API and Middleware Architecture

**Flask Blueprint Organization**
- Feature-based route organization (sessions, uploads)
- API versioning with `/api/v1/` prefix and legacy support
- Rate limiting with Redis storage (fallback to in-memory for development)
- CORS handling with proper preflight (OPTIONS) support

**Authentication Middleware**
- API key validation via `X-API-Key` header or `api_key` query parameter
- Configurable authentication requirement (disabled for development/testing)
- Integration with correlation ID tracking for request tracing

**Request Processing Pipeline**
1. Correlation ID extraction/generation
2. Authentication validation (if enabled)
3. JSON validation for appropriate content types
4. Request logging with timing metrics
5. Error handling with structured responses

### Frontend State Management

**React Context Architecture**
- `ChatContext`: FSM integration with message and state management
- `SessionContext`: Session lifecycle and UUID management
- `FileUploadContext`: File upload progress and error handling

**API Integration Patterns**
- Linear backoff retry strategy (3 attempts, 500ms increments)
- Correlation ID propagation for request tracing
- Error boundaries with user-friendly error messages
- API client libraries with consistent error handling

### File Upload System

**S3 Integration**
- Session-scoped file organization (`uploads/{session_uuid}/`)
- File validation (type, size limits)
- Progress tracking and error handling
- CORS header exposure for frontend integration

**Upload Flow**
1. Session UUID validation
2. File type and size validation (PDF only, 5MB max)
3. S3 upload with session-scoped path
4. Response with file URL and metadata

### Environment Configuration Strategy

**Service Independence**
- Separate environment configurations for backend (`.env`) and frontend (`.env`)
- Port configuration without hardcoded dependencies
- Automatic CORS adaptation for different environments
- Conda environment requirement for all backend operations

**Configuration Hierarchy**
- Application config overrides environment variables
- Test-specific configurations override production defaults
- Fallback mechanisms for missing optional configuration

## Project Goals

The refactoring aimed to:
- Improve code organization and maintainability
- Implement proper architectural patterns (repository, service layer)
- Add comprehensive error handling and logging
- Create scalable state management for the frontend
- Maintain all existing functionality during the transition

## Current Architecture

### Backend Structure
```
backend/app/
├── routes/           # Flask blueprints (session_bp, upload_bp)
├── services/         # Business logic (SessionService, UploadService)
├── repositories/     # Data access (BaseRepository, UserSessionRepository)
├── models.py         # SQLAlchemy models
├── utils/           # Middleware, auth, S3 utilities
└── app_factory.py   # Application factory with blueprint registration
```

### Frontend Structure
```
frontend/src/
├── contexts/        # React Context providers
├── components/      # React components
├── api/            # API client libraries
├── hooks/          # Custom React hooks
└── utils/          # Utility functions and configuration
```

## Environment Requirements

**Critical**: The backend requires the conda environment to be activated:
```bash
conda activate maria-ai-agent  # Required for all backend operations
```

This is documented in the main project `README.md` and `Makefile`.

## File Organization

This documentation folder follows a simplified structure:
- `README.md` (this file) - Project overview and architecture
- `STATUS.md` - Current implementation status and next steps

## Next Steps

See `STATUS.md` for current implementation status and recommended next steps.

## Development Notes

### Running Tests
```bash
# Backend tests (requires conda environment)
conda activate maria-ai-agent
make test

# Frontend tests
cd frontend && npm test
```

### Key Implementation Files
- **Backend ORM**: `backend/app/repositories/base_repository.py`
- **Flask Blueprints**: `backend/app/routes/session.py`, `backend/app/routes/upload.py`
- **Frontend State**: `frontend/src/contexts/ChatContext.tsx`
- **API Integration**: `frontend/src/api/sessionApi.ts`

This refactoring has successfully modernized the codebase architecture while maintaining functional behavior.
