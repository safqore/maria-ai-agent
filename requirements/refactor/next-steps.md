# Maria AI Agent Refactoring Next Steps

This document outlines the detailed tasks for the upcoming phases of the Maria AI Agent refactoring project. Last updated on June 28, 2025.

## Immediate Next Steps

### Complete Blueprint Implementation (Highest Priority) ⏳

1. **Complete API Documentation** ⏳
   - Update documentation for any new endpoints
   - Add authentication information to documentation
   - Create example requests and responses for all endpoints

2. **Add OpenAPI/Swagger Integration** (Optional)
   - Add Flask-RESTx or similar library for automatic API documentation
   - Create Swagger UI integration
   - Document endpoints with appropriate tags and descriptions

3. **Middleware Enhancements** ⏳
   - Add correlation ID validation between requests
   - Implement additional logging for authentication events
   - Enhance request validation middleware

4. **API Testing** ⏳
   - Create comprehensive integration tests for API endpoints
   - Test with various authentication scenarios
   - Verify rate limiting behavior

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

### Frontend API Integration (Medium-High Priority)

1. **API Client Implementation**
   - Update API client to use versioned endpoints
   - Add proper error handling for network issues
   - Implement request retries
   - Add request/response logging

2. **Context Integration**
   - Ensure ChatContext properly handles API responses
   - Add loading states for API requests
   - Implement error boundaries for API failures

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

### Enhanced Authentication Middleware ✅
- Implemented simple token-based authentication
- Added authorization handling for API routes
- Created API endpoint for auth information
- Improved error handling and logging for auth failures

### Improved App Factory Configuration ✅
- Added API information endpoint
- Enhanced blueprint registration with proper versioning
- Added version header to all responses
- Improved CORS configuration with dynamic frontend port detection

## Code Examples

### Authentication Middleware

```python
@app.route('/api/auth-info', methods=['GET'])
def auth_info():
    """Return information about API authentication requirements."""
    return jsonify({
        "authentication_required": REQUIRE_AUTH,
        "auth_type": "API Key",
        "header_name": "X-API-Key",
        "query_param": "api_key",
        "documentation": "Add your API key as either a header or query parameter"
    })
```

### API Information Endpoint

```python
@app.route('/api/info')
def api_info():
    """Return API information."""
    return jsonify({
        "name": "Maria AI Agent API",
        "version": api_version,
        "endpoints": {
            "session": f"{versioned_prefix}/",
            "upload": f"{versioned_prefix}/upload",
            "legacy": "/"
        },
        "documentation": "/docs/api_endpoints.md"
    })
```

### Port Configuration and Environment Variables

- No hardcoded port values exist in the codebase
- Dynamic CORS configuration correctly reads frontend port:
  ```python
  def get_frontend_port() -> str:
      """Get the frontend port from environment or frontend .env file."""
      # Try to get from environment first
      port = os.getenv("FRONTEND_PORT")
      if port:
          return port
      
      # Try to get from frontend .env file
      frontend_env = read_frontend_env_file()
      port = frontend_env.get("PORT")
      if port:
          return port
      
      # Default port for React applications
      return "3000"
  ```
