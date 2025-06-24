# Testing Plan for Maria AI Agent Refactoring

This document outlines the testing approach for the refactoring of the Maria AI Agent project.

## Testing Scripts

### Backend Testing

```bash
cd backend
pytest -v
```

Or use the Makefile command:

```bash
make test-backend
```

### Frontend Testing

```bash
cd frontend
npm test
```

Or use the Makefile command:

```bash
make test-frontend
```

### Running All Tests

```bash
make test-all
```

## Testing Approach

The testing approach for the refactoring will ensure that the functionality of the application remains intact while improving the codebase structure and quality. We will use a combination of unit tests, integration tests, and manual testing.

### Testing Levels

1. **Unit Testing**
   - Backend: Testing individual functions and classes in isolation
   - Frontend: Testing individual components, hooks, and utilities

2. **Integration Testing**
   - Backend: Testing API endpoints with mock database
   - Frontend: Testing component interactions

3. **Manual Testing**
   - Verify that the user interface works correctly
   - Verify that the application flow works as expected
   - Verify that the API endpoints work as expected

## Critical Functionality to Test

### Backend

1. **Session Management**
   - UUID generation and validation
   - Session persistence
   - Session retrieval

2. **File Upload**
   - File validation
   - File storage
   - Error handling

### Frontend

1. **State Management**
   - State transitions
   - State persistence
   - Error handling

2. **User Interactions**
   - Chat interactions
   - File upload interactions
   - Form submissions

3. **API Integration**
   - API calls for session management
   - API calls for file upload

## Testing Checklist for Each Refactoring Phase

Before considering a refactoring phase complete, verify that:

1. All unit tests pass
2. All integration tests pass
3. The application functions correctly in a manual test
4. No new errors appear in the browser console or server logs
5. The application behaves identically to the pre-refactoring version

## Test Scripts

### Backend Testing

```bash
cd backend
pytest -v
```

### Frontend Testing

```bash
cd frontend
npm test
```

## Test Infrastructure Improvements

### Completed

1. **Backend Test Organization**
   - Added conftest.py for shared fixtures
   - Standardized import organization
   - Fixed pytest warnings

2. **Frontend Test Configuration**
   - Fixed Jest configuration
   - Added style mocks for CSS imports
   - Updated component tests to use modern testing practices

### Completed in Phase 2

1. **Backend Service Layer Testing**
   - Updated tests to use the new service layer classes
   - Fixed test mocking to patch the correct service methods
   - Verified all backend tests pass with the new architecture

### Completed in Phase 3

1. **Frontend Component Tests**
   - ✅ Added tests for new split components:
     - File Upload: FileUploadButton, FileStatusItem, FileStatusList
     - Chat: ChatMessages, ChatControls, ChatActions, ChatContainer
   - ✅ Updated existing tests to use the new API service layer
   - ✅ Used proper mocking strategies for API services
   - ✅ Created tests for new API service modules and hooks
   - ✅ Added tests for error handling with ErrorBoundary
   - ✅ Created tests for new context-based state management (ChatContext, FileUploadContext)
   - ✅ Fixed React 18 compatibility issues in hook tests
   - ✅ Fixed component mocking strategies for better reliability
   - ✅ Added proper TypeScript typing to test files
   - ✅ Ensured all tests pass with the new component structure
   - ✅ Fixed browser API mocks (XMLHttpRequest, scrollIntoView)
   - ✅ Improved test coverage for error handling scenarios

### Planned for Next Phases

2. **Improved Test Coverage**
   - Add tests for error handling
   - Add tests for request validation

3. **Test Automation**
   - Add GitHub Actions workflows for CI/CD
   - Add pre-push hooks for running tests

## Acceptance Criteria

The refactoring will be considered successful if:

1. All existing functionality works as it did before
2. No regression bugs are introduced
3. The codebase is more maintainable and follows best practices
4. Documentation is improved
5. Test coverage is improved

This testing plan will be updated as the refactoring progresses and new test cases are identified.
