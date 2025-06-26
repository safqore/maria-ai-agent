# Updated Implementation Plan: User Session & File Association Strategy

## 1. Backend Components

### 1.1 Database Schema & Models

```python
from app.db import db
from datetime import datetime
import uuid

class UserSession(db.Model):
    """User session model for storing session data."""
    __tablename__ = 'user_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=True)
    email = db.Column(db.String(100), nullable=True)
    ip_address = db.Column(db.String(45), nullable=False)
    consent_user_data = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    verified = db.Column(db.Boolean, default=False)
    
    def __repr__(self):
        return f'<UserSession {self.uuid}>'

# filepath: /home/abbadminhas/code/maria-ai-agent/backend/app/models/audit_log.py
from app.db import db
from datetime import datetime

class AuditLog(db.Model):
    """Audit log model for tracking user actions and system events."""
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    event_type = db.Column(db.String(50), nullable=False, index=True)
    user_uuid = db.Column(db.String(36), nullable=True, index=True)
    ip_address = db.Column(db.String(45), nullable=True)
    metadata = db.Column(db.JSON, nullable=True)
    
    def __repr__(self):
        return f'<AuditLog {self.id}: {self.event_type}>'
```

### 1.2 UUID Management API

```python
from flask import Blueprint, request, jsonify, current_app
from app.utils.uuid_helpers import validate_uuid_format, is_uuid_in_database, generate_unique_uuid
from app.services.audit_service import log_audit_event
from flask_limiter.util import get_remote_address
from app.db import db
from app.models.user_session import UserSession
from app.extensions import limiter

session_bp = Blueprint('session', __name__, url_prefix='/api/session')

@session_bp.route('/validate-uuid', methods=['POST'])
@limiter.limit("10/minute")  # As per requirements
def validate_uuid():
    """Validate a UUID for format and database existence."""
    data = request.get_json()
    if not data or 'uuid' not in data:
        return jsonify({
            'status': 'error',
            'uuid': None,
            'message': 'Missing UUID in request'
        }), 400
        
    uuid = data.get('uuid')
    
    # Log validation attempt
    log_audit_event('uuid_validation_attempt', uuid=uuid, ip=get_remote_address())
    
    if not uuid or not validate_uuid_format(uuid):
        return jsonify({
            'status': 'invalid',
            'uuid': None,
            'message': 'Invalid UUID format'
        }), 400
    
    # Check if UUID exists in database
    if is_uuid_in_database(uuid):
        return jsonify({
            'status': 'collision',
            'uuid': None,
            'message': 'UUID already exists'
        }), 409
    
    return jsonify({
        'status': 'success',
        'uuid': uuid,
        'message': 'UUID is valid and unique'
    })

@session_bp.route('/generate-uuid', methods=['POST'])
@limiter.limit("10/minute")  # As per requirements
def generate_uuid():
    """Generate a new unique UUID."""
    # Log generation attempt
    log_audit_event('uuid_generation_attempt', ip=get_remote_address())
    
    # Try up to 3 times to generate a unique UUID
    for attempt in range(3):
        new_uuid = generate_unique_uuid()
        
        if not is_uuid_in_database(new_uuid):
            log_audit_event('uuid_generated', uuid=new_uuid, ip=get_remote_address())
            return jsonify({
                'status': 'success',
                'uuid': new_uuid,
                'message': 'UUID generated successfully'
            })
    
    # If we reach here, we failed to generate a unique UUID after 3 attempts
    log_audit_event('uuid_generation_failed', ip=get_remote_address())
    return jsonify({
        'status': 'error',
        'uuid': None,
        'message': 'Failed to generate a unique UUID after multiple attempts'
    }), 500
```

### 1.3 UUID Helper Functions

```python
import uuid
import re
from app.db import db
from app.models.user_session import UserSession

def validate_uuid_format(uuid_str):
    """
    Validate that a string is a valid UUID format.
    
    Args:
        uuid_str (str): The UUID string to validate
        
    Returns:
        bool: True if the format is valid, False otherwise
    """
    if not uuid_str or not isinstance(uuid_str, str):
        return False
        
    # UUID format regex (version 4)
    uuid_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    
    return bool(uuid_pattern.match(uuid_str))

def is_uuid_in_database(uuid_str):
    """
    Check if a UUID exists in the database.
    
    Args:
        uuid_str (str): The UUID to check
        
    Returns:
        bool: True if the UUID exists, False otherwise
    """
    return db.session.query(db.exists().where(UserSession.uuid == uuid_str)).scalar()

def generate_unique_uuid():
    """
    Generate a new UUID v4.
    
    Returns:
        str: A new UUID string
    """
    return str(uuid.uuid4())
```

### 1.4 Audit Logging Service

```python
from app.db import db
from app.models.audit_log import AuditLog
from flask import current_app
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

def log_audit_event(event_type, uuid=None, ip=None, metadata=None):
    """
    Log an audit event to the database.
    
    Args:
        event_type (str): Type of event
        uuid (str, optional): User UUID
        ip (str, optional): IP address
        metadata (dict, optional): Additional data
        
    Returns:
        AuditLog: The created audit log entry
    """
    try:
        audit_log = AuditLog(
            event_type=event_type,
            user_uuid=uuid,
            ip_address=ip,
            metadata=metadata
        )
        db.session.add(audit_log)
        db.session.commit()
        return audit_log
    except Exception as e:
        current_app.logger.error(f"Failed to log audit event: {str(e)}")
        db.session.rollback()
        return None

def notify_admin_of_error(error_message, user_uuid=None, user_actions=None):
    """
    Send email notification to admin about an error.
    
    Args:
        error_message (str): The error message
        user_uuid (str, optional): User UUID
        user_actions (str, optional): User actions before error
    """
    try:
        admin_email = current_app.config.get('ADMIN_EMAIL')
        if not admin_email:
            current_app.logger.error("Admin email not configured")
            return False
            
        # Create email content
        msg = MIMEMultipart()
        msg['Subject'] = f"Error Alert: Maria AI Agent {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
        msg['From'] = current_app.config.get('SMTP_FROM_EMAIL')
        msg['To'] = admin_email
        
        # Truncate long data
        if user_actions and len(user_actions) > 200:
            user_actions = user_actions[:200] + "... (truncated)"
        
        body = f"""
        Error detected in Maria AI Agent:
        
        Timestamp: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
        User UUID: {user_uuid or 'Unknown'}
        Error: {error_message}
        
        User Actions: {user_actions or 'None recorded'}
        
        Full logs available in server logs.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email via SMTP
        with smtplib.SMTP(current_app.config.get('SMTP_SERVER'), current_app.config.get('SMTP_PORT')) as server:
            if current_app.config.get('SMTP_USE_TLS'):
                server.starttls()
            if current_app.config.get('SMTP_USERNAME') and current_app.config.get('SMTP_PASSWORD'):
                server.login(current_app.config.get('SMTP_USERNAME'), current_app.config.get('SMTP_PASSWORD'))
            server.send_message(msg)
            
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send admin notification: {str(e)}")
        return False
```

### 1.5 File Upload Service

```python
import boto3
import os
from uuid import uuid4
from flask import current_app
from werkzeug.utils import secure_filename
import mimetypes
from app.services.audit_service import log_audit_event, notify_admin_of_error

class FileService:
    """Service for handling file uploads to S3."""
    
    def __init__(self):
        """Initialize S3 client and configuration."""
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=current_app.config.get('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=current_app.config.get('AWS_SECRET_ACCESS_KEY'),
            region_name=current_app.config.get('AWS_REGION')
        )
        self.bucket_name = current_app.config.get('S3_BUCKET_NAME', 'safqores-maria')
        
    def upload_file(self, file, uuid):
        """
        Upload a file to the specified UUID folder in S3.
        
        Args:
            file (FileStorage): The file to upload
            uuid (str): User UUID for namespacing
            
        Returns:
            tuple: (success (bool), result (dict or str))
        """
        if not self._validate_uuid(uuid):
            return False, "Invalid UUID"
            
        try:
            # Secure filename and check file type
            filename = secure_filename(file.filename)
            if not self._is_allowed_file(filename):
                return False, "File type not allowed. Only PDF files are accepted."
                
            # Create S3 path
            file_path = f"uploads/{uuid}/{filename}"
            
            # Upload to S3
            self.s3_client.upload_fileobj(file, self.bucket_name, file_path)
            
            # Generate URL
            file_url = f"https://{self.bucket_name}.s3.amazonaws.com/{file_path}"
            
            # Log the file upload event
            log_audit_event("file_upload", uuid=uuid, metadata={"filename": filename, "url": file_url})
            
            return True, {
                "filename": filename,
                "url": file_url
            }
        except Exception as e:
            error_msg = str(e)
            log_audit_event("file_upload_error", uuid=uuid, 
                           metadata={"error": error_msg, "filename": file.filename})
            return False, f"Upload failed: {error_msg}"
            
    def delete_file(self, uuid, filename):
        """
        Delete a file from S3.
        
        Args:
            uuid (str): User UUID
            filename (str): File name to delete
            
        Returns:
            tuple: (success (bool), message (str))
        """
        if not self._validate_uuid(uuid):
            return False, "Invalid UUID"
            
        try:
            # Secure the filename and create path
            filename = secure_filename(filename)
            file_path = f"uploads/{uuid}/{filename}"
            
            # Delete from S3
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_path
            )
            
            # Log deletion
            log_audit_event("file_deleted", uuid=uuid, metadata={"filename": filename})
            
            return True, f"File {filename} deleted successfully"
        except Exception as e:
            error_msg = str(e)
            log_audit_event("file_deletion_error", uuid=uuid, metadata={"error": error_msg, "filename": filename})
            return False, f"Deletion failed: {error_msg}"
            
    def _validate_uuid(self, uuid):
        """
        Validate UUID format.
        
        Args:
            uuid (str): UUID to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        from app.utils.uuid_helpers import validate_uuid_format
        return validate_uuid_format(uuid)
        
    def _is_allowed_file(self, filename):
        """
        Check if file type is allowed.
        
        Args:
            filename (str): File name to check
            
        Returns:
            bool: True if allowed, False otherwise
        """
        return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'pdf'
```

### 1.6 Orphaned File Cleanup Utility

```python
import boto3
import os
import sys
from datetime import datetime, timedelta
import argparse
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import time
from logging.handlers import RotatingFileHandler

# Setup logging
log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log_handler = RotatingFileHandler('orphaned_cleanup.log', maxBytes=10485760, backupCount=5)
log_handler.setFormatter(log_formatter)

logger = logging.getLogger('orphaned_cleanup')
logger.setLevel(logging.INFO)
logger.addHandler(log_handler)
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
logger.addHandler(console_handler)

def setup_db_connection():
    """Setup database connection for checking UUIDs."""
    try:
        db_url = os.environ.get('DATABASE_URL')
        engine = create_engine(db_url)
        Session = sessionmaker(bind=engine)
        return Session()
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        return None

def is_uuid_in_database(db_session, uuid):
    """Check if a UUID exists in the user_sessions table."""
    try:
        result = db_session.execute(
            "SELECT COUNT(*) FROM user_sessions WHERE uuid = :uuid",
            {"uuid": uuid}
        ).scalar()
        return result > 0
    except Exception as e:
        logger.error(f"Database query error for UUID {uuid}: {str(e)}")
        return False

def get_s3_client():
    """Create and return an S3 client."""
    try:
        return boto3.client(
            's3',
            aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
            region_name=os.environ.get('AWS_REGION')
        )
    except Exception as e:
        logger.error(f"Failed to create S3 client: {str(e)}")
        return None

def get_folder_age(s3_client, bucket, prefix):
    """Get the age of the oldest object in a folder."""
    try:
        response = s3_client.list_objects_v2(Bucket=bucket, Prefix=prefix)
        if 'Contents' not in response:
            return None
            
        # Find oldest object
        oldest_date = None
        for obj in response.get('Contents', []):
            if oldest_date is None or obj['LastModified'] < oldest_date:
                oldest_date = obj['LastModified']
                
        if oldest_date:
            return datetime.now(oldest_date.tzinfo) - oldest_date
        return None
    except Exception as e:
        logger.error(f"Error checking folder age for {prefix}: {str(e)}")
        return None

def delete_folder(s3_client, bucket, prefix, dry_run=False):
    """Delete all objects with the given prefix."""
    deleted_count = 0
    
    try:
        # List all objects with the prefix
        paginator = s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=bucket, Prefix=prefix)
        
        objects_to_delete = []
        for page in pages:
            if 'Contents' not in page:
                continue
                
            for obj in page['Contents']:
                objects_to_delete.append({'Key': obj['Key']})
                
        if not objects_to_delete:
            return 0
            
        # Log what would be deleted in dry run mode
        if dry_run:
            logger.info(f"Would delete {len(objects_to_delete)} objects from {prefix}")
            return len(objects_to_delete)
            
        # Delete objects in batches of 1000 (S3 limit)
        for i in range(0, len(objects_to_delete), 1000):
            batch = objects_to_delete[i:i+1000]
            s3_client.delete_objects(
                Bucket=bucket,
                Delete={'Objects': batch}
            )
            deleted_count += len(batch)
            
        return deleted_count
    except Exception as e:
        logger.error(f"Error deleting folder {prefix}: {str(e)}")
        return deleted_count

def cleanup_orphaned_files(bucket_name, dry_run=False, age_threshold_minutes=30):
    """Clean up orphaned files in S3."""
    logger.info(f"Starting orphaned file cleanup (dry_run={dry_run})")
    
    s3_client = get_s3_client()
    if not s3_client:
        logger.error("Failed to initialize S3 client. Exiting.")
        return False
        
    db_session = setup_db_connection()
    if not db_session:
        logger.error("Failed to connect to database. Exiting.")
        return False
        
    try:
        # List all folders under uploads/
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix='uploads/',
            Delimiter='/'
        )
        
        total_deleted = 0
        
        # Process each UUID folder
        for prefix in response.get('CommonPrefixes', []):
            folder_path = prefix.get('Prefix')
            
            # Extract UUID from path like 'uploads/{uuid}/'
            if not folder_path or folder_path == 'uploads/':
                continue
                
            uuid = folder_path.split('/')[1]
            
            # Check folder age
            folder_age = get_folder_age(s3_client, bucket_name, folder_path)
            if not folder_age or folder_age < timedelta(minutes=age_threshold_minutes):
                logger.debug(f"Skipping folder {folder_path}: too recent or age unknown")
                continue
                
            # Double-check UUID is not in database
            if not is_uuid_in_database(db_session, uuid):
                # Delete the folder
                deleted_count = delete_folder(s3_client, bucket_name, folder_path, dry_run)
                total_deleted += deleted_count
                
                if deleted_count > 0:
                    logger.info(f"{'Would delete' if dry_run else 'Deleted'} folder {folder_path} ({deleted_count} objects)")
            else:
                logger.info(f"Skipping folder {folder_path}: UUID exists in database")
                
        logger.info(f"Cleanup complete. {'Would delete' if dry_run else 'Deleted'} {total_deleted} objects.")
        return True
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        return False
    finally:
        db_session.close()

def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(description='Clean up orphaned files in S3')
    parser.add_argument('--dry-run', action='store_true', help='Run in dry-run mode (no actual deletions)')
    parser.add_argument('--bucket', default='safqores-maria', help='S3 bucket name')
    parser.add_argument('--age', type=int, default=30, help='Age threshold in minutes')
    args = parser.parse_args()
    
    success = cleanup_orphaned_files(args.bucket, args.dry_run, args.age)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
```

## 2. Frontend Components

### 2.1 Session Management Hook

```typescript
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

export interface SessionState {
  uuid: string | null;
  isLoading: boolean;
  error: string | null;
  isResetRequired: boolean;
}

const SESSION_STORAGE_KEY = 'session_uuid';

export const useSessionUUID = () => {
  const [sessionState, setSessionState] = useState<SessionState>({
    uuid: null,
    isLoading: true,
    error: null,
    isResetRequired: false
  });

  // Generate a new UUID and store it
  const generateAndStoreUUID = async () => {
    try {
      setSessionState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Call backend to generate UUID
      const response = await fetch(`${config.API_BASE_URL}/api/session/generate-uuid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success' && data.uuid) {
        // Store in localStorage and update state
        localStorage.setItem(SESSION_STORAGE_KEY, data.uuid);
        setSessionState({
          uuid: data.uuid,
          isLoading: false,
          error: null,
          isResetRequired: false
        });
      } else {
        // Backend error - fallback to client-side generation
        const fallbackUuid = uuidv4();
        localStorage.setItem(SESSION_STORAGE_KEY, fallbackUuid);
        setSessionState({
          uuid: fallbackUuid,
          isLoading: false,
          error: 'Failed to generate server-side UUID, using client-side fallback',
          isResetRequired: false
        });
      }
    } catch (error) {
      // Network error - fallback to client-side generation
      const fallbackUuid = uuidv4();
      localStorage.setItem(SESSION_STORAGE_KEY, fallbackUuid);
      setSessionState({
        uuid: fallbackUuid,
        isLoading: false,
        error: 'Network error, using client-side UUID fallback',
        isResetRequired: false
      });
    }
  };

  // Validate an existing UUID with the backend
  const validateUUID = async (uuid: string) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/session/validate-uuid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uuid })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        return true;
      }
      
      // If validation fails, we need to reset
      return false;
    } catch (error) {
      // Network error, assume UUID is valid for now
      // We don't want to reset UUIDs just because backend is down
      console.error('UUID validation error:', error);
      return true;
    }
  };

  // Reset the session
  const resetSession = async (showMessage: boolean = true) => {
    setSessionState(prev => ({ ...prev, isResetRequired: showMessage }));
    localStorage.removeItem(SESSION_STORAGE_KEY);
    await generateAndStoreUUID();
  };

  useEffect(() => {
    const initSession = async () => {
      // Check for existing UUID in localStorage
      const storedUUID = localStorage.getItem(SESSION_STORAGE_KEY);
      
      if (storedUUID) {
        // Validate existing UUID
        const isValid = await validateUUID(storedUUID);
        
        if (isValid) {
          setSessionState({
            uuid: storedUUID,
            isLoading: false,
            error: null,
            isResetRequired: false
          });
        } else {
          // UUID is invalid or tampered, reset session
          await resetSession(true);
        }
      } else {
        // No UUID found, generate new one
        await generateAndStoreUUID();
      }
    };
    
    initSession();
  }, []);

  return {
    sessionId: sessionState.uuid,
    isLoading: sessionState.isLoading,
    error: sessionState.error,
    isResetRequired: sessionState.isResetRequired,
    resetSession
  };
};
```

### 2.2 Session Context Provider

```typescript
import React, { createContext, useContext, ReactNode } from 'react';
import { useSessionUUID } from '../hooks/useSessionUUID';

interface SessionContextType {
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  isResetRequired: boolean;
  resetSession: (showMessage?: boolean) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const sessionData = useSessionUUID();
  
  return (
    <SessionContext.Provider value={sessionData}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  
  return context;
};
```

### 2.3 File Upload Service (API)

```typescript
import { config } from '../config';
import { ApiError } from './config';

export interface FileUploadResponse {
  filename: string;
  url: string;
}

export interface FileUploadError {
  error: string;
}

export class FileApi {
  /**
   * Upload a file to the server
   * 
   * @param file The file to upload
   * @param sessionUUID User's session UUID
   * @param onProgress Optional progress callback
   * @returns Promise with file upload response
   */
  static async uploadFile(
    file: File,
    sessionUUID: string,
    onProgress?: (percentage: number) => void
  ): Promise<FileUploadResponse> {
    return new Promise((resolve, reject) => {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('session_uuid', sessionUUID);
      
      // Create XHR for upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            onProgress(percentage);
          }
        };
      }
      
      // Handle completion
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.response);
            resolve(response);
          } catch (error) {
            reject(new ApiError('Invalid response format', xhr.status));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.response) as FileUploadError;
            reject(new ApiError(errorResponse.error || 'Upload failed', xhr.status));
          } catch (error) {
            reject(new ApiError('Upload failed', xhr.status));
          }
        }
      };
      
      // Handle errors
      xhr.onerror = () => {
        reject(new ApiError('Network error', 0));
      };
      
      // Handle timeouts
      xhr.ontimeout = () => {
        reject(new ApiError('Request timed out', 408));
      };
      
      // Send the request
      xhr.open('POST', `${config.API_BASE_URL}/upload`);
      xhr.send(formData);
    });
  }
  
  /**
   * Delete a file from the server
   * 
   * @param filename Filename to delete
   * @param sessionUUID User's session UUID
   * @returns Promise with deletion success
   */
  static async deleteFile(
    filename: string,
    sessionUUID: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${config.API_BASE_URL}/delete-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename,
          session_uuid: sessionUUID
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.error || 'Failed to delete file', response.status);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0);
    }
  }
}
```

### 2.4 Session Reset Alert Component

```typescript
import React from 'react';
import { useSession } from '../../contexts/SessionContext';

export const SessionResetAlert: React.FC = () => {
  const { isResetRequired } = useSession();
  
  if (!isResetRequired) {
    return null;
  }
  
  return (
    <div className="session-reset-alert" role="alert">
      <p>Your session has been reset due to a technical issue. Please start again.</p>
    </div>
  );
};
```

## 3. Integration Points

### 3.1 App Component with Session Provider

```typescript
import React from 'react';
import { SessionProvider } from './contexts/SessionContext';
import { ChatProvider } from './contexts/ChatContext';
import { ChatContainer } from './components/chat/ChatContainer';
import { SessionResetAlert } from './components/shared/SessionResetAlert';
import './App.css';

const App: React.FC = () => {
  return (
    <SessionProvider>
      <ChatProvider>
        <div className="app">
          <SessionResetAlert />
          <ChatContainer />
        </div>
      </ChatProvider>
    </SessionProvider>
  );
};

export default App;
```

### 3.2 File Upload Component Integration

```typescript
import React, { useState, useRef, useCallback } from 'react';
import { FileApi } from '../../api/fileApi';
import { useSession } from '../../contexts/SessionContext';
import { FileStatusList } from './FileStatusList';

export interface FileStatus {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'queued' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

interface FileUploadProps {
  onUploadComplete: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const { sessionId } = useSession();
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Validate file type (PDF only)
  const validateFileType = (file: File): boolean => {
    return file.type === 'application/pdf';
  };
  
  // Validate file size (max 5MB)
  const validateFileSize = (file: File): boolean => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    return file.size <= MAX_SIZE;
  };
  
  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;
    
    setErrorMessage(null);
    
    // Check if adding new files would exceed the limit
    if (files.length + selectedFiles.length > 3) {
      setErrorMessage('You can only upload up to 3 files in total.');
      return;
    }
    
    // Process each file
    Array.from(selectedFiles).forEach(file => {
      // Validate file type
      if (!validateFileType(file)) {
        setErrorMessage('Only PDF files are allowed.');
        return;
      }
      
      // Validate file size
      if (!validateFileSize(file)) {
        setErrorMessage('Files must be smaller than 5MB.');
        return;
      }
      
      // Add file to list
      setFiles(prevFiles => [
        ...prevFiles,
        {
          id: `${file.name}-${Date.now()}`,
          file,
          name: file.name,
          size: file.size,
          status: 'queued',
          progress: 0
        }
      ]);
    });
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle file upload
  const uploadFile = useCallback(async (fileStatus: FileStatus) => {
    if (!sessionId) {
      return;
    }
    
    // Update status to uploading
    setFiles(prevFiles =>
      prevFiles.map(f =>
        f.id === fileStatus.id ? { ...f, status: 'uploading' } : f
      )
    );
    
    try {
      // Upload the file
      const result = await FileApi.uploadFile(
        fileStatus.file,
        sessionId,
        (progress) => {
          // Update progress
          setFiles(prevFiles =>
            prevFiles.map(f =>
              f.id === fileStatus.id ? { ...f, progress } : f
            )
          );
        }
      );
      
      // Update status to success
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f.id === fileStatus.id
            ? { ...f, status: 'success', progress: 100, url: result.url }
            : f
        )
      );
    } catch (error) {
      // Update status to error
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f.id === fileStatus.id
            ? {
                ...f,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : f
        )
      );
    }
  }, [sessionId]);
  
  // Upload all queued files
  const uploadQueuedFiles = useCallback(() => {
    files
      .filter(f => f.status === 'queued')
      .forEach(file => {
        uploadFile(file);
      });
  }, [files, uploadFile]);
  
  // Handle file removal
  const handleRemoveFile = useCallback(async (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    
    if (!fileToRemove) return;
    
    // If file was successfully uploaded, delete from server
    if (fileToRemove.status === 'success' && fileToRemove.url && sessionId) {
      try {
        await FileApi.deleteFile(fileToRemove.name, sessionId);
      } catch (error) {
        console.error('Failed to delete file from server:', error);
        // Continue with removal even if deletion from server fails
      }
    }
    
    // Remove from list
    setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
  }, [files, sessionId]);
  
  // Handle file retry
  const handleRetryFile = useCallback((fileId: string) => {
    const fileToRetry = files.find(f => f.id === fileId);
    
    if (!fileToRetry) return;
    
    uploadFile(fileToRetry);
  }, [files, uploadFile]);
  
  // Handle done button click
  const handleDoneClick = () => {
    if (files.some(f => f.status === 'success')) {
      onUploadComplete();
    } else {
      setErrorMessage('Please upload at least one file before continuing.');
    }
  };
  
  // Determine if any files are still uploading
  const isUploading = files.some(f => f.status === 'uploading');
  
  // Determine if at least one file was uploaded successfully
  const hasSuccessfulUploads = files.some(f => f.status === 'success');
  
  return (
    <div className="file-upload" data-testid="file-upload">
      <h3>Upload Files (PDF only, max 3 files, 5MB each)</h3>
      
      {errorMessage && (
        <div className="file-upload__error" role="alert">
          {errorMessage}
        </div>
      )}
      
      <FileStatusList
        files={files}
        onRetry={handleRetryFile}
        onRemove={handleRemoveFile}
      />
      
      {files.length < 3 && (
        <div className="file-upload__actions">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            ref={fileInputRef}
            className="file-upload__input"
            id="file-upload-input"
            multiple
          />
          <label htmlFor="file-upload-input" className="file-upload__button">
            {files.length === 0 ? 'Choose Files' : 'Add More Files'}
          </label>
          
          {files.some(f => f.status === 'queued') && (
            <button
              onClick={uploadQueuedFiles}
              className="file-upload__button"
              disabled={isUploading}
            >
              Upload Files
            </button>
          )}
        </div>
      )}
      
      <div className="file-upload__footer">
        <button
          onClick={handleDoneClick}
          className="file-upload__done-button"
          disabled={!hasSuccessfulUploads || isUploading}
        >
          Done & Continue
        </button>
      </div>
    </div>
  );
};
```

## 4. Testing

### 4.1 Backend Tests (UUID Validation)

```python
import pytest
import json
import uuid
from app import create_app
from app.db import db
from app.models.user_session import UserSession
from unittest.mock import patch

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_validate_uuid_success(client):
    """Test UUID validation with valid UUID"""
    test_uuid = str(uuid.uuid4())
    response = client.post('/api/session/validate-uuid', 
                          json={'uuid': test_uuid},
                          content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'
    assert data['uuid'] == test_uuid
    assert 'message' in data

def test_validate_uuid_invalid_format(client):
    """Test UUID validation with invalid format"""
    test_uuid = "not-a-valid-uuid"
    response = client.post('/api/session/validate-uuid', 
                          json={'uuid': test_uuid},
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['status'] == 'invalid'
    assert data['uuid'] is None
    assert 'message' in data

def test_validate_uuid_collision(client, app):
    """Test UUID validation with existing UUID in database"""
    # Create a session in the database
    test_uuid = str(uuid.uuid4())
    with app.app_context():
        session = UserSession(uuid=test_uuid, ip_address='127.0.0.1')
        db.session.add(session)
        db.session.commit()
    
    # Test validation
    response = client.post('/api/session/validate-uuid', 
                          json={'uuid': test_uuid},
                          content_type='application/json')
    
    assert response.status_code == 409
    data = json.loads(response.data)
    assert data['status'] == 'collision'
    assert data['uuid'] is None
    assert 'message' in data

def test_generate_uuid_success(client):
    """Test UUID generation"""
    response = client.post('/api/session/generate-uuid')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'
    assert data['uuid'] is not None
    assert 'message' in data
    
    # Validate UUID format
    generated_uuid = data['uuid']
    try:
        uuid_obj = uuid.UUID(generated_uuid)
        assert str(uuid_obj) == generated_uuid  # Ensure it's a valid UUID
    except ValueError:
        assert False, "Generated UUID is not valid"

@patch('app.routes.session_routes.generate_unique_uuid')
@patch('app.routes.session_routes.is_uuid_in_database')
def test_generate_uuid_collision_retry(mock_is_uuid_in_db, mock_gen_uuid, client):
    """Test UUID generation with collision retry"""
    # Mock uuid generation to return the same UUID 3 times
    mock_gen_uuid.side_effect = ['collision-uuid', 'collision-uuid', 'collision-uuid', 'success-uuid']
    
    # Mock database check to return True (collision) for first 3 attempts, then False
    mock_is_uuid_in_db.side_effect = [True, True, True, False]
    
    response = client.post('/api/session/generate-uuid')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'
    assert data['uuid'] == 'success-uuid'
    
    # Check that we tried 4 times
    assert mock_gen_uuid.call_count == 4
    assert mock_is_uuid_in_db.call_count == 4

@patch('app.routes.session_routes.generate_unique_uuid')
@patch('app.routes.session_routes.is_uuid_in_database')
def test_generate_uuid_max_retries(mock_is_uuid_in_db, mock_gen_uuid, client):
    """Test UUID generation with max retries exceeded"""
    # Mock uuid generation to always return a colliding UUID
    mock_gen_uuid.return_value = 'collision-uuid'
    
    # Mock database check to always return True (collision)
    mock_is_uuid_in_db.return_value = True
    
    response = client.post('/api/session/generate-uuid')
    
    assert response.status_code == 500
    data = json.loads(response.data)
    assert data['status'] == 'error'
    assert data['uuid'] is None
    assert 'Failed to generate a unique UUID' in data['message']
    
    # Check that we tried 3 times (max retries)
    assert mock_gen_uuid.call_count == 3
    assert mock_is_uuid_in_db.call_count == 3
```

### 4.2 Frontend Tests (Session Hook)

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useSessionUUID } from '../useSessionUUID';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock fetch
global.fetch = jest.fn();

// Mock UUID generation
jest.mock('uuid');
const mockUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;

describe('useSessionUUID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockUuidv4.mockReturnValue('client-generated-uuid');
    // @ts-ignore
    global.fetch.mockClear();
  });

  it('should get UUID from localStorage if it exists and is valid', async () => {
    // Setup mocks
    mockLocalStorage.getItem.mockReturnValue('existing-uuid');
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', uuid: 'existing-uuid' })
    });
    
    // Render hook
    const { result, waitForNextUpdate } = renderHook(() => useSessionUUID());
    
    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    // Should have checked localStorage
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('session_uuid');
    
    // Should have validated the UUID
    expect(global.fetch).toHaveBeenCalledWith(
      `${config.API_BASE_URL}/api/session/validate-uuid`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ uuid: 'existing-uuid' })
      })
    );
    
    // Should have used the existing UUID
    expect(result.current.sessionId).toBe('existing-uuid');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isResetRequired).toBe(false);
  });

  it('should generate a new UUID if none exists in localStorage', async () => {
    // Setup mocks
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', uuid: 'server-generated-uuid' })
    });
    
    // Render hook
    const { result, waitForNextUpdate } = renderHook(() => useSessionUUID());
    
    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    // Should have checked localStorage
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('session_uuid');
    
    // Should have generated a new UUID
    expect(global.fetch).toHaveBeenCalledWith(
      `${config.API_BASE_URL}/api/session/generate-uuid`,
      expect.objectContaining({
        method: 'POST'
      })
    );
    
    // Should store the new UUID in localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'session_uuid',
      'server-generated-uuid'
    );
    
    // Should use the new UUID
    expect(result.current.sessionId).toBe('server-generated-uuid');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isResetRequired).toBe(false);
  });

  it('should reset session if UUID validation fails', async () => {
    // Setup mocks
    mockLocalStorage.getItem.mockReturnValue('invalid-uuid');
    
    // First fetch for validation
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'invalid', uuid: null })
    });
    
    // Second fetch for generation
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', uuid: 'new-uuid' })
    });
    
    // Render hook
    const { result, waitForNextUpdate } = renderHook(() => useSessionUUID());
    
    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    // Should have reset localStorage
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('session_uuid');
    
    // Should have stored new UUID
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('session_uuid', 'new-uuid');
    
    // Should indicate reset was required
    expect(result.current.sessionId).toBe('new-uuid');
    expect(result.current.isResetRequired).toBe(true);
  });

  it('should fallback to client-side UUID on network error', async () => {
    // Setup mocks
    // @ts-ignore
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Render hook
    const { result, waitForNextUpdate } = renderHook(() => useSessionUUID());
    
    await waitForNextUpdate();
    
    // Should have generated a client-side UUID
    expect(mockUuidv4).toHaveBeenCalled();
    
    // Should store the UUID in localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('session_uuid', 'client-generated-uuid');
    
    // Should use the client-side UUID
    expect(result.current.sessionId).toBe('client-generated-uuid');
    expect(result.current.error).not.toBeNull(); // Should have an error
  });

  it('should manually reset session when resetSession is called', async () => {
    // Setup mocks
    mockLocalStorage.getItem.mockReturnValue('existing-uuid');
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', uuid: 'existing-uuid' })
    });
    
    // For the resetSession call
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', uuid: 'new-uuid' })
    });
    
    // Render hook
    const { result, waitForNextUpdate } = renderHook(() => useSessionUUID());
    
    await waitForNextUpdate();
    
    // Verify initial state
    expect(result.current.sessionId).toBe('existing-uuid');
    
    // Call resetSession
    await act(async () => {
      await result.current.resetSession();
    });
    
    // Should have reset localStorage
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('session_uuid');
    
    // Should have generated a new UUID
    expect(global.fetch).toHaveBeenCalledWith(
      `${config.API_BASE_URL}/api/session/generate-uuid`,
      expect.objectContaining({
        method: 'POST'
      })
    );
    
    // Should have stored the new UUID
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('session_uuid', 'new-uuid');
    
    // Should use the new UUID
    expect(result.current.sessionId).toBe('new-uuid');
    
    // Should not show reset message by default
    expect(result.current.isResetRequired).toBe(false);
  });
});
```

## 5. Implementation Plan Timeline

### Week 1: Backend Core Infrastructure
1. **Day 1-2:** Set up database models, migrations, and backend structure
2. **Day 3-4:** Implement UUID validation/generation endpoints and rate limiting
3. **Day 5:** Implement audit logging service and email notifications

### Week 2: File Management & Frontend Integration
1. **Day 1-2:** Implement S3 file upload service
2. **Day 3:** Create orphaned file cleanup script
3. **Day 4-5:** Develop frontend session management hooks and context

### Week 3: Frontend Components & Testing
1. **Day 1-2:** Implement file upload component and UI
2. **Day 3-4:** Develop tests for backend and frontend
3. **Day 5:** Integration testing and bug fixes

### Week 4: Security & Deployment
1. **Day 1-2:** Implement CORS and security features
2. **Day 3:** Set up cron job for orphaned file cleanup
3. **Day 4-5:** Final testing and deployment

## 6. Security & Compliance Measures

1. **Rate Limiting:**
   - Set to 10 requests per minute per IP as specified
   - Applied to sensitive endpoints like UUID validation/generation

2. **CORS Protection:**
   - Restrict API endpoints to accept requests only from the frontend domain
   - Configure appropriate headers to prevent cross-site attacks

3. **GDPR Compliance:**
   - Implement explicit consent collection in chat interface
   - Enable data deletion functionality
   - Ensure proper data minimization principles

4. **Audit Logging:**
   - Log all significant user and system events for traceability
   - Include timestamps, event types, UUIDs, and relevant metadata

5. **Email Notifications:**
   - Direct SMTP implementation for admin notifications
   - Include truncated logs for debugging

6. **Error Handling:**
   - Proper error messages for users
   - Detailed logging for technical issues

This implementation plan addresses all the requirements specified in the user session and file association strategy document while adhering to the provided coding standards and project structure.

Similar code found with 3 license types