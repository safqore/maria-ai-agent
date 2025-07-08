# Established Code Patterns

This file contains all established code patterns that must be followed across the project.

## Backend Patterns

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

---
*All new code must follow these established patterns* 