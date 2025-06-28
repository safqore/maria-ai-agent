# Maria AI Agent Refactoring Next Steps

This document outlines the detailed tasks for the upcoming phases of the Maria AI Agent refactoring project. Last updated on June 28, 2025.

## Immediate Next Steps

### Complete API Testing (Highest Priority) ⏳

1. **Integration Tests for API Endpoints** ⏳
   - Create comprehensive integration tests for session endpoints
   - Create integration tests for upload endpoints
   - Test versioned endpoints with correlation ID tracking
   - Verify correct error handling across all endpoints

2. **Authentication Testing** ⏳
   - Test API endpoints with various authentication scenarios
   - Verify unauthorized access is properly rejected
   - Test authentication information endpoint
   - Ensure authentication middleware works with blueprints

3. **Add API Documentation Examples** (Medium Priority)
   - Add example requests with curl commands
   - Add example responses for successful and error cases
   - Document authentication requirements clearly
   - Provide correlation ID usage examples

### Frontend API Integration (Medium-High Priority)

1. **API Client Implementation**
   - Update API client to use versioned endpoints
   - Add correlation ID tracking in requests and responses
   - Add proper error handling for network issues
   - Implement request retries
   - Add request/response logging

2. **Context Integration**
   - Ensure ChatContext properly handles API responses
   - Add loading states for API requests
   - Implement error boundaries for API failures
   - Add correlation ID tracking for frontend debugging

### Database Optimization (Medium Priority)

1. **Query Optimization**
   - Implement eager loading for relationships
   - Add indexes for common query patterns
   - Optimize complex queries
   - Add database connection pooling

2. **Transaction Management Integration**
   - Integrate TransactionContext with all services
   - Add proper error handling for transactions
   - Add transaction logging

3. **Database Testing**
   - Create database fixtures for tests
   - Add isolation for test cases
   - Implement database migration testing

## Future Phases (Post July 15, 2025)

### Phase 6: Performance Optimization

1. **Backend Performance**
   - Implement caching
   - Add database query optimization
   - Improve response time for key endpoints
   - Add compression for responses

2. **Frontend Performance**
   - Implement code splitting
   - Add lazy loading for components
   - Optimize bundle size
   - Improve rendering performance

### Phase 7: Enhanced Testing

1. **Coverage Improvement**
   - Increase test coverage to 80%+
   - Add property-based testing
   - Implement snapshot testing
   - Add end-to-end tests

2. **Testing Infrastructure**
   - Set up continuous integration
   - Add automated performance testing
   - Implement visual regression testing
   - Create test result dashboards

### Phase 8: Monitoring and Observability

1. **Logging Enhancements**
   - Implement structured logging
   - Add log aggregation
   - Create log analysis dashboards
   - Set up log-based alerts

2. **Metrics and Monitoring**
   - Implement application metrics
   - Add health check endpoints
   - Create monitoring dashboards
   - Set up threshold-based alerts

## Completed Tasks (June 28, 2025) ✅

### Implemented Blueprint Middleware Integration ✅
- Created apply_middleware_to_blueprint function for consistent middleware
- Added API versioning header to all responses
- Implemented consistent error handling across blueprints
- Created tests for blueprint middleware integration
- Updated app factory to use blueprint middleware

### Enhanced Request Validation and Correlation ID Tracking ✅
- Implemented JSON request validation middleware
- Added correlation ID tracking and propagation
- Enhanced request logging with more detailed information
- Added comprehensive tests for middleware functionality
- Updated API documentation with correlation ID information

### Enhanced Authentication Middleware ✅
- Implemented simple token-based authentication
- Added authorization handling for API routes
- Created API endpoint for auth information
- Improved error handling and logging for auth failures

### Fixed Import Structure Issue ✅
- Fixed the ModuleNotFoundError for 'backend' module 
- Updated import statements throughout the codebase
- Tested application startup and all key functionality

### Configured Flask-Limiter Storage Backend ✅
- Added Redis as a dependency in requirements.txt
- Configured Redis as the persistent storage backend for rate limiting
- Updated app_factory.py with proper Redis configuration
- Added REDIS_URL environment variable
- Implemented fallback for development environments
- Updated tests to handle Redis dependency

## Code Examples

### Blueprint Middleware Application

```python
def apply_middleware_to_blueprint(blueprint, api_version=None):
    """
    Apply middleware to a blueprint.
    
    This function applies standard middleware to a Flask blueprint,
    ensuring consistent behavior across all endpoints.
    
    Args:
        blueprint: The Flask blueprint to apply middleware to
        api_version: Optional API version for versioning middleware
    """
    # Add request logging
    before_request, after_request = log_request_middleware()
    blueprint.before_request(before_request)
    blueprint.after_request(after_request)
    
    # Add JSON validation
    blueprint.before_request(validate_json_middleware())
    
    # Add API versioning if version is provided
    if api_version:
        blueprint.after_request(versioning_middleware(api_version))
    
    # Add error handling
    error_handler = error_handling_middleware(blueprint.name)
    for err in [400, 401, 403, 404, 405, 429, 500]:
        blueprint.errorhandler(err)(error_handler)
    
    logger.info(f"Applied middleware to blueprint: {blueprint.name}")
    
    return blueprint
```

### Using Middleware with Blueprints in App Factory

```python
# Apply middleware to blueprints
logger.info("Applying middleware to blueprints")
apply_middleware_to_blueprint(session_bp)
apply_middleware_to_blueprint(upload_bp)

# Register blueprints with proper API versioning
# First register with empty prefix for backward compatibility
app.register_blueprint(session_bp, url_prefix='')
app.register_blueprint(upload_bp, url_prefix='')

# Also register with versioned API prefix for new clients
app.register_blueprint(session_bp, url_prefix=versioned_prefix, name=f"session_{api_version}")
app.register_blueprint(upload_bp, url_prefix=versioned_prefix, name=f"upload_{api_version}")
```
