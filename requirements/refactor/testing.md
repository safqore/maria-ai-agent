# Maria AI Agent Refactoring Testing Plan

This document outlines the comprehensive testing approach for the Maria AI Agent refactoring project. Last updated on June 27, 2025.

## Testing Strategy

### Testing Goals

1. **Ensure Functional Equivalence**: Verify that the refactored code maintains the same behavior as the original code.
2. **Prevent Regressions**: Identify and fix any regressions introduced during the refactoring process.
3. **Validate Improved Architecture**: Confirm that the new architecture meets the design goals and best practices.
4. **Increase Test Coverage**: Improve overall test coverage, especially for previously untested components.

### Testing Types

1. **Unit Tests**
   - Test individual functions, classes, and components in isolation
   - Mock dependencies for focused testing
   - High coverage of business logic

2. **Integration Tests**
   - Test interactions between components
   - Test API integrations
   - Validate state management flows

3. **End-to-End Tests**
   - Test complete user scenarios
   - Validate critical user flows

4. **Visual Regression Tests**
   - Ensure UI components maintain appearance
   - Compare before and after screenshots

## Testing Plan by Phase

### Phase 4: Backend Improvements - Higher Risk

#### SQLAlchemy ORM Implementation

1. **Unit Tests**
   - Test each repository method in isolation
   - Verify model relationships
   - Test transaction handling

2. **Integration Tests**
   - Test repository integration with services
   - Verify database operations
   - Test migration scripts

#### Improved Route Organization

1. **Unit Tests**
   - Test individual endpoints
   - Verify request validation
   - Test error handling

2. **Integration Tests**
   - Test endpoint interactions
   - Verify middleware functionality
   - Test authentication and authorization

#### Authentication Middleware Integration ✅

1. **Integration Tests**
   - Implemented tests for protected routes requiring API keys
   - Added tests for open routes with no authentication requirements
   - Implemented API key validation tests (header and query parameter methods)
   - Added tests for invalid, empty, and missing API keys
   - Implemented correlation ID tracking tests for authenticated requests
   - Added tests for the auth-info endpoint with proper response format validation
   - Implemented tests for API version headers in responses

2. **Example Authentication Test**

```python
# tests/integration/test_auth_api.py

def test_protected_route_requires_key(self, client):
    """Test that protected routes reject requests without API key."""
    response = client.get('/api/test/protected')
    assert response.status_code == 401
    data = json.loads(response.data)
    assert data["error"] == "Unauthorized"

def test_protected_route_valid_key(self, client):
    """Test that protected routes accept valid API key."""
    response = client.get(
        '/api/test/protected', 
        headers={"X-API-Key": "test-key"}
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["status"] == "success"

def test_correlation_id_with_auth(self, client):
    """Test that correlation ID is preserved with authentication."""
    correlation_id = str(uuid.uuid4())
    response = client.get(
        '/api/test/protected', 
        headers={
            "X-API-Key": "test-key",
            "X-Correlation-ID": correlation_id
        }
    )
    assert response.status_code == 200
    assert response.headers.get("X-Correlation-ID") == correlation_id
```

### Phase 5: Context and Global State Refinements

1. **Unit Tests**
   - Test state transitions
   - Verify context providers
   - Test adapter functionality

2. **Integration Tests**
   - Test context integration with components
   - Verify state management flows
   - Test API integration

## Test Implementation

### Backend Testing

#### Example Repository Test

```python
# tests/test_user_session_repository.py

import pytest
from backend.app.repositories.user_session_repository import UserSessionRepository
from backend.app.database.models import UserSession

class TestUserSessionRepository:
    def test_create_session(self, db_session):
        # Arrange
        repo = UserSessionRepository(db_session)
        session_data = {
            "uuid": "test-uuid",
            "created_at": "2025-06-27T12:00:00Z",
            "status": "active"
        }
        
        # Act
        session = repo.create(UserSession(**session_data))
        
        # Assert
        assert session.uuid == "test-uuid"
        assert session.status == "active"
        
    def test_get_by_uuid(self, db_session):
        # Arrange
        repo = UserSessionRepository(db_session)
        session_data = {
            "uuid": "test-uuid",
            "created_at": "2025-06-27T12:00:00Z",
            "status": "active"
        }
        repo.create(UserSession(**session_data))
        
        # Act
        session = repo.get_by_uuid("test-uuid")
        
        # Assert
        assert session is not None
        assert session.uuid == "test-uuid"
```

#### Example Blueprint Test

```python
# tests/test_session_blueprint.py

import pytest
import json
from backend.app import create_app

class TestSessionBlueprint:
    @pytest.fixture
    def client(self):
        app = create_app(testing=True)
        with app.test_client() as client:
            yield client
    
    def test_create_session(self, client):
        # Arrange
        data = {
            "uuid": "test-uuid",
            "client_info": {"browser": "Chrome"}
        }
        
        # Act
        response = client.post(
            '/api/v1/sessions',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 201
        resp_data = json.loads(response.data)
        assert resp_data.get('uuid') == "test-uuid"
```

### Frontend Testing

#### Example Context Test

```typescript
// src/__tests__/contexts/ChatContext.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatProvider } from '../../contexts/ChatContext';
import { useChatContext } from '../../hooks/useChatContext';

// Mock component that uses the context
const TestComponent = () => {
  const { state, sendMessage } = useChatContext();
  
  return (
    <div>
      <div data-testid="loading">{state.isLoading.toString()}</div>
      <div data-testid="message-count">{state.messages.length}</div>
      <button data-testid="send-button" onClick={() => sendMessage('Hello')}>
        Send Message
      </button>
    </div>
  );
};

describe('ChatContext', () => {
  it('should initialize with default state', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('message-count').textContent).toBe('0');
  });
  
  it('should handle sending a message', async () => {
    // Mock API implementation
    jest.mock('../../api/chatApi', () => ({
      useChatApi: () => ({
        sendMessage: jest.fn().mockResolvedValue({ text: 'Response' })
      })
    }));
    
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );
    
    fireEvent.click(screen.getByTestId('send-button'));
    
    // Should show loading state
    expect(screen.getByTestId('loading').textContent).toBe('true');
    
    // Wait for response
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('message-count').textContent).toBe('2');
    });
  });
});
```

## Test Coverage Goals

| Module | Current Coverage | Target Coverage |
|--------|-----------------|----------------|
| Backend Services | 65% | 90% |
| Backend Routes | 70% | 90% |
| Backend Repositories | 75% | 95% |
| Frontend Components | 60% | 80% |
| Frontend State | 50% | 85% |
| Frontend Hooks | 55% | 80% |

## Testing Infrastructure

### Tools and Libraries

#### Backend
- pytest for test framework
- pytest-cov for coverage reporting
- pytest-mock for mocking
- pytest-flask for Flask-specific testing

#### Frontend
- Jest for test framework
- React Testing Library for component testing
- Mock Service Worker for API mocking
- Jest Snapshot for UI testing

### Continuous Integration

- Run tests automatically on every pull request
- Block merges if tests fail
- Report coverage metrics
- Run performance tests on scheduled basis

## Test Implementation Plan

1. **Week 1**: Create test infrastructure and base test cases
2. **Week 2**: Implement repository and model tests
3. **Week 3**: Implement service and endpoint tests
4. **Week 4**: Implement frontend component and state tests
5. **Week 5**: Create end-to-end test suites and performance tests

### Port Configuration Tests

#### Example CORS Configuration Test

```python
# tests/test_app_factory.py

import pytest
from backend.app.app_factory import create_app, get_frontend_port

class TestAppFactory:
    def test_cors_configuration_with_frontend_port(self, monkeypatch):
        # Arrange
        monkeypatch.setenv("FRONTEND_PORT_FALLBACK", "3333")
        
        # Act
        app = create_app(testing=True)
        
        # Assert
        # Check that CORS is configured with the correct frontend port
        cors_origins = app.config.get('CORS_ORIGINS', [])
        assert "http://localhost:3333" in cors_origins
        assert "http://127.0.0.1:3333" in cors_origins
    
    def test_get_frontend_port(self, monkeypatch, tmp_path):
        # Arrange
        # Create a mock frontend/.env file
        frontend_env = tmp_path / "frontend" / ".env"
        frontend_env.parent.mkdir()
        frontend_env.write_text("PORT=4444\n")
        
        monkeypatch.setattr("backend.app.app_factory.FRONTEND_ENV_PATH", 
                           str(frontend_env))
        
        # Act
        port = get_frontend_port()
        
        # Assert
        assert port == "4444"
    
    def test_get_frontend_port_fallback(self, monkeypatch):
        # Arrange
        # Set non-existent path to force fallback
        monkeypatch.setattr("backend.app.app_factory.FRONTEND_ENV_PATH", 
                           "/nonexistent/path")
        monkeypatch.setenv("FRONTEND_PORT_FALLBACK", "5555")
        
        # Act
        port = get_frontend_port()
        
        # Assert
        assert port == "5555"
```

#### Example Frontend API Configuration Test

```typescript
// src/__tests__/utils/config.test.ts

import { API_BASE_URL } from '../../utils/config';

describe('API Configuration', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });
  
  afterAll(() => {
    process.env = originalEnv;
  });
  
  it('should use the environment variable for API_BASE_URL when available', () => {
    // Arrange
    process.env.REACT_APP_API_BASE_URL = 'http://localhost:8888';
    
    // Act - force reloading the module
    const config = require('../../utils/config');
    
    // Assert
    expect(config.API_BASE_URL).toBe('http://localhost:8888');
  });
  
  it('should fall back to default API_BASE_URL when environment variable not available', () => {
    // Arrange
    delete process.env.REACT_APP_API_BASE_URL;
    
    // Act - force reloading the module
    const config = require('../../utils/config');
    
    // Assert
    expect(config.API_BASE_URL).toBe('http://localhost:5000');
  });
});
```
