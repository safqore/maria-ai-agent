# CI/CD Decisions

## Database Testing Decisions

### Migration Strategy
- **Decision**: Migrations run automatically before tests
- **Rationale**: Ensures consistent test environment
- **Implementation**: Automated migration application before test execution

### Migration Tool Selection
- **Decision**: Alembic is the standard migration tool for SQLAlchemy applications
- **Rationale**: Provides better version control than raw SQL scripts
- **Implementation**: Alembic configuration with automatic migration application

### Testing Database Strategy
- **Decision**: SQLite is the default for all test runs (local/dev/test environments)
- **Rationale**: Self-contained testing without external dependencies, faster execution
- **Implementation**: SQLite in-memory for CI, file-based for local testing

### Database Initialization Strategy
- **Decision**: Automated database setup with migrations applied before test execution
- **Rationale**: Ensures test reliability and consistency
- **Implementation**: Pre-test migration application

### Threading Strategy
- **Decision**: Use thread-local database connections or skip concurrent tests that require thread safety
- **Rationale**: Prevents SQLite threading issues in concurrent scenarios
- **Implementation**: Thread-safe database configuration

## Testing Architecture Decisions

### Database Sufficiency
- **Decision**: SQLite is sufficient for all development and testing scenarios
- **Rationale**: Self-contained, no external dependencies, consistent across environments
- **Implementation**: SQLite for all test environments

### Migration Version Control
- **Decision**: Alembic migrations provide better version control than raw SQL scripts
- **Rationale**: Better tracking, rollback capabilities, team collaboration
- **Implementation**: Alembic-based migration system

### Test Reliability Strategy
- **Decision**: Automatic migration application before tests ensures test reliability
- **Rationale**: Consistent database state across all test runs
- **Implementation**: Pre-test migration automation

### Database Initialization Flexibility
- **Decision**: Database initialization scripts should work from both project root and backend
- **Rationale**: Flexibility in execution context
- **Implementation**: Path-agnostic initialization scripts

### Test Database Separation
- **Decision**: Test database should be separate from development database
- **Rationale**: Prevents test interference with development data
- **Implementation**: Separate maria_ai_test.db for testing

## Cross-References
- Architecture: decisions.md (Testing architecture decisions)
- Integration: integration-map.md (CI/CD dependencies)
- Patterns: patterns.md (Testing patterns) 