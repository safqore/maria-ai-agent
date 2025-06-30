# Maria AI Agent Refactoring Plan

This document details the implementation plans and strategies for the Maria AI Agent refactoring project. Last updated on June 27, 2025.

## Architectural Approach

### Backend Architecture

#### Service-Oriented Architecture
- Separation of concerns between routes, services, and data access
- Services contain business logic
- Routes handle request/response formatting
- Repositories handle data access
- Centralized error handling

#### Database Access
- SQLAlchemy ORM for type-safe database access
- Repository pattern for encapsulating data access logic
- TransactionContext for atomic operations
- Migration management with Alembic

#### API Organization
- Flask blueprints for feature-based route organization
- API versioning with URL prefixes
- Rate limiting and middleware for enhanced control
- Request validation with Marshmallow schemas

### Frontend Architecture

#### Component Structure
- Functional components with React hooks
- Component-specific logic in custom hooks
- Shared state in React Context

#### State Management
- Finite State Machine for predictable state transitions
- React Context for global state
- Adapters for connecting FSM to React components

#### Error Handling
- Consistent error boundaries
- User-friendly error messages
- Logging for debugging

## Implementation Phases

### Phase 1: Setup and Preparation (Completed ✅)
Set up linting, formatting, documentation, and testing infrastructure.

### Phase 2: Backend Improvements - Lower Risk (Completed ✅)
Created service layer, centralized error handling, and request validation.

### Phase 3: Frontend Improvements - Lower Risk (Completed ✅)
Refactored component structure, implemented state management, and improved error handling.

### Phase 4: Backend Improvements - Higher Risk (In Progress ⏳)

#### Step 1: SQLAlchemy ORM Implementation (Completed ✅)
- Database models setup with SQLAlchemy
- Repository pattern implementation
- Transaction management with context managers

#### Step 2: Improve Route Organization (In Progress ⏳)
- Blueprint implementation for modular route organization
- API versioning for better backward compatibility
- Middleware improvements for enhanced control

### Phase 5: Context and Global State Refinements (In Progress ⏳)
- Finalizing ChatContext and adapters
- Consolidating context interfaces
- Implementing optimized state transitions

## Blueprint Implementation Strategy

The blueprint implementation follows these principles:

1. **Feature-Based Organization**
   - Routes grouped by feature (sessions, uploads, etc.)
   - Consistent URL structure with versioning

2. **Registration Process**
   - Blueprints registered in app_factory.py
   - Configuration applied at registration time

3. **Middleware Integration**
   - Rate limiting applied at blueprint level with Redis storage backend
   - Authentication and logging middleware
   
4. **Rate Limiting Strategy**
   - Redis storage backend for production-grade rate limiting
   - Environment-specific configurations
   - Fallback mechanism for development environments

## Repository Pattern Strategy

The repository pattern implementation follows these principles:

1. **Generic Base Repository**
   - Type-safe operations with generics
   - Common CRUD operations implemented once

2. **Specialized Repositories**
   - Inherit from BaseRepository
   - Add domain-specific methods

3. **Factory Pattern**
   - Repositories created via factory for consistent setup
   - Dependency injection for better testing

## Transaction Implementation Strategy

The transaction management strategy uses a TransactionContext class that:

1. Provides a context manager interface for atomic operations
2. Handles commit/rollback based on success/failure
3. Integrates with repositories for consistent transaction boundaries
4. Ensures proper resource cleanup

## Migration Strategy

1. Alembic for database schema migrations
2. Version control for migrations
3. Automated testing for migration scripts
4. Forward and backward compatibility support

## Frontend State Management Strategy

1. Finite State Machine for predictable state transitions
2. React Context for global state storage
3. Adapter pattern for connecting FSM to React components
4. Custom hooks for component-specific logic

## Environment Configuration Strategy

The environment configuration strategy follows these principles:

1. **Separated Service Configuration**
   - Backend configuration in `backend/.env`
   - Frontend configuration in `frontend/.env`
   - No cross-service configuration dependencies

2. **Port Configuration**
   - No hardcoded port values in application code
   - Backend port configured via `PORT` in `backend/.env`
   - Frontend development server port configured via `PORT` environment variable or package.json
   - API connection URL in frontend uses `REACT_APP_API_BASE_URL` to reference backend
   - CORS configuration automatically adapts to port changes for local development

3. **Service Independence**
   - Environment configurations designed for independent service deployment
   - Consistent naming conventions by platform (e.g., `REACT_APP_` prefix for React)
   - Automatic fallback mechanisms when optional configuration is missing

4. **Documentation**
   - Example environment files provided as templates
   - All environment variables documented in main README.md
   - Clear instructions for developers on configuring their environments

This strategy ensures developers can modify port settings on their machines without hardcoded limitations, allowing the application to run correctly across different environments with minimal manual adjustments.

## Implementation Approach for Key Components

### 1. SQLAlchemy Relationship Loading Strategy

We have decided to implement lazy loading as the default strategy for SQLAlchemy relationships because:

1. **Memory Efficiency**: Lazy loading only retrieves related objects when they are accessed, reducing memory usage
2. **Query Efficiency**: Prevents loading unnecessary data when only the parent object is needed
3. **Simplicity**: Simplifies the default data access pattern and is easier to reason about
4. **Selective Optimization**: Allows selective use of eager loading for performance-critical paths

Implementation details:
- All relationships will use `lazy='select'` (the default) unless explicitly configured otherwise
- For frequently accessed relationships or to avoid N+1 query problems, we'll use `joinedload()` selectively
- Performance-critical paths will be identified and optimized with appropriate loading strategies

### 2. Frontend API Retry Strategy

We have decided to implement a linear backoff strategy for API retries because:

1. **Predictability**: Linear backoff provides predictable retry timing, making the UX more consistent
2. **Simplicity**: Easier to implement and reason about than exponential backoff
3. **Adequate for Our Needs**: For our current scale and usage patterns, linear backoff provides sufficient spacing between retries
4. **User Experience**: More consistent timing for retries creates a smoother user experience

Implementation details:
- Default retry count: 3 attempts
- Initial retry delay: 500ms
- Linear backoff: Add 500ms for each subsequent retry (500ms, 1000ms, 1500ms)
- Skip retries for 4xx errors (except 429 rate limiting)
- Log all retry attempts with correlation IDs

### 3. Correlation ID Strategy

We have decided to generate correlation IDs server-side and return them to clients because:

1. **Consistency**: Server-side generation ensures consistent UUID format and quality
2. **Compatibility**: Aligns with the existing middleware implementation that extracts correlation IDs from headers
3. **Client Simplicity**: Reduces client-side complexity by not requiring UUID generation
4. **Server Control**: Provides the server with control over correlation ID format and generation

Implementation details:
- If client provides a valid correlation ID in `X-Correlation-ID` header, use it
- Otherwise, server generates a UUID v4 correlation ID
- Return correlation ID in `X-Correlation-ID` response header
- Include correlation ID in all error responses and logs

### 4. Error Handling Strategy

We have decided to implement a structured error response format with varying levels of detail based on environment:

1. **Consistent Format**: All error responses will follow a standard format
2. **Environment-Aware**: More detailed errors in development, sanitized errors in production
3. **Correlation Support**: All errors include correlation IDs for tracking
4. **Client-Friendly**: Error messages designed to be useful for frontend display

Implementation details:
```json
{
  "error": "ErrorType",
  "message": "User-friendly error message",
  "correlation_id": "uuid-v4-correlation-id",
  "details": {
    // Additional error details (development only)
    "stackTrace": "...",
    "context": "..."
  }
}
```

### 5. Transaction Management Strategy

We have decided to use explicit transactions rather than automatic transactions because:

1. **Control**: Explicit transactions provide clear control over transaction boundaries
2. **Visibility**: Makes transaction scope obvious in the code
3. **Performance**: Can optimize transaction duration for specific operations
4. **Intentionality**: Forces developers to think about transaction requirements

Implementation details:
- Use TransactionContext as a context manager for explicit transactions
- Define clear transaction boundaries around logical operations
- Implement proper error handling and rollback logic
- Log transaction completion status and duration
