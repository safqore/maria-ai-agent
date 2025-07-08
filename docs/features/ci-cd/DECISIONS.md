# CI/CD Decisions

**Last Updated:** January 8, 2025

## Platform & Architecture

### GitHub Actions Platform
- **Decision**: Use GitHub Actions over Jenkins/CircleCI
- **Rationale**: Better GitHub integration, generous free tier, seamless workflow triggers
- **Implementation**: Parallel jobs for backend and frontend, push/PR triggers

### Parallel Job Architecture
- **Decision**: Use parallel backend and frontend jobs
- **Rationale**: Reduces total pipeline time and provides faster developer feedback
- **Implementation**: Separate jobs with shared workflow triggers

## Testing Strategy

### SQLite Threading Configuration
- **Decision**: Use StaticPool for file-based SQLite, NullPool for in-memory
- **Rationale**: Thread safety for concurrent test execution, proper connection management
- **Implementation**: check_same_thread: False, isolation_level: None

### Cross-Platform Database Support
- **Decision**: Support both PostgreSQL and SQLite for flexibility
- **Rationale**: Development uses SQLite, production uses PostgreSQL
- **Implementation**: Environment-specific database configuration

### Quality Tools Selection
- **Decision**: Use industry-standard formatting and linting tools
- **Rationale**: Ensures code quality consistency and automated standards enforcement
- **Implementation**: black + flake8 (Python), prettier + eslint (TypeScript)

## Implementation Approach

### Multi-Phase Development
- **Decision**: CI first, then CD for manageable complexity
- **Rationale**: Reduces risk and allows incremental validation
- **Implementation**: Phase 1 (CI) complete, Phase 2 (CD) planned 