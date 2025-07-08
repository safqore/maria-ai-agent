# Feature Integration Map

This file tracks how features integrate with each other to prevent conflicts and ensure proper coordination.

## Core System Components

### Session Management
- **Owner**: Core System
- **Used By**: All features
- **Interface**: `SessionContext`, `UserSession` model, `/api/v1/session/*` endpoints
- **Dependencies**: None
- **Breaking Changes**: Requires coordination with all features

### File Upload
- **Owner**: Core System
- **Used By**: Features that need file handling
- **Interface**: `FileUploadContext`, S3 utils, `/api/v1/upload/*` endpoints
- **Dependencies**: Session Management
- **Breaking Changes**: Affects any feature using file uploads

### Database Core
- **Owner**: Core System
- **Used By**: All features
- **Interface**: `BaseRepository`, `TransactionContext`, SQLAlchemy ORM
- **Dependencies**: None
- **Breaking Changes**: Requires coordination with all features

### Authentication System
- **Owner**: Core System
- **Used By**: All API endpoints
- **Interface**: API key middleware, `X-API-Key` header validation
- **Dependencies**: None
- **Breaking Changes**: Affects all API access

### Email Verification System
- **Owner**: Email Verification Feature
- **Used By**: User onboarding flow, AI agent readiness notifications
- **Interface**: `EmailVerificationRepository`, `EmailService`, `/api/v1/email-verification/*` endpoints
- **Dependencies**: Session Management, Database Core, Authentication System
- **Breaking Changes**: Affects user onboarding flow

## Feature Dependencies

### Email Verification
- **Depends On**: Session Management, Database Core, Authentication System
- **Used By**: User onboarding flow, AI agent readiness notifications
- **Shared Components**: `SessionContext`, `TransactionContext`, `BaseRepository`
- **Database Tables**: `email_verifications` (new table)
- **API Endpoints**: `/api/v1/email-verification/verify-email`, `/api/v1/email-verification/verify-code`, `/api/v1/email-verification/resend-code`

### Refactor Project
- **Depends On**: Database Core, Authentication System
- **Used By**: All future features (foundation)
- **Shared Components**: `BaseRepository`, `TransactionContext`, SQLAlchemy ORM
- **Database Tables**: All existing tables (user_sessions, etc.)
- **API Endpoints**: All existing endpoints with improved architecture
- **Status**: 60% complete, 163/168 tests passing, another dev working

### CI/CD Pipeline
- **Depends On**: All features (infrastructure)
- **Used By**: All features (deployment and testing)
- **Shared Components**: GitHub Actions, pytest, jest, Docker
- **Database Tables**: Test databases (SQLite in CI, PostgreSQL in production)
- **API Endpoints**: All endpoints (testing and deployment)
- **Status**: ✅ CI complete (100% test success rate), CD planning phase

### AI Agent Creation Process
- **Depends On**: Email Verification, File Upload, Session Management
- **Used By**: End user workflow
- **Shared Components**: `SessionContext`, `FileUploadContext`, `EmailVerificationRepository`
- **Database Tables**: user_sessions, email_verifications, uploaded files
- **API Endpoints**: TBD (AI agent creation endpoints)
- **Status**: 60% complete, backend logic needed

### Session Management (✅ Complete)
- **Depends On**: Database Core, Authentication System
- **Used By**: All features requiring session state
- **Shared Components**: `SessionContext`, `UserSessionRepository`, UUID validation
- **Database Tables**: user_sessions, audit_logs
- **API Endpoints**: `/api/v1/session/validate-uuid`, `/api/v1/session/generate-uuid`
- **Status**: ✅ Complete (24/24 backend tests, 18/18 frontend tests)

## Shared Services

### Authentication Service
- **Used By**: [List of features using this]
- **Interface**: [Description of interface]
- **Breaking Changes**: [Who to coordinate with]

### Logging Service
- **Used By**: [List of features using this]
- **Interface**: [Description of interface]
- **Breaking Changes**: [Who to coordinate with]

### Notification Service
- **Used By**: [List of features using this]
- **Interface**: [Description of interface]
- **Breaking Changes**: [Who to coordinate with]

## Database Schema Dependencies

### Shared Tables
- **user_sessions**: Used by [list of features]
- **[shared_table]**: Used by [list of features]

### Foreign Key Relationships
- **Feature A** → **Feature B**: [relationship description]
- **Feature B** → **Core System**: [relationship description]

## API Endpoint Conflicts

### Endpoint Namespaces
- `/api/v1/session/*`: Session Management (create, reset, status)
- `/api/v1/upload/*`: File Upload (upload, status, list)
- `/api/v1/email-verification/*`: Email Verification (verify-email, verify-code, resend-code)
- `/api/v1/[feature]/*`: [Feature Name]

### API Integration Points
- **Session Creation**: POST `/api/v1/session/create` → Returns session_id
- **File Upload**: POST `/api/v1/upload/upload` → Requires session_id, returns file_key
- **Session Reset**: POST `/api/v1/session/reset` → Requires session_id
- **Email Verification**: POST `/api/v1/email-verification/verify-email` → Requires session_id, returns nextTransition
- **Code Verification**: POST `/api/v1/email-verification/verify-code` → Requires session_id, returns nextTransition
- **Code Resend**: POST `/api/v1/email-verification/resend-code` → Requires session_id, returns nextTransition
- **Authentication**: All endpoints require `X-API-Key` header (configurable for tests)

## CI/CD Integration Points

### Backend Testing Integration
- **Owner**: CI/CD System
- **Used By**: All backend features
- **Interface**: pytest with SQLite fixtures, black/flake8 quality checks
- **Dependencies**: Database migrations, environment configuration
- **Breaking Changes**: Affects all backend feature testing

### Frontend Testing Integration
- **Owner**: CI/CD System
- **Used By**: All frontend features
- **Interface**: jest with React Testing Library, prettier/eslint quality checks
- **Dependencies**: Node.js environment, build configuration
- **Breaking Changes**: Affects all frontend feature testing

### Database Migration Integration
- **Owner**: CI/CD System
- **Used By**: All database-dependent features
- **Interface**: SQLite in-memory for CI, PostgreSQL for production
- **Dependencies**: Migration files, database schema
- **Breaking Changes**: Affects all database operations

### Environment Configuration Integration
- **Owner**: CI/CD System
- **Used By**: All features requiring environment variables
- **Interface**: GitHub Actions environment setup, test configuration
- **Dependencies**: Environment files, configuration patterns
- **Breaking Changes**: Affects all feature deployment

### Database/Testing Integration
- **Owner**: CI/CD System
- **Used By**: All database-dependent features
- **Interface**: SQLite for testing, PostgreSQL for production, Alembic migrations
- **Dependencies**: Database migrations, environment configuration
- **Breaking Changes**: Affects all database operations

### API Architecture Integration
- **Owner**: Core System
- **Used By**: All API endpoints
- **Interface**: Retry strategy, correlation IDs, structured error responses
- **Dependencies**: Authentication system, error handling system
- **Breaking Changes**: Affects all API endpoints

### Configuration Integration
- **Owner**: Core System
- **Used By**: All features requiring configuration
- **Interface**: Environment variables with service-specific patterns
- **Dependencies**: Environment variable system
- **Breaking Changes**: Affects all features requiring configuration

### Shared Parameters
- `session_id`: Required by all endpoints
- `correlation_id`: Used for tracking
- `[shared_param]`: [Description]

## Coordination Requirements

### Before Implementation
- Check this integration map
- Identify all affected features
- Coordinate with feature owners
- Update integration map

### During Implementation
- Test integration points
- Validate shared components
- Check for breaking changes
- Update documentation

### After Implementation
- Update integration map
- Notify affected feature owners
- Document any new patterns
- Update architecture registry

---
*This file must be updated whenever features are added or modified* 