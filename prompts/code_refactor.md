# Maria AI Agent Code Refactoring Plan

This document outlines a comprehensive refactoring plan for the Maria AI Agent project. The goal is to improve code organization, maintainability, and adherence to best practices without changing functional behavior. These changes will make the codebase more extendable and easier to understand for future development.

## Table of Contents
1. Frontend Refactoring
2. Backend Refactoring
3. General Recommendations
4. Implementation Strategy

## Frontend Refactoring

### 1. Folder Structure Reorganization

**Current Issue:** The current flat component structure makes it difficult to scale and maintain the application.

**Recommendation:** Reorganize to a feature-based folder structure.

**Implementation:**
```
src/
  ├── features/               # Feature-based organization
  │   ├── chat/
  │   │   ├── components/     # Chat-specific components
  │   │   ├── hooks/          # Chat-specific hooks
  │   │   └── utils/          # Chat-specific utilities
  │   ├── fileUpload/
  │   └── session/
  ├── shared/                 # Shared/common components
  │   ├── components/
  │   ├── hooks/
  │   └── utils/
  ├── api/                    # Centralized API services
  ├── types/                  # Shared TypeScript interfaces
  └── store/                  # State management
```

**Steps:**
1. Create the new directory structure
2. Move existing components to appropriate folders
3. Update import paths throughout the codebase
4. Ensure tests still work with the new structure

### 2. State Management Improvements

**Current Issue:** The custom finite state machine implementation is complex and difficult to maintain.

**Recommendation:** Replace with a more maintainable solution using React Context with useReducer.

**Implementation:**

```tsx
// src/store/chat/ChatContext.tsx
import { createContext, useContext, useReducer } from 'react';
import { Message, States } from '../../types';
import { initialBotMessage } from '../../utils/constants';

type ChatState = {
  messages: Message[];
  currentState: States;
  isInputDisabled: boolean;
};

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'TRANSITION_STATE'; payload: States }
  | { type: 'SET_INPUT_DISABLED'; payload: boolean };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'TRANSITION_STATE':
      return { ...state, currentState: action.payload };
    case 'SET_INPUT_DISABLED':
      return { ...state, isInputDisabled: action.payload };
    default:
      return state;
  }
};

const initialState: ChatState = {
  messages: [initialBotMessage],
  currentState: States.WELCOME_MSG,
  isInputDisabled: true
};

const ChatContext = createContext<{
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
} | undefined>(undefined);

export const ChatProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
```

**Steps:**
1. Create the ChatContext and provider
2. Replace the existing state management in components with useChat hook
3. Update transition logic to use the dispatch function
4. Ensure state transitions work exactly as before

### 3. API Service Layer

**Current Issue:** API calls are scattered throughout the codebase, making them difficult to maintain.

**Recommendation:** Create a dedicated API service layer.

**Implementation:**

```tsx
// src/api/config.ts
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// src/api/sessionApi.ts
import { API_BASE_URL } from './config';
import { UUIDResponse } from '../types/session';

export const SessionApi = {
  generateUUID: async (): Promise<UUIDResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-uuid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error generating UUID:', error);
      throw error;
    }
  },

  validateUUID: async (uuid: string): Promise<UUIDResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/validate-uuid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error validating UUID:', error);
      throw error;
    }
  },
};

// src/api/chatApi.ts
import { API_BASE_URL } from './config';
import { Message } from '../types';

export const ChatApi = {
  sendMessage: async (message: string, sessionUUID: string): Promise<Message> => {
    try {
      const response = await fetch(`${API_BASE_URL}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, session_uuid: sessionUUID }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
};

// src/api/fileApi.ts
import { API_BASE_URL } from './config';

export const FileApi = {
  uploadFile: async (file: File, sessionUUID: string): Promise<{ status: string; message: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('session_uuid', sessionUUID);

      const response = await fetch(`${API_BASE_URL}/upload-file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },
};
```

**Steps:**
1. Create the API directory with configuration
2. Implement separate API modules for different features
3. Replace direct fetch calls with API service methods
4. Update error handling and response processing

### 4. Custom Hook Refactoring

**Current Issue:** The useSessionUUID hook lacks proper error handling and caching strategies.

**Recommendation:** Refactor for better error handling, caching, and typing.

**Implementation:**

```tsx
// src/shared/hooks/useSessionUUID.ts
import { useEffect, useState, useCallback } from 'react';
import { SessionApi } from '../../api/sessionApi';

interface UseSessionUUIDResult {
  sessionUUID: string;
  loading: boolean;
  error: string | null;
  resetSession: () => Promise<void>;
}

export function useSessionUUID(): UseSessionUUIDResult {
  const [sessionUUID, setSessionUUID] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getOrCreateSessionUUID = useCallback(async () => {
    setLoading(true);
    try {
      const storedUUID = localStorage.getItem('session_uuid');

      if (!storedUUID || !isValidUUID(storedUUID)) {
        // No stored UUID or invalid format - generate a new one
        const response = await SessionApi.generateUUID();

        if (response.status === 'success' && response.uuid) {
          localStorage.setItem('session_uuid', response.uuid);
          setSessionUUID(response.uuid);
        } else {
          throw new Error(response.message || 'Failed to generate session UUID');
        }
      } else {
        // Validate existing UUID
        const validationResponse = await SessionApi.validateUUID(storedUUID);

        if (validationResponse.status === 'success') {
          setSessionUUID(storedUUID);
        } else if (validationResponse.status === 'collision' && validationResponse.uuid) {
          localStorage.setItem('session_uuid', validationResponse.uuid);
          setSessionUUID(validationResponse.uuid);
        } else {
          await resetSession();
        }
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session error');
    } finally {
      setLoading(false);
    }
  }, []);

  const resetSession = async () => {
    try {
      localStorage.removeItem('session_uuid');
      const response = await SessionApi.generateUUID();

      if (response.status === 'success' && response.uuid) {
        localStorage.setItem('session_uuid', response.uuid);
        setSessionUUID(response.uuid);
        window.location.reload();
      } else {
        throw new Error(response.message || 'Failed to reset session UUID');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session reset error');
    }
  };

  function isValidUUID(uuid: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
  }

  useEffect(() => {
    getOrCreateSessionUUID();
  }, [getOrCreateSessionUUID]);

  return { sessionUUID, loading, error, resetSession };
}
```

**Steps:**
1. Create the improved hook implementation
2. Add proper TypeScript interfaces
3. Implement better error handling with specific error messages
4. Update components that use this hook

### 5. Component Splitting

**Current Issue:** Several components are too large and handle multiple responsibilities.

**Recommendation:** Break down larger components into smaller, focused components.

**Implementation Example (FileUpload):**

```tsx
// src/features/fileUpload/components/FileUploadButton.tsx
import React, { useRef } from 'react';

interface FileUploadButtonProps {
  onSelectFiles: (files: FileList | null) => void;
  disabled?: boolean;
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onSelectFiles,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <button
        className="chat-button"
        onClick={handleClick}
        aria-label="Upload Files"
        disabled={disabled}
      >
        Upload Files
      </button>
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => onSelectFiles(e.target.files)}
        multiple
        data-testid="file-input"
        aria-label="Upload Files"
      />
    </>
  );
};

// src/features/fileUpload/components/FileStatusList.tsx
import React from 'react';

interface FileStatus {
  id: string;
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

interface FileStatusListProps {
  files: FileStatus[];
}

export const FileStatusList: React.FC<FileStatusListProps> = ({ files }) => {
  if (files.length === 0) return null;

  return (
    <div className="file-status-list">
      <h3>Uploads</h3>
      <ul>
        {files.map((file) => (
          <li key={file.id} className={`file-status file-status-${file.status}`}>
            <span className="file-name">{file.name}</span>
            {file.status === 'uploading' && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${file.progress || 0}%` }}
                ></div>
              </div>
            )}
            {file.status === 'error' && <span className="error-message">{file.error}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

// src/features/fileUpload/components/FileUpload.tsx
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FileUploadButton } from './FileUploadButton';
import { FileStatusList } from './FileStatusList';
import { FileApi } from '../../../api/fileApi';

interface FileUploadProps {
  sessionUUID: string;
  disabled?: boolean;
  onUploadComplete?: (fileCount: number) => void;
}

interface FileStatus {
  id: string;
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  sessionUUID,
  disabled = false,
  onUploadComplete
}) => {
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);

  const handleSelectFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Create initial file statuses
    const newFileStatuses = Array.from(files).map(file => ({
      id: uuidv4(),
      name: file.name,
      status: 'pending' as const
    }));

    setFileStatuses(prev => [...prev, ...newFileStatuses]);

    let successCount = 0;

    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = newFileStatuses[i].id;

      // Set status to uploading
      setFileStatuses(prev =>
        prev.map(fs => fs.id === fileId ? { ...fs, status: 'uploading', progress: 0 } : fs)
      );

      try {
        // Upload file
        await FileApi.uploadFile(file, sessionUUID);

        // Set status to success
        setFileStatuses(prev =>
          prev.map(fs => fs.id === fileId ? { ...fs, status: 'success', progress: 100 } : fs)
        );

        successCount++;
      } catch (error) {
        // Set status to error
        setFileStatuses(prev =>
          prev.map(fs =>
            fs.id === fileId
              ? {
                  ...fs,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              : fs
          )
        );
      }
    }

    if (onUploadComplete) {
      onUploadComplete(successCount);
    }
  };

  return (
    <div className="file-upload-container">
      <FileUploadButton
        onSelectFiles={handleSelectFiles}
        disabled={disabled}
      />
      <FileStatusList files={fileStatuses} />
    </div>
  );
};
```

**Steps:**
1. Identify components that are too large or have multiple responsibilities
2. Break them down into smaller components with focused responsibilities
3. Create proper interfaces for component props
4. Update imports and usage of these components

### 6. Consistent Error Handling

**Current Issue:** Error handling is inconsistent across the application.

**Recommendation:** Create a consistent error handling pattern with an ErrorBoundary.

**Implementation:**

```tsx
// src/shared/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    // Here you could send to error reporting service
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>The application encountered an error. Please try again later.</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// src/shared/hooks/useApiRequest.ts
import { useState, useCallback } from 'react';

interface UseApiRequestState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useApiRequest<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>
) {
  const [state, setState] = useState<UseApiRequestState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: P) => {
      setState({ data: null, loading: true, error: null });
      try {
        const data = await apiFunction(...args);
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setState({ data: null, loading: false, error: errorObj });
        throw errorObj;
      }
    },
    [apiFunction]
  );

  return { ...state, execute };
}
```

**Steps:**
1. Implement the ErrorBoundary component
2. Create a useApiRequest hook for handling API calls
3. Wrap key components with ErrorBoundary in the component tree
4. Update API calls to use the useApiRequest hook

## Backend Refactoring

### 1. Implement Service Layer

**Current Issue:** Business logic is mixed with route handlers, making it difficult to test and maintain.

**Recommendation:** Separate business logic from routes with a service layer.

**Implementation:**

```python
import uuid
from typing import Dict, Tuple, Optional
from app.db import get_db_connection
from app.utils.s3_utils import migrate_s3_files
from app.utils.audit_utils import log_audit_event

class SessionService:
    @staticmethod
    def validate_uuid(session_uuid: str) -> Tuple[Dict, int]:
        """Validate a UUID for format and uniqueness.

        Args:
            session_uuid: The UUID string to validate

        Returns:
            Tuple containing response dict and HTTP status code
        """
        if not SessionService._is_valid_uuid(session_uuid):
            log_audit_event('uuid_validation_failed', user_uuid=session_uuid, details={'reason': 'invalid format'})
            return {
                'status': 'invalid',
                'uuid': None,
                'message': 'Invalid or missing UUID',
                'details': {'reason': 'invalid format'}
            }, 400

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM user_sessions WHERE uuid = %s', (session_uuid,))
        count = cur.fetchone()[0]
        cur.close()
        conn.close()

        if count > 0:
            log_audit_event('uuid_validation_collision', user_uuid=session_uuid,
                           details={'reason': 'UUID already exists'})
            return {
                'status': 'collision',
                'uuid': session_uuid,
                'message': 'UUID already exists',
                'details': {'reason': 'UUID already exists'}
            }, 409

        log_audit_event('uuid_validation_success', user_uuid=session_uuid)
        return {
            'status': 'success',
            'uuid': session_uuid,
            'message': 'UUID is valid and unique',
            'details': {}
        }, 200

    @staticmethod
    def generate_uuid() -> Tuple[Dict, int]:
        """Generate a unique UUID, ensuring it doesn't exist in the database.

        Returns:
            Tuple containing response dict and HTTP status code
        """
        attempts = 0
        max_attempts = 3
        new_uuid = None

        while attempts < max_attempts:
            candidate = str(uuid.uuid4())
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute('SELECT COUNT(*) FROM user_sessions WHERE uuid = %s', (candidate,))
            count = cur.fetchone()[0]
            cur.close()
            conn.close()

            if count == 0:
                new_uuid = candidate
                break
            attempts += 1

        if new_uuid:
            log_audit_event('uuid_generation_success', user_uuid=new_uuid)
            return {
                'status': 'success',
                'uuid': new_uuid,
                'message': 'Generated unique UUID',
                'details': {}
            }, 200
        else:
            log_audit_event('uuid_generation_failed',
                           details={'reason': 'Could not generate unique UUID after 3 attempts'})
            return {
                'status': 'error',
                'uuid': None,
                'message': 'Could not generate unique UUID',
                'details': {'reason': 'Could not generate unique UUID after 3 attempts'}
            }, 500

    @staticmethod
    def persist_session(session_uuid: str, name: str, email: str) -> Tuple[Dict, int]:
        """Persist user session data, handling UUID collisions.

        Args:
            session_uuid: The UUID to associate with the session
            name: User's name
            email: User's email

        Returns:
            Tuple containing response dict and HTTP status code
        """
        if not SessionService._is_valid_uuid(session_uuid):
            return {'error': 'Invalid or missing session UUID', 'code': 'invalid_session'}, 400

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM user_sessions WHERE uuid = %s', (session_uuid,))
        count = cur.fetchone()[0]

        if count > 0:
            new_uuid = str(uuid.uuid4())
            migrate_s3_files(session_uuid, new_uuid)
            cur.close()
            conn.close()
            return {'new_uuid': new_uuid, 'message': 'UUID collision, new UUID assigned'}, 200

        cur.execute('INSERT INTO user_sessions (uuid, name, email) VALUES (%s, %s, %s)',
                   (session_uuid, name, email))
        conn.commit()
        cur.close()
        conn.close()

        return {'message': 'Session persisted', 'session_uuid': session_uuid}, 200

    @staticmethod
    def _is_valid_uuid(val: str) -> bool:
        """Check if a string is a valid UUID.

        Args:
            val: The string to check

        Returns:
            True if the string is a valid UUID, False otherwise
        """
        try:
            uuid.UUID(str(val))
            return True
        except ValueError:
            return False
```

**Steps:**
1. Create a services directory in the backend
2. Move business logic from routes to service classes
3. Update route handlers to use the service classes
4. Add comprehensive docstrings and type hints

### 2. Use SQLAlchemy ORM

**Current Issue:** Direct database connections are used throughout the codebase, leading to potential SQL injection and making it difficult to test.

**Recommendation:** Replace direct database connections with SQLAlchemy ORM.

**Implementation:**

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://user:pass@localhost:5432/maria_ai')

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Get database session.

    Yields:
        SQLAlchemy session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# filepath: backend/app/models/user_session.py
from datetime import datetime
import uuid as uuid_lib
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.db import Base

class UserSession(Base):
    __tablename__ = 'user_sessions'

    uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    ip_address = Column(String, nullable=True)
    consent_user_data = Column(Boolean, default=False)

    @classmethod
    def check_uuid_exists(cls, session, uuid):
        """Check if a UUID already exists in the database.

        Args:
            session: SQLAlchemy session
            uuid: UUID to check

        Returns:
            True if UUID exists, False otherwise
        """
        return session.query(cls).filter(cls.uuid == uuid).count() > 0

    @classmethod
    def create(cls, session, uuid, name, email, ip_address=None, consent=False):
        """Create a new user session.

        Args:
            session: SQLAlchemy session
            uuid: Session UUID
            name: User's name
            email: User's email
            ip_address: User's IP address (optional)
            consent: Whether user consented to data usage (optional)

        Returns:
            Created UserSession instance
        """
        user_session = cls(
            uuid=uuid,
            name=name,
            email=email,
            ip_address=ip_address,
            consent_user_data=consent
        )
        session.add(user_session)
        session.commit()
        return user_session
```

**Steps:**
1. Set up SQLAlchemy configuration
2. Create model classes for database tables
3. Update services to use SQLAlchemy models instead of direct SQL
4. Implement database migration script to handle schema changes

### 3. Centralized Error Handling

**Current Issue:** Error handling is inconsistent and scattered throughout the codebase.

**Recommendation:** Create a centralized error handler for consistent responses.

**Implementation:**

```python
from flask import jsonify
import traceback
from functools import wraps

class APIError(Exception):
    """Base exception for API errors with status code and payload."""

    def __init__(self, message, status_code=400, payload=None, code=None):
        self.message = message
        self.status_code = status_code
        self.payload = payload
        self.code = code
        super().__init__(self.message)

class InvalidSessionError(APIError):
    """Exception for invalid session UUID."""

    def __init__(self, message="Invalid or missing session UUID"):
        super().__init__(message, status_code=400, code='invalid_session')

def handle_api_errors(app):
    """Register error handlers for the Flask app.

    Args:
        app: Flask application instance
    """

    @app.errorhandler(APIError)
    def handle_api_error(error):
        response = {
            'error': error.message,
        }
        if error.code:
            response['code'] = error.code
        if error.payload:
            response['details'] = error.payload
        return jsonify(response), error.status_code

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        # Log the full error with stack trace
        traceback.print_exc()
        return jsonify({
            'error': 'An unexpected error occurred',
            'message': str(error)
        }), 500

def api_route(func):
    """Decorator for API routes that catches and converts exceptions to proper responses.

    Args:
        func: Route handler function

    Returns:
        Wrapped function that handles exceptions
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except APIError as e:
            return jsonify({
                'error': e.message,
                'code': e.code,
                **(e.payload or {})
            }), e.status_code
        except Exception as e:
            # Log unexpected errors
            traceback.print_exc()
            return jsonify({
                'error': 'An unexpected error occurred',
                'message': str(e)
            }), 500
    return wrapper
```

**Steps:**
1. Create the error handler utility
2. Define custom exception classes
3. Register error handlers with Flask app
4. Update routes to use the api_route decorator
5. Replace manual error handling with appropriate exceptions

### 4. Request Validation with Marshmallow

**Current Issue:** Input validation is inconsistent or missing in many routes.

**Recommendation:** Add request data validation with Marshmallow.

**Implementation:**

```python
from marshmallow import Schema, fields, validate, ValidationError

class UUIDSchema(Schema):
    """Schema for validating UUID requests."""
    uuid = fields.String(required=True, validate=validate.Length(equal=36))

class SessionPersistSchema(Schema):
    """Schema for validating session persistence requests."""
    session_uuid = fields.String(required=True, validate=validate.Length(equal=36))
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    email = fields.Email(required=True)
    consent_user_data = fields.Boolean(missing=False)

# filepath: backend/app/routes/session_routes.py
from flask import Blueprint, request, jsonify
from app.schemas.session_schemas import UUIDSchema, SessionPersistSchema
from app.services.session_service import SessionService
from app.utils.error_handler import api_route
from marshmallow import ValidationError

session_bp = Blueprint('session', __name__)

@session_bp.route('/validate-uuid', methods=['POST'])
@api_route
def validate_uuid():
    """Validate a UUID for format and uniqueness."""
    try:
        schema = UUIDSchema()
        data = schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({'status': 'invalid', 'uuid': None, 'message': str(err.messages)}), 400

    result, status_code = SessionService.validate_uuid(data['uuid'])
    return jsonify(result), status_code

@session_bp.route('/generate-uuid', methods=['POST'])
@api_route
def generate_uuid():
    """Generate a unique UUID."""
    result, status_code = SessionService.generate_uuid()
    return jsonify(result), status_code

@session_bp.route('/persist-session', methods=['POST'])
@api_route
def persist_session():
    """Persist user session data."""
    try:
        schema = SessionPersistSchema()
        data = schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({'error': str(err.messages), 'code': 'validation_error'}), 400

    result, status_code = SessionService.persist_session(
        data['session_uuid'], data['name'], data['email']
    )
    return jsonify(result), status_code
```

**Steps:**
1. Install marshmallow (add to requirements.txt)
2. Create schema definitions for request validation
3. Update route handlers to use schemas for validation
4. Return appropriate error responses for validation failures

### 5. Improved Route Organization with Class-Based Views

**Current Issue:** Route handlers are scattered and difficult to organize.

**Recommendation:** Use class-based views for better organization.

**Implementation:**

```python
from flask import Blueprint, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask.views import MethodView
from app.services.session_service import SessionService
from app.schemas.session_schemas import UUIDSchema, SessionPersistSchema
from app.utils.error_handler import api_route, InvalidSessionError
from marshmallow import ValidationError
import os

session_bp = Blueprint('session', __name__)

# Get rate limit from environment variable or default to 10/minute
SESSION_RATE_LIMIT = os.getenv('SESSION_RATE_LIMIT', '10/minute')

# Limiter will be initialized in app factory and attached to app
limiter = Limiter(key_func=get_remote_address, default_limits=[SESSION_RATE_LIMIT])

class UUIDValidationAPI(MethodView):
    decorators = [limiter.limit(SESSION_RATE_LIMIT), api_route]

    def post(self):
        """Validate a UUID for format and uniqueness."""
        try:
            schema = UUIDSchema()
            data = schema.load(request.get_json())
        except ValidationError as err:
            return jsonify({'status': 'invalid', 'uuid': None, 'message': str(err.messages)}), 400

        result, status_code = SessionService.validate_uuid(data['uuid'])
        return jsonify(result), status_code

class UUIDGenerationAPI(MethodView):
    decorators = [limiter.limit(SESSION_RATE_LIMIT), api_route]

    def post(self):
        """Generate a unique UUID."""
        result, status_code = SessionService.generate_uuid()
        return jsonify(result), status_code

class SessionPersistAPI(MethodView):
    decorators = [api_route]

    def post(self):
        """Persist user session data."""
        try:
            schema = SessionPersistSchema()
            data = schema.load(request.get_json())
        except ValidationError as err:
            return jsonify({'error': str(err.messages), 'code': 'validation_error'}), 400

        result, status_code = SessionService.persist_session(
            data['session_uuid'], data['name'], data['email']
        )
        return jsonify(result), status_code

# Register the views
session_bp.add_url_rule('/validate-uuid', view_func=UUIDValidationAPI.as_view('validate_uuid'))
session_bp.add_url_rule('/generate-uuid', view_func=UUIDGenerationAPI.as_view('generate_uuid'))
session_bp.add_url_rule('/persist-session', view_func=SessionPersistAPI.as_view('persist_session'))
```

**Steps:**
1. Convert route functions to class-based views
2. Group related routes under the same blueprint
3. Add method-level documentation
4. Apply decorators at the class level for common functionality like rate limiting

## General Recommendations

### 1. Documentation

**Current Issue:** Documentation is inconsistent or missing in many parts of the codebase.

**Recommendation:**
- Add JSDoc comments to all functions and classes in the frontend
- Use docstring comments for all Python functions and classes
- Create API documentation with Swagger/OpenAPI
- Document state transitions and business rules

**Implementation Example (Frontend):**

```tsx
/**
 * Custom hook for managing session UUID.
 * Handles retrieving from localStorage, validating, and generating a new UUID if needed.
 *
 * @returns {UseSessionUUIDResult} The session UUID, loading state, error state, and reset function
 */
export function useSessionUUID(): UseSessionUUIDResult {
  // ...implementation
}
```

**Implementation Example (Backend):**

```python
def get_db_connection():
    """Get a connection to the database.

    Returns:
        A connection object to the PostgreSQL database

    Raises:
        psycopg2.OperationalError: If the connection cannot be established
    """
    conn = psycopg2.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        database=os.environ.get('DB_NAME', 'maria_ai'),
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASSWORD', '')
    )
    conn.autocommit = True
    return conn
```

**Steps:**
1. Add JSDoc comments to all frontend functions and components
2. Add Python docstrings to all backend functions and classes
3. Implement Swagger/OpenAPI documentation for the API
4. Create a comprehensive README.md with setup and usage instructions

### 2. Testing

**Current Issue:** Test coverage is incomplete or inconsistent.

**Recommendation:**
- Increase test coverage for critical paths
- Add integration tests for frontend-backend interactions
- Test edge cases and error conditions

**Implementation Example (Frontend Jest Test):**

```tsx
// src/features/chat/hooks/__tests__/useSessionUUID.test.tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { useSessionUUID } from '../useSessionUUID';
import { SessionApi } from '../../../../api/sessionApi';

// Mock SessionApi
jest.mock('../../../../api/sessionApi', () => ({
  generateUUID: jest.fn(),
  validateUUID: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useSessionUUID', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    localStorageMock.clear();
  });

  it('should generate a new UUID when none is stored', async () => {
    const mockUUID = '12345678-1234-4567-abcd-123456789abc';
    (SessionApi.generateUUID as jest.Mock).mockResolvedValue({
      status: 'success',
      uuid: mockUUID,
      message: 'Generated unique UUID',
    });

    const { result, waitForNextUpdate } = renderHook(() => useSessionUUID());

    // Initial state should be loading with no UUID
    expect(result.current.loading).toBe(true);
    expect(result.current.sessionUUID).toBe('');

    // Wait for async operations to complete
    await waitForNextUpdate();

    // After update, should have UUID and not be loading
    expect(result.current.loading).toBe(false);
    expect(result.current.sessionUUID).toBe(mockUUID);
    expect(result.current.error).toBe(null);

    // localStorage should have been set
    expect(localStorageMock.setItem).toHaveBeenCalledWith('session_uuid', mockUUID);
    expect(SessionApi.generateUUID).toHaveBeenCalledTimes(1);
  });
});
```

**Implementation Example (Backend Pytest Test):**

```python
# backend/tests/services/test_session_service.py
import pytest
from unittest.mock import patch, MagicMock
from app.services.session_service import SessionService

@pytest.fixture
def mock_db_connection():
    with patch('app.services.session_service.get_db_connection') as mock_conn:
        mock_cursor = MagicMock()
        mock_conn.return_value.cursor.return_value = mock_cursor
        yield mock_conn, mock_cursor

def test_validate_uuid_valid(mock_db_connection):
    # Arrange
    mock_conn, mock_cursor = mock_db_connection
    mock_cursor.fetchone.return_value = (0,)  # No existing UUID
    valid_uuid = "12345678-1234-4567-abcd-123456789abc"

    # Act
    with patch('app.services.session_service.log_audit_event') as mock_audit:
        result, status_code = SessionService.validate_uuid(valid_uuid)

    # Assert
    assert status_code == 200
    assert result['status'] == 'success'
    assert result['uuid'] == valid_uuid
    mock_cursor.execute.assert_called_once()
    mock_audit.assert_called_once_with('uuid_validation_success', user_uuid=valid_uuid)

def test_validate_uuid_invalid():
    # Arrange
    invalid_uuid = "not-a-uuid"

    # Act
    with patch('app.services.session_service.log_audit_event') as mock_audit:
        result, status_code = SessionService.validate_uuid(invalid_uuid)

    # Assert
    assert status_code == 400
    assert result['status'] == 'invalid'
    assert result['uuid'] is None
    mock_audit.assert_called_once_with('uuid_validation_failed', user_uuid=invalid_uuid,
                                      details={'reason': 'invalid format'})
```

**Steps:**
1. Create a comprehensive test plan for critical functionality
2. Implement unit tests for individual components, hooks, and services
3. Create integration tests for key user flows
4. Set up CI/CD to run tests automatically

### 3. Linting and Formatting

**Recommendation:**
- Enforce consistent code style with ESLint/Prettier (frontend)
- Use Black/flake8/isort for Python code formatting
- Add pre-commit hooks for automated formatting

**Implementation (Frontend):**
```json
// .eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint", "react", "react-hooks", "prettier"],
  "rules": {
    "prettier/prettier": "error",
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

**Implementation (Backend):**
```toml
# pyproject.toml
[tool.black]
line-length = 88
target-version = ['py39']
include = '\.pyi?$'

[tool.isort]
profile = "black"
line_length = 88
multi_line_output = 3
include_trailing_comma = true
force_grid_wrap = 0
use_parentheses = true
ensure_newline_before_comments = true
```

**Steps:**
1. Install and configure ESLint, Prettier, Black, and isort
2. Add configuration files to the project
3. Set up pre-commit hooks to run formatting automatically
4. Add script commands to package.json and Makefile

### 4. Security

**Recommendation:**
- Audit and fix any security vulnerabilities
- Implement proper input sanitization
- Add rate limiting on all sensitive endpoints

**Implementation (Backend Rate Limiting):**
```python
# backend/app/__init__.py
from flask import Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from app.routes.session import session_bp
from app.utils.error_handler import handle_api_errors

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

def create_app():
    app = Flask(__name__)

    # Initialize rate limiter
    limiter.init_app(app)

    # Register error handlers
    handle_api_errors(app)

    # Register blueprints
    app.register_blueprint(session_bp, url_prefix='/api')

    return app
```

**Steps:**
1. Install and configure security-related packages
2. Implement rate limiting for API endpoints
3. Add input validation and sanitization
4. Conduct a security audit of the codebase

### 5. Performance

**Recommendation:**
- Add memoization for expensive calculations
- Implement proper caching strategies
- Optimize bundle size for frontend

**Implementation (Frontend Memoization):**
```tsx
// src/features/chat/components/ChatMessage.tsx
import React, { useMemo } from 'react';
import { Message } from '../../../types';
import { formatMessageTimestamp } from '../utils/formatters';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ message }) => {
  const formattedTimestamp = useMemo(() => {
    return formatMessageTimestamp(message.timestamp);
  }, [message.timestamp]);

  return (
    <div className={`chat-message ${message.sender === 'bot' ? 'bot' : 'user'}`}>
      <div className="message-content">{message.content}</div>
      <div className="message-timestamp">{formattedTimestamp}</div>
    </div>
  );
});
```

**Steps:**
1. Identify performance bottlenecks
2. Implement memoization for expensive calculations
3. Set up proper caching strategies
4. Configure code splitting for frontend bundles

## Implementation Strategy

To ensure that the refactoring doesn't break existing functionality, follow this incremental approach:

1. **Preparation**:
   - Set up comprehensive tests for current functionality
   - Document the current behavior as acceptance tests
   - Create a separate branch for refactoring

2. **Start with Least Risky Changes**:
   - Begin with adding documentation
   - Implement linting and formatting
   - Create tests for critical paths

3. **Backend Refactoring**:
   - Implement service layer without changing functionality
   - Add request validation
   - Implement error handling
   - Convert to SQLAlchemy while maintaining the same database schema

4. **Frontend Refactoring**:
   - Reorganize folder structure
   - Create API service layer
   - Refactor hooks
   - Break down components
   - Implement state management improvements

5. **Verification**:
   - Run all tests after each significant change
   - Verify that UI behavior remains unchanged
   - Check API responses for consistency

6. **Performance and Security**:
   - Add security improvements
   - Implement performance optimizations
   - Conduct final testing

7. **Documentation and Cleanup**:
   - Update README and project documentation
   - Remove any dead code or unused dependencies
   - Document architecture decisions

By following this strategy, you can implement the refactoring incrementally while ensuring that the application's functionality remains the same.
