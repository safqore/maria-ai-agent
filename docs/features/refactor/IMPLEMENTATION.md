# Refactor Implementation Details

## Key Implementation Files

### Backend Core
- **Repository Pattern**: `backend/app/repositories/base_repository.py` - Generic CRUD operations
- **Session Repository**: `backend/app/repositories/user_session_repository.py` - Session-specific operations
- **Service Layer**: `backend/app/services/session_service.py`, `backend/app/services/upload_service.py`
- **Flask Blueprints**: `backend/app/routes/session.py`, `backend/app/routes/upload.py`
- **Models**: `backend/app/models.py` - SQLAlchemy model definitions
- **App Factory**: `backend/app/app_factory.py` - Blueprint registration and app creation

### Frontend Core
- **Context Providers**: `frontend/src/contexts/ChatContext.tsx`, `SessionContext.tsx`, `FileUploadContext.tsx`
- **API Integration**: `frontend/src/api/sessionApi.ts`, `frontend/src/api/fileApi.ts`
- **Components**: `frontend/src/components/chat/`, `frontend/src/components/fileUpload/`

## Database Architecture

### SQLAlchemy ORM Implementation
```python
# Base repository with generic CRUD
class BaseRepository[T]:
    def create(self, data: dict) -> T
    def get_by_id(self, id: str) -> Optional[T]
    def update(self, id: str, data: dict) -> T
    def delete(self, id: str) -> bool
```

### Transaction Management
```python
# Context manager for atomic operations
with TransactionContext():
    session = repository.create(session_data)
    # Automatic rollback on exception
```

## API Architecture

### Flask Blueprint Structure
- **Session Blueprint**: `/api/v1/session/*` - Session management endpoints
- **Upload Blueprint**: `/api/v1/upload/*` - File upload endpoints
- **Authentication**: API key middleware with `X-API-Key` header
- **Error Handling**: Centralized error responses with proper HTTP status codes

### React Context Structure
- **ChatContext**: Manages conversation state and message history
- **SessionContext**: Handles session creation, reset, and management
- **FileUploadContext**: Manages file upload state and progress

## Environment Setup

### Backend Requirements
```bash
# Critical: Activate conda environment
conda activate maria-ai-agent

# Database setup
python init_database.py
python run_migrations.py

# Run tests
make test
```

### Frontend Requirements
```bash
cd frontend
npm install
npm start  # Runs on PORT=3000
```

## File Upload System

### S3 Integration
- **Session-scoped organization**: `uploads/{session_uuid}/`
- **File validation**: PDF only, 5MB maximum size
- **Error handling**: Graceful failure with user feedback
- **Test environment**: Works without S3 credentials

### Upload Flow
1. File validation (type, size)
2. Session validation
3. S3 upload with session-scoped path
4. Database record creation
5. Response with file key

## Testing Infrastructure

### Backend Testing
- **Framework**: pytest with test database setup
- **Mock Strategy**: Repository and service layer mocks
- **Authentication**: Disabled for test environment
- **S3 Integration**: Mocked for test scenarios

### Frontend Testing
- **Framework**: Jest with React Testing Library
- **API Mocking**: Mock service worker for API calls
- **Component Testing**: Isolated component tests with context providers

## Key Architectural Patterns

### Repository Pattern
- Abstract data access layer
- Generic CRUD operations
- Type-safe repository implementations
- Transaction context integration

### Service Layer
- Business logic separation
- Transaction management
- Error handling and validation
- Repository integration

### React Context
- State management without prop drilling
- Component isolation
- Testable context providers
- Type-safe context interfaces 