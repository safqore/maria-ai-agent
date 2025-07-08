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

### [Feature A]
- **Depends On**: [List of features/systems this depends on]
- **Used By**: [List of features that depend on this one]
- **Shared Components**: [List of shared components]
- **Database Tables**: [List of database tables]
- **API Endpoints**: [List of API endpoints]

### [Feature B]
- **Depends On**: [List of features/systems this depends on]
- **Used By**: [List of features that depend on this one]
- **Shared Components**: [List of shared components]
- **Database Tables**: [List of database tables]
- **API Endpoints**: [List of API endpoints]

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