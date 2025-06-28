# Maria AI Agent Refactoring Next Steps

This document outlines the detailed tasks for the upcoming phases of the Maria AI Agent refactoring project. Last updated on June 27, 2025.

## Immediate Next Steps (All Resolved ✅)

### Fix Import Structure Issue (Highest Priority) ✅
- Fix the ModuleNotFoundError for 'backend' module ✅
- Update import statements throughout the codebase ✅
- Test application startup and all key functionality ✅

### Configure Flask-Limiter Storage Backend (High Priority) ✅
- Add Redis as a dependency in requirements.txt ✅
- Configure Redis as the persistent storage backend for rate limiting ✅
- Update app_factory.py with proper Redis configuration ✅
- Add REDIS_URL environment variable to .env and .env.example ✅
- Implement fallback for development environments ✅
- Update tests to handle Redis dependency ✅

### Phase 4: Backend Improvements - Higher Risk (Continue)

#### Step 2: Complete Route Organization (By July 10, 2025)

1. **Complete Blueprint Migration (In Progress)**
   - Migrate all remaining routes to blueprints ✅
   - Implement consistent error handling across blueprints ✅
   - Add proper API versioning and URL prefix structure ✅
   - Add proper documentation for all endpoints (Next)
   
2. **Middleware Enhancements**
   - Complete request logging middleware
   - Implement authentication middleware
   - Add correlation ID for request tracking
   - Ensure proper error propagation

3. **API Documentation**
   - Add OpenAPI specification
   - Create Swagger UI integration
   - Document all endpoints with examples
   - Include error response documentation

#### Step 3: Database Optimization (By July 15, 2025)

1. **Query Optimization**
   - Implement eager loading for relationships
   - Add indexes for common query patterns
   - Optimize complex queries
   - Add database connection pooling

2. **Transaction Management Integration**
   - Integrate TransactionContext with all services
   - Add proper error handling for transactions
   - Implement retry logic for transient errors
   - Add transaction logging

3. **Database Testing**
   - Create database fixtures for tests
   - Add isolation for test cases
   - Implement database migration testing
   - Add performance benchmarks

### Phase 5: Context and Global State Refinements (Continue)

#### Complete API Integration (By July 5, 2025)

1. **Finalize API Service Layer**
   - Complete API client implementation
   - Add proper error handling for network issues
   - Implement request retries
   - Add request/response logging

2. **Context Integration**
   - Complete ChatContext implementation
   - Integrate with state machine
   - Add proper error boundaries
   - Implement loading states

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

## Specific Implementation Tasks

### Blueprint Implementation

```python
# app/routes/api/v1/session_bp.py
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from backend.app.services.session_service import SessionService
from backend.app.schemas.session_schema import SessionSchema
from flask_limiter.util import get_remote_address
from flask_limiter import Limiter

session_bp = Blueprint('session_bp', __name__)
limiter = Limiter(key_func=get_remote_address)

@session_bp.route('/sessions', methods=['POST'])
@limiter.limit("10 per minute")
def create_session():
    try:
        session_service = SessionService()
        session_data = SessionSchema().load(request.json)
        result = session_service.create_session(session_data)
        return jsonify(SessionSchema().dump(result)), 201
    except ValidationError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

### TransactionContext Integration

```python
# Using the TransactionContext with repositories
from backend.app.database.transaction import TransactionContext
from backend.app.repositories.user_session_repository import UserSessionRepository

def update_user_data(user_id, new_data):
    with TransactionContext() as tx:
        # Get repositories with the transaction session
        user_repo = UserSessionRepository(session=tx.session)
        
        # Operations within the transaction
        user = user_repo.get_by_id(user_id)
        user.update_data(new_data)
        user_repo.update(user)
        
        # Transaction automatically commits if no exceptions are raised
    return user
```

### ChatContext Integration

```typescript
// src/contexts/ChatContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Message, ChatState, ChatAction } from '../types';
import { chatReducer } from '../state/chatReducer';
import { useChatApi } from '../api/chatApi';

interface ChatContextValue {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (content: string) => Promise<void>;
  resetChat: () => void;
  handleButtonClick: (action: string) => void;
}

const initialState: ChatState = {
  messages: [],
  isInputDisabled: false,
  isLoading: false,
  error: null,
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const api = useChatApi();

  // Implementation details...

  return (
    <ChatContext.Provider value={{ state, dispatch, sendMessage, resetChat, handleButtonClick }}>
      {children}
    </ChatContext.Provider>
  );
};
```

### Port Configuration and Environment Variables (High Priority)

- Audit codebase to ensure no hardcoded port values exist anywhere in the code
- Ensure dynamic CORS configuration correctly reads frontend port:
  ```python
  # Dynamic CORS configuration in app_factory.py
  def get_frontend_origin():
      frontend_port = get_frontend_port()  # Read from frontend/.env or fallback
      allowed_hosts = os.getenv("CORS_HOSTS", "localhost,127.0.0.1").split(",")
      
      origins = []
      for host in allowed_hosts:
          origins.append(f"http://{host}:{frontend_port}")
          origins.append(f"https://{host}:{frontend_port}")
      
      return origins
  ```
- Update all environment variable documentation to emphasize:
  - Port configuration flexibility
  - No hardcoding of ports or URLs
  - Configuration variable precedence
- Ensure frontend API configuration correctly uses the configured backend URL:
  ```typescript
  // frontend/src/api/config.ts - example implementation
  export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  ```
- Add validation to ensure API URLs are correctly set before making API requests
- Create thorough documentation for troubleshooting port conflicts
