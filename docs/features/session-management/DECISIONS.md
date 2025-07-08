# Session Management Decisions

**Last Updated:** January 8, 2025

## UUID Management Strategy

### Frontend UUID Generation
- **Decision**: Frontend generates UUIDs with backend validation
- **Rationale**: Reduces server load, provides offline capability
- **Implementation**: UUID v4 generation with localStorage persistence

### Backend UUID Validation
- **Decision**: Backend validates UUIDs and handles collisions
- **Rationale**: Ensures uniqueness and prevents conflicts
- **Implementation**: Database checks with retry logic for collisions

## React Architecture

### Context-Based State Management
- **Decision**: Use React Context over prop drilling
- **Rationale**: Eliminates component coupling, centralizes state
- **Implementation**: SessionContext with reducer pattern

### Toast Notifications
- **Decision**: Use react-hot-toast for user feedback
- **Rationale**: Consistent UX, non-intrusive notifications
- **Implementation**: Toast integration for all session operations

## Security Implementation

### Rate Limiting Strategy
- **Decision**: 10 requests per minute per IP address
- **Rationale**: Prevents abuse while allowing normal usage
- **Implementation**: Flask-Limiter with in-memory storage

### Audit Logging
- **Decision**: Comprehensive event logging for security
- **Rationale**: Traceability and debugging capabilities
- **Implementation**: AuditLog model with metadata storage 