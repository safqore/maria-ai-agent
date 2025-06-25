# Maria AI Agent Refactoring Project

This document serves as the central reference for the Maria AI Agent refactoring project. It consolidates information from previously separate documents to provide a single source of truth for the refactoring effort.

## Table of Contents
1. [Refactoring Plan](#refactoring-plan)
2. [Current Progress](#current-progress)
3. [Next Steps](#next-steps)
4. [Testing Plan](#testing-plan)

## Refactoring Plan

### Goals
- Improve code organization, maintainability, and adherence to best practices
- Make the codebase more extendable and easier to understand for future development
- Maintain functional behavior throughout the refactoring process

### Implementation Phases

#### Phase 1: Setup and Preparation (Weeks 1-2) ✅
- Set up linting and formatting ✅
- Improve documentation ✅
- Prepare testing infrastructure ✅

#### Phase 2: Backend Improvements - Lower Risk (Weeks 3-5) ✅
- Create service layer ✅
- Implement centralized error handling ✅
- Add request validation ✅

#### Phase 3: Frontend Improvements - Lower Risk (Weeks 6-8) ✅
- Create API service layer ✅
- Refactor custom hooks ✅
- Break down large components ✅
- Implement consistent error handling ✅
- Improve state management ✅

#### Phase 4: Backend Improvements - Higher Risk (Weeks 9-11)
- Implement SQLAlchemy ORM
- Improve route organization

#### Phase 5: Frontend Improvements - Higher Risk (Weeks 12-14)
- Reorganize folder structure
- Finalize state management implementation

#### Phase 6: Security and Performance (Weeks 15-16)
- Enhance security measures
- Optimize performance

#### Phase 7: Final Verification and Cleanup (Weeks 17-18)
- Final testing and verification
- Code cleanup

## Current Progress

### Phase 1: Setup and Preparation (Completed) ✅

1. **Set up linting and formatting** ✅
   - Added ESLint and Prettier for frontend TypeScript/React code
   - Added Black, isort, and flake8 for backend Python code
   - Created configuration files (.eslintrc.json, .prettierrc, pyproject.toml, .flake8)
   - Added scripts to package.json for linting and formatting
   - Created Makefile with common development commands
   - Set up pre-commit hooks for automatic code quality checks
   - Fixed ESLint/Prettier dependency conflicts
   - Fixed pre-commit config YAML syntax
   - Fixed locale settings for consistent development environment
   - Fixed all linting and code quality issues

2. **Improve documentation** ✅
   - Added comprehensive docstrings to key backend files
   - Added JSDoc comments to key frontend files
   - Updated README.md with setup and development instructions

3. **Prepare testing infrastructure** ✅
   - Created testing plan
   - Updated Makefile with testing commands
   - Added testing information to README.md
   - Fixed Jest configuration and dependencies for frontend testing
   - Added style mocks for CSS imports in tests
   - Created backend/tests/conftest.py for shared test fixtures
   - Fixed test import organization to follow best practices

### Phase 2: Backend Improvements - Lower Risk (Completed) ✅

1. **Create service layer** ✅
   - Created services directory
   - Moved business logic from routes to service classes
   - Updated route handlers to use the service classes
   - Added comprehensive type hints
   - Verified all tests pass

2. **Implement centralized error handling** ✅
   - Created error handler utility (app/errors.py)
   - Defined custom exception classes
   - Registered error handlers with Flask app
   - Updated routes to use the api_route decorator
   - Replaced manual error handling with exceptions

3. **Add request validation** ✅
   - Installed Marshmallow
   - Created schema definitions
   - Updated route handlers to use schemas
   - Implemented appropriate error responses

### Phase 3: Frontend Improvements - Lower Risk (Completed) ✅

1. **Create API service layer** ✅
   - Created API directory with configuration
   - Implemented separate API modules for different features
   - Created type-safe API implementations with proper error handling

2. **Refactor custom hooks** ✅
   - Improved error handling in useSessionUUID hook
   - Added proper TypeScript types to hook parameters and returns
   - Updated components that use these hooks

3. **Break down large components** ✅
   - Split FileUpload component into smaller components
   - Fixed component prop type issues and TypeScript errors

4. **Implement consistent error handling** ✅
   - Created ErrorBoundary component for handling component errors
   - Created standardized error display components

5. **Improve state management** ✅
   - Created ChatContext for centralized chat state management
   - Improved action typing with proper payload types

## Next Steps

### Phase 5: Context and Global State Refinements (Current - June 26-30, 2025)

#### Step 1: Finalize ChatContext and Adapters (June 26, 2025)

1. **Consolidate Context Interfaces**
   - [ ] Review all context types and interfaces for consistency
   - [ ] Add proper JSDoc documentation to all interfaces
   - [ ] Ensure all methods have proper TypeScript return types
   - [ ] Add unit tests for all context-related logic

2. **Improve State Machine Integration**
   - [ ] Create proper adapter layer between state machine and contexts
   - [ ] Ensure FSM state changes trigger appropriate context updates
   - [ ] Document the relationship between FSM states and UI changes
   - [ ] Add visualization of state transitions for development use

3. **Optimize Context Performance**
   - [ ] Use React.memo for components that only read from context
   - [ ] Split context if needed to avoid unnecessary re-renders
   - [ ] Implement useMemo for complex derived state
   - [ ] Add performance measurements to ensure efficiency

#### Step 2: Add Data Fetching Layer (June 27, 2025)

1. **Create API Data-Fetching System**
   - [ ] Implement proper loading states in contexts
   - [ ] Add request cancellation for network requests
   - [ ] Create standardized error handling for API responses
   - [ ] Make API endpoints configurable via environment variables

2. **Session Management Improvements**
   - [ ] Implement proper session restoration logic
   - [ ] Add automatic session expiration handling
   - [ ] Ensure all API calls include proper session headers
   - [ ] Create a retry mechanism for failed requests

#### Step 3: Cross-cutting Concerns (June 27, 2025)

1. **Logging and Analytics**
   - [ ] Implement proper error logging
   - [ ] Add user interaction analytics
   - [ ] Create performance monitoring hooks
   - [ ] Ensure all logs are properly anonymized

2. **Accessibility Improvements**
   - [ ] Run a comprehensive accessibility audit
   - [ ] Ensure proper keyboard navigation
   - [ ] Verify screen reader compatibility
   - [ ] Add proper focus management

#### Step 4: Final Integration and Testing (June 28, 2025)

1. **End-to-End Testing**
   - [ ] Create comprehensive E2E tests with Cypress
   - [ ] Test all critical user flows
   - [ ] Add visual regression tests
   - [ ] Create automated performance benchmarks

2. **Documentation Updates**
   - [ ] Update component API documentation
   - [ ] Create architectural diagrams
   - [ ] Document state management patterns
   - [ ] Add setup instructions for new developers

## Testing Plan

### Testing Scripts

#### Backend Testing
```bash
cd backend
pytest -v
```

Or use the Makefile command:
```bash
make test-backend
```

#### Frontend Testing
```bash
cd frontend
npm test
```

Or use the Makefile command:
```bash
make test-frontend
```

#### Running All Tests
```bash
make test-all
```

### Testing Approach

The testing approach ensures that the functionality remains intact while improving the codebase. We use a combination of unit tests, integration tests, and manual testing.

#### Testing Levels

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

### Critical Functionality to Test

#### Backend
1. **Session Management**
   - UUID generation and validation
   - Session persistence
   - Session retrieval

2. **File Upload**
   - File validation
   - File storage
   - Error handling

#### Frontend
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

### Testing Checklist for Each Phase

Before considering a refactoring phase complete, verify that:

1. All unit tests pass
2. All integration tests pass
3. The application functions correctly in a manual test
4. No new errors appear in the browser console or server logs
5. The application behaves identically to the pre-refactoring version

### Test Infrastructure Improvements

#### Completed
- Backend Test Organization
- Frontend Test Configuration
- Backend Service Layer Testing
- Frontend Component Tests

#### Planned for Next Phases
- Improved Test Coverage
- Test Automation (GitHub Actions workflows, pre-push hooks)

### Regressions to Address

1. **Chat Button Display Issue**
   - Add test cases to verify buttons are properly displayed
   - Create specific tests to validate button action handlers
   - Create visual regression tests
   - Verify state machine integration with the context system
   - Add integration tests for the button workflow

### Acceptance Criteria

The refactoring will be considered successful if:

1. All existing functionality works as it did before
2. No regression bugs are introduced
3. The codebase is more maintainable and follows best practices
4. Documentation is improved
5. Test coverage is improved

---

**Note:** This document will be updated as the refactoring progresses. All dates and timelines are subject to change based on development progress and priorities.
