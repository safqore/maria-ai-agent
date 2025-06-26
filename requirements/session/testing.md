# Session Management Testing Strategy

This document outlines the testing approach for the session management implementation in the Maria AI Agent project.

## Testing Goals

- Verify correct generation and validation of session UUIDs
- Ensure proper persistence of session data in the database
- Confirm successful association of uploads with sessions
- Validate the audit logging functionality
- Test frontend integration and persistence
- Verify cleanup of orphaned files

## Testing Levels

### Unit Tests

| Component | Test Cases | Status |
|-----------|------------|--------|
| Frontend UUID Functions | - Valid UUID format<br>- Uniqueness across multiple generations<br>- Format validation | ✅ Complete |
| Frontend Session Utils | - Local storage persistence<br>- Session reset<br>- Session validation<br>- Error handling | ✅ Complete |
| Frontend API Layer | - API error handling<br>- Response parsing<br>- Request formatting | ✅ Complete |
| Backend Session Service | - Session creation<br>- Session retrieval<br>- Session validation | 🟡 In Progress |
| Audit Logging | - Log creation<br>- Log retrieval<br>- Log formatting | 🟡 In Progress |

### Integration Tests

| Component | Test Cases | Status |
|-----------|------------|--------|
| API Endpoints | - Session creation endpoint<br>- Session validation endpoint<br>- Response format and status codes | 🟡 In Progress |
| File Upload with Session | - File upload with valid session<br>- File upload with invalid session<br>- Retrieval of files by session | 🟡 In Progress |
| Database Integration | - Session persistence<br>- Session retrieval<br>- Session deletion | 🟡 In Progress |

### End-to-End Tests

| Test Scenario | Description | Status |
|---------------|-------------|--------|
| New User Flow | Test complete flow for a new user without existing session | 🔴 Not Started |
| Returning User Flow | Test flow for a user with existing session | 🔴 Not Started |
| Session Expiry | Test behavior when session expires | 🔴 Not Started |
| File Association | Test file upload and retrieval with session association | 🔴 Not Started |

## Test Automation

### Backend Tests

Backend tests are using pytest with fixtures for database setup and teardown. The following test cases need to be implemented:

```python
def test_session_service_uuid_validation():
    """Test UUID validation logic in the session service."""
    # Test valid UUID format
    assert SessionService.is_valid_uuid("123e4567-e89b-12d3-a456-426614174000") is True
    # Test invalid formats
    assert SessionService.is_valid_uuid("invalid-uuid") is False
    assert SessionService.is_valid_uuid(None) is False
    assert SessionService.is_valid_uuid(123) is False

def test_session_service_check_uuid_exists():
    """Test checking if a UUID exists in the database."""
    # Setup test database with a known UUID
    test_uuid = "123e4567-e89b-12d3-a456-426614174000"
    # Insert test data
    # Check if exists
    assert SessionService.check_uuid_exists(test_uuid) is True
    # Check non-existent UUID
    assert SessionService.check_uuid_exists("non-existent-uuid") is False
```

### Frontend Tests

Frontend tests are using Jest with React Testing Library. The following tests have been implemented:

```typescript
// From existing sessionUtils.test.ts
describe('sessionUtils (async, backend integration)', () => {
  it('should generate and store a new UUID if none exists', async () => {
    const newUuid = '123e4567-e89b-42d3-a456-556642440000';
    mockedGenerateUUID.mockResolvedValue({ status: 'success', uuid: newUuid, message: 'ok' });
    const uuid = await getOrCreateSessionUUID();
    expect(uuid).toBe(newUuid);
    expect(localStorage.getItem('session_uuid')).toBe(newUuid);
  });

  it('should return the existing UUID if present and valid', async () => {
    const validUuid = '123e4567-e89b-42d3-a456-556642440000';
    localStorage.setItem('session_uuid', validUuid);
    mockedValidateUUID.mockResolvedValueOnce({ status: 'success', uuid: null, message: 'ok' });
    const uuid = await getOrCreateSessionUUID();
    expect(uuid).toBe(validUuid);
    expect(localStorage.getItem('session_uuid')).toBe(validUuid);
  });

  // Additional tests for collision, invalid UUID, etc.
});
```

## Manual Testing Checklist

- [x] Verify session UUID persists across page refreshes
- [x] Test UUID validation with valid and invalid formats
- [x] Verify UUID collision detection and resolution
- [x] Test session reset functionality
- [ ] Confirm files uploaded are associated with the correct session
- [ ] Check audit logs for correct session information
- [ ] Verify orphaned file cleanup works as expected
- [ ] Test rate limiting for session endpoints

## Test Data

Sample UUIDs currently being used for testing:

- Valid: `123e4567-e89b-42d3-a456-556642440000`
- Invalid format: `123456-789`
- Empty: `""`
- Null: `null`
- Collision case: A UUID that exists in the database

## Test Environment

- Development: Local PostgreSQL database as configured in the environment
- Test: Mocked API responses for frontend tests
- CI/CD: To be implemented with GitHub Actions
- Pre-production: To be configured with isolated database

## Testing Schedule

1. ✅ Frontend unit tests for session utilities (Completed)
2. 🟡 Backend unit tests for session service (In Progress - Target: June 27, 2025)
3. 🟡 API integration tests (In Progress - Target: June 28, 2025)
4. 🔴 End-to-end tests (Not Started - Target: June 30, 2025)
5. 🔴 Performance and load testing (Not Started - Target: July 2, 2025)
6. 🔴 Final manual testing (Not Started - Target: July 3, 2025)

## Metrics and Reporting

- Current test coverage: ~60% (Frontend: 80%, Backend: 40%)
- Test coverage goal: 85% code coverage
- Daily test runs for existing tests
- Weekly progress report on test implementation
