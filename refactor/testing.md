# Maria AI Agent Refactoring Testing Plan

This document outlines the comprehensive testing approach for the Maria AI Agent refactoring project.

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
   - Compare UI appearance before and after changes
   - Ensure design consistency

5. **Manual Testing**
   - Verify user experience and interactions
   - Validate edge cases difficult to automate
   - Exploratory testing

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

## Test Coverage by Component

### Backend Components

| Component | Test Type | Coverage Status | Notes |
|-----------|-----------|----------------|-------|
| Session Service | Unit | ✅ Complete | Tests for UUID generation, validation, and persistence |
| Upload Service | Unit | ✅ Complete | Tests for file validation and storage |
| Error Handling | Unit | ✅ Complete | Tests for API error responses |
| Database Layer | Unit | ⚠️ Partial | Additional tests needed for edge cases |
| API Routes | Integration | ✅ Complete | Tests for all API endpoints |

### Frontend Components

| Component | Test Type | Coverage Status | Notes |
|-----------|-----------|----------------|-------|
| Chat Components | Unit | ✅ Complete | Tests for rendering and user interactions |
| File Upload | Unit | ✅ Complete | Tests for file selection and upload process |
| API Services | Unit | ✅ Complete | Tests for API calls and error handling |
| Hooks | Unit | ⚠️ Partial | Missing tests for some custom hooks |
| State Management | Unit | ⚠️ Partial | Additional tests needed for complex state transitions |
| ErrorBoundary | Unit | ✅ Complete | Tests for error catching and fallback rendering |
| End-to-End Flows | E2E | ❌ Missing | Planned for Phase 5 |

## Critical Test Cases

### Backend

1. **Session Management**
   - Generate and validate UUIDs
   - Test UUID collision handling
   - Verify session persistence and retrieval
   - Test session expiration logic

2. **File Upload**
   - Validate file mime types
   - Test file size limits
   - Verify file storage and retrieval
   - Test error handling for invalid files
   - Verify multiple file uploads

3. **API Error Handling**
   - Test 400 error responses for invalid input
   - Test 404 error responses for missing resources
   - Test 500 error responses for server errors
   - Verify error response format consistency

### Frontend

1. **Chat Flow**
   - Display welcome message on load
   - Send user message and receive response
   - Display action buttons at appropriate times
   - Handle button click actions
   - Display typing indicator during AI response
   - Handle error states gracefully

2. **File Upload Flow**
   - Select files via file dialog
   - Display file list with status
   - Show upload progress
   - Handle upload errors
   - Limit file types and sizes

3. **State Management**
   - Initialize state correctly
   - Transition between states based on actions
   - Maintain consistent UI based on state
   - Handle error states
   - Recover from errors

## Regressions to Watch

1. **Chat Button Display Issue**
   - Button actions must appear at appropriate times during chat flow
   - Buttons must respond to clicks
   - Visual appearance must match design

2. **Error Handling Regression**
   - API errors must be caught and displayed
   - Network errors must be handled gracefully
   - UI should provide recovery options

3. **State Management Regression**
   - State transitions must follow expected flow
   - UI must update correctly based on state
   - No unexpected state changes

## Test Infrastructure Improvements

### Completed

1. **Backend Test Organization**
   - Added conftest.py for shared fixtures
   - Standardized import organization
   - Fixed pytest warnings
   - Created separate test directory structure

2. **Frontend Test Configuration**
   - Fixed Jest configuration
   - Added style mocks for CSS imports
   - Updated component tests to use modern testing practices
   - Fixed React 18 compatibility issues

### Completed in Phase 2

1. **Backend Service Layer Testing**
   - Updated tests to use the new service layer classes
   - Fixed test mocking to patch the correct service methods
   - Verified all backend tests pass with the new architecture

### Completed in Phase 3

1. **Frontend Component Tests**
   - Added tests for new split components
   - Updated existing tests to use the new API service layer
   - Used proper mocking strategies for API services
   - Added tests for error handling with ErrorBoundary
   - Created tests for context-based state management
   - Fixed component mocking strategies
   - Added proper TypeScript typing to test files

### Planned for Next Phases

1. **End-to-End Testing Setup**
   - Set up Cypress for E2E testing
   - Create test fixtures for common scenarios
   - Implement page object model for test maintainability
   - Create automated test scripts for critical flows

2. **Visual Regression Testing**
   - Set up visual regression testing tool
   - Create baseline screenshots for key UI components
   - Implement automated visual comparison in CI/CD

3. **Performance Testing**
   - Set up tools to measure rendering performance
   - Create benchmarks for API response times
   - Implement monitoring for key performance metrics

4. **Test Automation Pipeline**
   - Set up GitHub Actions workflow for CI/CD
   - Implement pre-push hooks for running tests
   - Create test coverage reports
   - Add test status badges to README

## Testing Checklist for Each Phase

Before considering a refactoring phase complete, verify that:

1. All unit tests pass
2. All integration tests pass
3. The application functions correctly in a manual test
4. No new errors appear in the browser console or server logs
5. The application behaves identically to the pre-refactoring version
6. Code coverage has not decreased
7. Documentation is updated to reflect changes

## Manual Testing Procedures

### Setup

1. Start backend server:
   ```bash
   cd backend
   python wsgi.py
   ```

2. Start frontend development server:
   ```bash
   cd frontend
   npm start
   ```

3. Open browser at http://localhost:3000

### Chat Flow Test

1. Verify welcome message appears
2. Click available action buttons and verify responses
3. Type a message and send
4. Verify typing indicator appears
5. Verify AI response appears
6. Verify subsequent action buttons appear as expected

### File Upload Test

1. Click the file upload button
2. Select multiple files of different types
3. Verify file list appears with status indicators
4. Verify upload progress is displayed
5. Verify success message after upload completes
6. Verify error handling for invalid file types

### Error Handling Test

1. Disconnect from internet and attempt to send a message
2. Verify appropriate error message is displayed
3. Reconnect to internet and verify recovery
4. Submit invalid input and verify error handling
5. Test with very large files to trigger size limit errors

## Acceptance Criteria

The refactoring will be considered successful from a testing perspective if:

1. All existing functionality works as it did before
2. All tests pass in the CI/CD pipeline
3. No regression bugs are reported by users
4. The codebase has improved test coverage
5. Testing procedures are well-documented and maintainable

This testing plan will be updated as the refactoring progresses and new test cases are identified.
