# Architecture Decision Records (ADRs)

This file will contain all major architectural decisions made across the project to ensure consistency and prevent conflicts.

## Database Architecture

### Repository Pattern
- **Decision**: All database access must go through Repository pattern
- **Rationale**: Provides abstraction, testability, and consistency
- **Implementation**: Extend `BaseRepository<T>` for all models
- **Established**: [Date when this was established]

### Transaction Management
- **Decision**: Use `TransactionContext` for all database operations
- **Rationale**: Ensures atomicity and proper error handling
- **Implementation**: Wrap all service operations in TransactionContext
- **Established**: [Date when this was established]

## API Architecture

### Response Format
- **Decision**: Use `nextTransition` property for FSM integration
- **Rationale**: Provides clear state transition management
- **Implementation**: All API responses include nextTransition when applicable
- **Established**: [Date when this was established]

### Error Handling
- **Decision**: Structured error responses with consistent format
- **Rationale**: Provides consistent error handling across features
- **Implementation**: Use existing `errors.py` patterns
- **Established**: [Date when this was established]

## Frontend Architecture

### State Management
- **Decision**: Use React Context for feature state management
- **Rationale**: Provides component isolation and testability
- **Implementation**: Create Context providers for each major feature
- **Established**: [Date when this was established]

### Session Management
- **Decision**: Use `SessionContext` for session resets
- **Rationale**: Provides consistent user experience
- **Implementation**: Call `resetSession()` instead of `window.reload`
- **Established**: [Date when this was established]

## Configuration Architecture

### Service Separation
- **Decision**: Use separate configuration files for each service (frontend/backend)
- **Rationale**: Reflects deployment reality, prevents conflicts, follows stack standards
- **Implementation**: `backend/.env` and `frontend/.env` with service-specific variables
- **Established**: Current system standard

### Environment Variable Strategy
- **Decision**: Use standard environment variable names per technology stack
- **Rationale**: Follows established conventions, reduces configuration complexity
- **Implementation**: Backend uses `PORT=5000`, Frontend uses `PORT=3000` and `REACT_APP_*` prefix
- **Established**: Current system standard

### Configuration Loading
- **Decision**: No cross-service configuration sharing or propagation
- **Rationale**: Maintains clean separation of concerns and deployment independence
- **Implementation**: Each service loads only its own configuration file
- **Established**: Current system standard

## Security Architecture

### Authentication
- **Decision**: API key authentication via `X-API-Key` header
- **Rationale**: Provides simple, stateless authentication for API access
- **Implementation**: Middleware validates API key, configurable for test environments
- **Established**: December 2024

### Data Protection
- **Decision**: File upload validation with size and type restrictions
- **Rationale**: Prevents malicious file uploads and ensures system security
- **Implementation**: PDF files only, 5MB max size, S3 integration with session validation
- **Established**: December 2024

## Refactor Architecture Decisions

### SQLAlchemy ORM with Repository Pattern
- **Decision**: Implement SQLAlchemy ORM with repository pattern for all database access
- **Rationale**: Provides abstraction, testability, and consistent data access patterns
- **Implementation**: `BaseRepository` with generic CRUD operations, `UserSessionRepository` for session-specific operations
- **Established**: December 2024

### Flask Blueprints with API Versioning
- **Decision**: Use Flask blueprints with `/api/v1/` versioning for modular route organization
- **Rationale**: Enables modular development, clear API structure, and future versioning
- **Implementation**: Session blueprint (`/api/v1/session`), upload blueprint (`/api/v1/upload`)
- **Established**: December 2024

### React Context State Management
- **Decision**: Use React Context for feature state management instead of prop drilling
- **Rationale**: Provides component isolation, testability, and clean state management
- **Implementation**: `ChatContext`, `SessionContext`, `FileUploadContext` with proper providers
- **Established**: December 2024

### Service Layer Architecture
- **Decision**: Implement service layer to separate business logic from API routes
- **Rationale**: Improves testability, maintainability, and separation of concerns
- **Implementation**: `SessionService`, `UploadService` with business logic, routes handle HTTP concerns
- **Established**: December 2024

### Transaction Management with Context Managers
- **Decision**: Use `TransactionContext` for atomic database operations
- **Rationale**: Ensures data consistency and proper error handling with automatic rollback
- **Implementation**: Context managers wrap all service operations, automatic rollback on exceptions
- **Established**: December 2024

## CI/CD Architecture Decisions

### Platform Selection
- **Decision**: Use GitHub Actions for CI/CD platform
- **Rationale**: Better GitHub integration, generous free tier, seamless workflow triggers
- **Implementation**: Parallel jobs for backend and frontend, push/PR triggers
- **Established**: December 2024

### Testing Strategy
- **Decision**: Use SQLite in-memory for CI testing, PostgreSQL for production
- **Rationale**: Self-contained testing without external dependencies, faster execution
- **Implementation**: pytest with SQLite fixtures, production uses PostgreSQL
- **Established**: December 2024

### Quality Tools
- **Decision**: Use industry-standard formatting and linting tools
- **Rationale**: Ensures code quality consistency and automated standards enforcement
- **Implementation**: black + flake8 (Python), prettier + eslint (TypeScript)
- **Established**: December 2024

### Parallel Job Architecture
- **Decision**: Use parallel backend and frontend jobs for faster feedback
- **Rationale**: Reduces total pipeline time and provides faster developer feedback
- **Implementation**: Separate jobs with shared workflow triggers
- **Established**: December 2024

## Email Verification Architecture Decisions

### Repository Pattern for Email Verification
- **Decision**: Use `EmailVerificationRepository` extending `BaseRepository<EmailVerification>`
- **Rationale**: Consistent with existing repository pattern, provides abstraction and testability
- **Implementation**: Follow same pattern as `UserSessionRepository` with factory integration
- **Established**: December 2024

### Transaction Management for Email Operations
- **Decision**: Use `TransactionContext` for all email verification database operations
- **Rationale**: Ensures atomicity for code generation, verification, and attempt tracking
- **Implementation**: Wrap all service operations in TransactionContext with proper rollback
- **Established**: December 2024

### Session Management Integration
- **Decision**: Use `SessionContext.resetSession()` instead of `window.location.reload`
- **Rationale**: Provides consistent user experience and proper session state management
- **Implementation**: Call `resetSession(true)` to show confirmation modal
- **Established**: December 2024

### FSM Integration with nextTransition
- **Decision**: Use `nextTransition` property in API responses for FSM integration
- **Rationale**: Consistent with existing chat FSM pattern, provides clear state management
- **Implementation**: All email verification endpoints return nextTransition for state transitions
- **Established**: December 2024

### Security Implementation
- **Decision**: Use bcrypt hashing (rounds=12) for email addresses with audit logging
- **Rationale**: Protects user privacy while maintaining audit trail for security
- **Implementation**: Hash emails before storage, use `audit_utils.log_audit_event`
- **Established**: December 2024

### Rate Limiting Strategy
- **Decision**: Database-based rate limiting with 30-second cooldown and 3-attempt limits
- **Rationale**: Prevents abuse while allowing legitimate retry scenarios
- **Implementation**: Track attempts and timestamps in database, enforce limits in service layer
- **Established**: December 2024

### Testing Database Strategy
- **Decision**: Use SQLite for all email verification testing environments
- **Rationale**: Consistent with existing testing strategy, no external dependencies
- **Implementation**: SQLite database with automatic migration before tests
- **Established**: December 2024

## Testing Architecture Decisions

### Concurrent Testing Strategy
- **Decision**: Use isolated test clients and proper database initialization for concurrent tests
- **Rationale**: Prevents test interference and ensures reliable concurrent testing
- **Implementation**: Create separate test clients, initialize database before concurrent tests
- **Established**: December 2024

### Performance Testing Methodology
- **Decision**: Use proper throughput calculation and isolated test environments
- **Rationale**: Provides accurate performance metrics and prevents test interference
- **Implementation**: Measure actual throughput, use isolated test clients, proper timing
- **Established**: December 2024

### Database Threading Strategy
- **Decision**: Use SQLite with proper initialization for concurrent database access
- **Rationale**: Prevents "no such table" errors in concurrent scenarios
- **Implementation**: Initialize database tables before concurrent tests, use proper session management
- **Established**: December 2024

---
*This file will be populated as architectural decisions are made* 