# Established Code Patterns

This file contains all established code patterns that must be followed across the project.

## Backend Patterns

### Environment Activation Pattern
```bash
# MANDATORY: All backend operations must start with environment activation
conda activate maria-ai-agent

# Then proceed with Python operations
python wsgi.py
pytest backend/
pip install package-name
python setup_test_db.py
```

### Repository Pattern
```python
# All repositories must extend BaseRepository
class FeatureRepository(BaseRepository[FeatureModel]):
    def __init__(self):
        super().__init__(FeatureModel)
    
    def get_by_custom_field(self, field_value: str) -> Optional[FeatureModel]:
        # Custom repository methods
        pass
```

### Service Pattern
```python
# All services must use TransactionContext
class FeatureService:
    def __init__(self):
        self.repository = get_feature_repository()
    
    def create_feature(self, data: dict) -> dict:
        with TransactionContext():
            result = self.repository.create(data)
            return result
```

### API Response Pattern
```python
# All API responses must include nextTransition for FSM
@feature_bp.route('/endpoint', methods=['POST'])
@require_session
def endpoint():
    try:
        # Implementation
        return jsonify({
            'status': 'success',
            'data': result,
            'nextTransition': 'NEXT_STATE'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500
```

### Error Handling Pattern
```python
# Use structured error handling
from app.errors import ServerError, ValidationError

try:
    # Implementation
    pass
except ValidationError as e:
    logger.warning(f"Validation error: {str(e)}")
    return jsonify({'status': 'error', 'error': str(e)}), 400
except ServerError as e:
    logger.error(f"Server error: {str(e)}")
    return jsonify({'status': 'error', 'error': 'Internal server error'}), 500
```

## Frontend Patterns

### Hook Pattern
```typescript
// All feature hooks must follow this pattern
export const useFeature = (sessionId: string) => {
  const { resetSession } = useSession();
  const [state, setState] = useState<FeatureState>({
    // Initial state
  });

  const performAction = useCallback(async (data: any) => {
    try {
      // Implementation
    } catch (error: any) {
      if (error.response?.data?.reset_session) {
        resetSession(true);
      }
      // Handle error
    }
  }, [sessionId, resetSession]);

  return { state, performAction };
};
```

### Component Pattern
```typescript
// All components must follow this pattern
interface FeatureProps {
  // Props definition
}

export const Feature: React.FC<FeatureProps> = ({ prop1, prop2 }) => {
  // Implementation
  
  return (
    <div className="feature-container">
      {/* Component JSX */}
    </div>
  );
};
```

### API Integration Pattern
```typescript
// All API calls must follow this pattern
export const featureApi = {
  performAction: async (sessionId: string, data: any): Promise<any> => {
    try {
      const response = await apiClient.post('/api/v1/feature/action', {
        session_id: sessionId,
        ...data
      });
      return response.data;
    } catch (error) {
      // Handle and re-throw with consistent error format
      throw error;
    }
  }
};
```

## Database Patterns

### Model Pattern
```python
# All models must follow this pattern
class FeatureModel(Base):
    __tablename__ = 'features'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Audit fields
    ip_address = Column(String)
    user_agent = Column(String)
```

### Migration Pattern
```sql
-- All migrations must follow this pattern
CREATE TABLE features (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    session_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX idx_features_session_id ON features(session_id);
CREATE INDEX idx_features_created_at ON features(created_at);
```

### Email Verification Repository Pattern
```python
# Email verification repositories must follow this pattern
class EmailVerificationRepository(BaseRepository[EmailVerification]):
    def __init__(self):
        super().__init__(EmailVerification)
    
    def get_by_session_id(self, session_id: str) -> Optional[EmailVerification]:
        with get_db_session() as session:
            verification = session.query(EmailVerification).filter_by(
                session_id=session_id
            ).first()
            if verification:
                session.expunge(verification)
            return verification
    
    def cleanup_expired_records(self, hours: int = 24) -> int:
        with get_db_session() as session:
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            expired_records = session.query(EmailVerification).filter(
                EmailVerification.created_at < cutoff_time
            ).all()
            count = len(expired_records)
            for record in expired_records:
                session.delete(record)
            session.commit()
            return count
```

### Email Service Pattern
```python
# Email services must follow this pattern
class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))

## CI/CD Infrastructure Patterns

### SQLite Database Configuration Pattern
```python
# SQLite configuration must follow this pattern for thread safety
def create_engine(db_url: str, **engine_kwargs):
    if db_url.startswith("sqlite://"):
        engine_kwargs["connect_args"] = {
            "check_same_thread": False,
            "isolation_level": None,
        }
        if ":memory:" in db_url:
            engine_kwargs["poolclass"] = StaticPool
        else:
            engine_kwargs["poolclass"] = NullPool
        engine_kwargs.pop("pool_size", None)
        engine_kwargs.pop("max_overflow", None)
    return create_engine(db_url, **engine_kwargs)
```

### Test Client Isolation Pattern
```python
# Test clients must be isolated for concurrent testing
@pytest.fixture(scope="function")
def app():
    app = create_app()
    app.config["TESTING"] = True
    app.config["RATELIMIT_ENABLED"] = False
    return app

def teardown_method(self):
    # Reset rate limiter state after each test
    try:
        from app.routes.session import limiter
        if hasattr(limiter, "_storage"):
            limiter._storage.storage.clear()
    except Exception:
        pass
```

## Session Management Patterns

### UUID Validation Pattern
```python
# UUID validation must follow this pattern
def validate_uuid_format(uuid_str):
    if not uuid_str or not isinstance(uuid_str, str):
        return False
    uuid_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    return bool(uuid_pattern.match(uuid_str))
```

### React Context Pattern
```typescript
// Session context must follow this pattern
interface SessionContextType {
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  isResetRequired: boolean;
  resetSession: (showMessage?: boolean) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const sessionData = useSessionUUID();
  return (
    <SessionContext.Provider value={sessionData}>
      {children}
    </SessionContext.Provider>
  );
};
```

### Rate Limiting Pattern
```python
# Rate limiting must follow this pattern
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["10/minute"],
    storage_uri="memory://",
)

@session_bp.route("/validate-uuid", methods=["POST"])
@limiter.limit("10/minute")
def validate_uuid():
    # Implementation
    pass
```

### Test Database Initialization Pattern
```python
# All performance tests must follow this pattern
def setup_test_database():
    """Initialize test database with required tables"""
    with get_db_session() as session:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=session.bind)
        
def test_concurrent_performance():
    """Test pattern for concurrent database access"""
    setup_test_database()  # CRITICAL: Always initialize first
    # Test implementation
```

### Concurrent Testing Pattern
```python
# All concurrent tests must follow this pattern
def test_concurrent_requests():
    """Test pattern for concurrent API requests"""
    # Initialize test database
    setup_test_database()
    
    # Create isolated test clients
    with app.test_client() as client1, app.test_client() as client2:
        # Concurrent test implementation
        pass
```

### Performance Testing Pattern
```python
# All performance tests must follow this pattern
def test_api_throughput():
    """Test pattern for API throughput measurement"""
    setup_test_database()
    
    # Measure throughput with proper isolation
    start_time = time.time()
    # Test implementation
    end_time = time.time()
    
    throughput = requests_count / (end_time - start_time)
    assert throughput > minimum_required_throughput
```
        self.username = os.getenv('SMTP_USERNAME')
        self.password = os.getenv('SMTP_PASSWORD')
    
    def generate_verification_code(self) -> str:
        return ''.join(secrets.choice(string.digits) for _ in range(6))
    
    def hash_email(self, email: str) -> str:
        return bcrypt.hashpw(email.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')
    
    def send_verification_email(self, email: str, code: str) -> bool:
        # SMTP implementation with proper error handling
        pass
```

### Verification Service Pattern
```python
# Verification services must follow this pattern
class VerificationService:
    def __init__(self):
        self.email_service = EmailService()
        self.email_verification_repository = get_email_verification_repository()
    
    def send_verification_code(self, session_id: str, email: str) -> Dict[str, Any]:
        with TransactionContext():
            # Rate limiting check
            # Code generation and sending
            # Database storage
            pass
    
    def verify_code(self, session_id: str, code: str) -> Dict[str, Any]:
        with TransactionContext():
            # Code validation
            # Attempt tracking
            # Success/failure handling
            pass
```

## Configuration Patterns

### Environment File Pattern
```bash
# Backend configuration (.env)
PORT=5000
DATABASE_URL=sqlite:///maria_ai_dev.db
OPENAI_API_KEY=your_key_here

# Frontend configuration (.env)
PORT=3000
REACT_APP_API_BASE_URL=http://localhost:5000
```

### Configuration Loading Pattern
```python
# Backend configuration loading
import os
from dotenv import load_dotenv

load_dotenv()  # Loads from .env file in same directory

PORT = os.getenv('PORT', '5000')
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///maria_ai_dev.db')
```

### Port Configuration Pattern
```bash
# Development server commands
# Backend (ensure ports don't conflict)
cd backend && python wsgi.py --port 5000

# Frontend (React handles PORT automatically)
cd frontend && npm start  # Uses PORT=3000 from .env
```

## CI/CD Patterns

### GitHub Actions Workflow Pattern
```yaml
# .github/workflows/ci.yml
name: CI Pipeline
on:
  push:
    branches: ["main", "feature/*"]
  pull_request:
    branches: ["main"]

jobs:
  backend-ci:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.9"
          cache: "pip"
      - run: pip install -r requirements.txt
      - run: black --check .
      - run: flake8 .
      - run: pytest

  frontend-ci:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npx prettier --check "src/**/*.{ts,tsx}"
      - run: npm run lint
      - run: npm test -- --watchAll=false
      - run: npm run build
```

### Database Testing Pattern
```python
# backend/tests/conftest.py
import pytest
from app import create_app
from app.database import get_db

@pytest.fixture
def test_app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    return app

@pytest.fixture
def test_db(test_app):
    with test_app.app_context():
        db = get_db()
        # Setup test database
        yield db
        # Cleanup
```

### Quality Check Pattern
```bash
# Backend quality checks
black --check .          # Code formatting
flake8 .                 # Linting
pytest                   # Testing

# Frontend quality checks
npx prettier --check "src/**/*.{ts,tsx}"  # Code formatting
npm run lint             # Linting
npm test -- --watchAll=false  # Testing
npm run build            # Build validation
```

## Refactor-Specific Patterns

### Repository Pattern Implementation
```python
# Base repository with generic CRUD operations
class BaseRepository[T]:
    def __init__(self, model_class: Type[T]):
        self.model_class = model_class
    
    def create(self, data: dict) -> T:
        instance = self.model_class(**data)
        db.session.add(instance)
        db.session.commit()
        return instance
    
    def get_by_id(self, id: str) -> Optional[T]:
        return self.model_class.query.get(id)
```

### Flask Blueprint Organization
```python
# Blueprint registration pattern
def create_app():
    app = Flask(__name__)
    
    # Register blueprints with URL prefixes
    app.register_blueprint(session_bp, url_prefix='/api/v1/session')
    app.register_blueprint(upload_bp, url_prefix='/api/v1/upload')
    
    return app

# Blueprint definition pattern
session_bp = Blueprint('session', __name__)

@session_bp.route('/create', methods=['POST'])
def create_session():
    # Implementation
    pass
```

### React Context State Management
```typescript
// Context provider pattern
interface ChatContextType {
  messages: Message[];
  addMessage: (message: Message) => void;
  resetChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);
  
  const resetChat = useCallback(() => {
    setMessages([]);
  }, []);
  
  return (
    <ChatContext.Provider value={{ messages, addMessage, resetChat }}>
      {children}
    </ChatContext.Provider>
  );
};
```

### Service Layer Separation
```python
# Service pattern with business logic separation
class SessionService:
    def __init__(self):
        self.repository = get_user_session_repository()
    
    def create_session(self) -> dict:
        with TransactionContext():
            session_uuid = self._generate_uuid()
            session_data = {
                'id': session_uuid,
                'created_at': datetime.utcnow()
            }
            session = self.repository.create(session_data)
            return {'session_id': session.id}
    
    def _generate_uuid(self) -> str:
        # Business logic for UUID generation
        pass
```

### Transaction Context Manager
```python
# Transaction context for atomic operations
class TransactionContext:
    def __enter__(self):
        # Start transaction
        pass
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            # Rollback on exception
            db.session.rollback()
        else:
            # Commit on success
            db.session.commit()
```

### S3 File Upload Integration
```python
# S3 upload pattern with session validation
def upload_file_to_s3(file, session_uuid: str) -> str:
    try:
        bucket_name = current_app.config['S3_BUCKET']
        file_key = f"uploads/{session_uuid}/{file.filename}"
        
        s3_client.upload_fileobj(
            file,
            bucket_name,
            file_key,
            ExtraArgs={'ContentType': file.content_type}
        )
        return file_key
    except Exception as e:
        logger.error(f"S3 upload failed: {str(e)}")
        raise UploadError("File upload failed")
```

### Error Handling and Logging
```python
# Centralized error handling pattern
@upload_bp.errorhandler(Exception)
def handle_upload_error(error):
    logger.error(f"Upload error: {str(error)}")
    return jsonify({
        'status': 'error',
        'error': 'Upload failed'
    }), 500

# Correlation ID tracking
@app.before_request
def add_correlation_id():
    correlation_id = request.headers.get('X-Correlation-ID', str(uuid.uuid4()))
    g.correlation_id = correlation_id
    logger.info(f"Request started: {correlation_id}")
```

## File Upload Patterns

### S3 File Upload Pattern
```python
# File upload with validation and S3 integration
@upload_bp.route('/upload', methods=['POST'])
@require_session
def upload_file():
    try:
        if 'file' not in request.files:
            raise ValidationError("No file provided")
        
        file = request.files['file']
        if file.filename == '':
            raise ValidationError("No file selected")
        
        # Validate file type and size
        if not allowed_file(file.filename):
            raise ValidationError("Invalid file type")
        
        if file.content_length > MAX_FILE_SIZE:
            raise ValidationError("File too large")
        
        # Upload to S3
        file_key = upload_file_to_s3(file, g.session_id)
        
        return jsonify({
            'status': 'success',
            'file_key': file_key,
            'filename': file.filename
        })
    except ValidationError as e:
        return jsonify({'status': 'error', 'error': str(e)}), 400
```

### File Validation Pattern
```python
# File validation utilities
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file_size(file):
    file.seek(0, 2)  # Seek to end
    size = file.tell()
    file.seek(0)  # Reset to beginning
    return size <= MAX_FILE_SIZE
```

### Frontend File Upload Pattern
```typescript
// File upload hook with progress tracking
export const useFileUpload = (sessionId: string) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    files: [],
    uploading: false,
    progress: {}
  });

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setUploadState(prev => ({
        ...prev,
        uploading: true,
        progress: { ...prev.progress, [file.name]: 0 }
      }));
      
      const response = await apiClient.post('/api/v1/upload/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { session_id: sessionId },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadState(prev => ({
            ...prev,
            progress: { ...prev.progress, [file.name]: progress }
          }));
        }
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }, [sessionId]);

  return { uploadState, uploadFile };
};
```

### File Upload Component Pattern
```typescript
// File upload component with drag-and-drop
interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  allowedTypes?: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  maxFiles = 3,
  maxSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = ['.pdf']
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateFiles = (files: FileList): File[] => {
    const validFiles: File[] = [];
    const newErrors: string[] = [];

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        newErrors.push(`${file.name} is too large`);
        return;
      }
      
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(extension)) {
        newErrors.push(`${file.name} is not a supported file type`);
        return;
      }
      
      validFiles.push(file);
    });

    setErrors(newErrors);
    return validFiles;
  };

  return (
    <div className="file-upload-container">
      {/* Drag and drop implementation */}
    </div>
  );
};
```

### Progress Tracking Pattern
```typescript
// Progress tracking with status management
interface FileStatus {
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export const FileStatusList: React.FC<{ files: FileStatus[] }> = ({ files }) => {
  return (
    <div className="file-status-list">
      {files.map(file => (
        <div key={file.name} className={`file-status ${file.status}`}>
          <span className="filename">{file.name}</span>
          {file.status === 'uploading' && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${file.progress}%` }}
              />
            </div>
          )}
          {file.status === 'success' && <span className="status-icon">✅</span>}
          {file.status === 'error' && (
            <span className="error-message">{file.error}</span>
          )}
        </div>
      ))}
    </div>
  );
};
```

### Error Handling Pattern
```typescript
// File upload error handling
export const handleUploadError = (error: any, filename: string): string => {
  if (error.response?.status === 413) {
    return `${filename}: File too large (max 5MB)`;
  }
  if (error.response?.status === 400) {
    return `${filename}: ${error.response.data.error}`;
  }
  if (error.code === 'NETWORK_ERROR') {
    return `${filename}: Network error, please retry`;
  }
  return `${filename}: Upload failed, please retry`;
};
```

## Database Architecture Patterns

### SQLAlchemy Relationship Loading Pattern
```python
# Default to lazy loading, use eager loading for performance-critical paths
def get_user_with_sessions(user_id: str) -> User:
    # Lazy loading by default
    user = session.query(User).filter_by(id=user_id).first()
    
    # Eager loading for performance-critical paths
    user_with_sessions = session.query(User).options(
        joinedload(User.sessions)
    ).filter_by(id=user_id).first()
    return user_with_sessions
```

### Database Migration Pattern
```python
# Use Alembic for all database migrations
def run_migrations():
    """Run database migrations before tests"""
    from alembic import command
    from alembic.config import Config
    
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
```

### SQLite Testing Pattern
```python
# Use SQLite for all test environments
def create_test_database():
    """Create SQLite test database"""
    database_url = "sqlite:///:memory:"  # In-memory for CI
    engine = create_engine(database_url)
    Base.metadata.create_all(bind=engine)
    return engine
```

## API Architecture Patterns

### Retry Strategy Pattern
```python
# Linear backoff with configurable retries
def api_call_with_retry(endpoint: str, data: dict, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            response = requests.post(endpoint, json=data)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # Exponential backoff
```

### Correlation ID Pattern
```python
# Server-side correlation ID generation
@app.before_request
def add_correlation_id():
    correlation_id = request.headers.get('X-Correlation-ID', str(uuid.uuid4()))
    g.correlation_id = correlation_id
    logger.info(f"Request started: {correlation_id}")

@app.after_request
def add_correlation_header(response):
    response.headers['X-Correlation-ID'] = g.correlation_id
    return response
```

### Error Handling Pattern
```python
# Structured error responses with environment-based detail
def handle_api_error(error: Exception, environment: str = 'production'):
    if environment == 'development':
        return jsonify({
            'status': 'error',
            'error': str(error),
            'traceback': traceback.format_exc()
        }), 500
    else:
        return jsonify({
            'status': 'error',
            'error': 'Internal server error'
        }), 500
```

## Configuration Architecture Patterns

### Environment Variable Pattern
```python
# Standard environment variable names per technology stack
# Backend (.env)
PORT=5000
DATABASE_URL=sqlite:///maria_ai_dev.db
OPENAI_API_KEY=your_key_here

# Frontend (.env)
PORT=3000
REACT_APP_API_BASE_URL=http://localhost:5000
```

### Port Configuration Pattern
```python
# Environment variables only, never hardcoded
def get_server_config():
    return {
        'port': int(os.getenv('PORT', '5000')),
        'host': os.getenv('HOST', '0.0.0.0'),
        'debug': os.getenv('FLASK_ENV') == 'development'
    }
```

### Service Separation Pattern
```python
# Separate configuration files for each service
# backend/.env
PORT=5000
DATABASE_URL=sqlite:///maria_ai_dev.db

# frontend/.env  
PORT=3000
REACT_APP_API_BASE_URL=http://localhost:5000
```

## Frontend Architecture Patterns

### FSM State Transition Pattern
```typescript
// Use nextTransition property in API responses
interface ApiResponse {
  status: 'success' | 'error';
  data?: any;
  nextTransition?: string;  // FSM state transition
}

const handleApiResponse = (response: ApiResponse) => {
  if (response.nextTransition) {
    fsm.transition(response.nextTransition);
  }
};
```

### Frontend/Backend Integration Pattern
```typescript
// Configuration-based API endpoints
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.REACT_APP_API_KEY
  }
});
```

### Email Verification Production Pattern (July 2025)
- Gmail SMTP configuration in backend/.env
- Database migration executed and verified
- All API endpoints return nextTransition for FSM
- Error handling and security patterns followed

---
*All new code must follow these established patterns*