import React, { useState, useRef } from 'react';
import { FileApi } from '../api/fileApi';
import { getOrCreateSessionUUID } from '../utils/sessionUtils';

interface FileUploadProps {
  onFileUploaded: (file: File) => void;
  onDone: () => void;
  sessionUUID: string; // Add sessionUUID prop for associating uploads
}

interface UploadingFile {
  file: File;
  status: 'queued' | 'uploading' | 'uploaded' | 'error';
  progress: number; // 0-100
  error?: string;
  url?: string;
}

const MAX_FILES = 3;
const MAX_SIZE_MB = 5;
const ACCEPTED_TYPE = 'application/pdf';

/**
 * FileUpload component handles PDF file uploads, enforces session UUID checks,
 * and manages upload state, errors, and user actions (remove, retry, done).
 * All user actions enforce UUID checks before proceeding.
 */
// sessionUUID is currently received but will be used in a future implementation
const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, onDone }) => {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validates a file for type and size constraints.
   */
  const validateFile = (file: File): string | undefined => {
    if (file.type !== ACCEPTED_TYPE) return 'Unsupported file type';
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return 'File too large';
    return undefined;
  };

  /**
   * Handles file input changes. Enforces UUID check before processing.
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Enforce UUID check before any file action
    getOrCreateSessionUUID();
    setGlobalError(null);
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      if (selectedFiles.length + files.length > MAX_FILES) {
        setGlobalError('Only upload up to 3 files.');
        return;
      }
      const newUploadingFiles: UploadingFile[] = selectedFiles.map(file => {
        const error = validateFile(file);
        return {
          file,
          status: error ? 'error' : 'queued',
          progress: 0,
          error: error,
        };
      });
      setFiles(prev => [...prev, ...newUploadingFiles]);
      newUploadingFiles.forEach(f => {
        if (!f.error) uploadFile(f.file);
      });
    }
  };

  /**
   * Uploads a file using the FileApi service. Enforces UUID check before upload.
   */
  const uploadFile = async (file: File) => {
    setFiles(prev =>
      prev.map(f =>
        f.file === file ? { ...f, status: 'uploading', progress: 0, error: undefined } : f
      )
    );
    
    try {
      // Always ensure a valid UUID is present before upload
      const uuid = await getOrCreateSessionUUID();
      
      // Use FileApi service with progress callback
      const response = await FileApi.uploadFile(
        file,
        uuid,
        (percent) => {
          setFiles(prev => prev.map(f => (f.file === file ? { ...f, progress: percent } : f)));
        }
      );
      
      // Check if response has the expected format from backend
      if (response.filename && response.url) {
        // Backend returned successful upload format: {filename, url}
        setFiles(prev =>
          prev.map(f =>
            f.file === file
              ? {
                  ...f,
                  status: 'uploaded',
                  progress: 100,
                  url: response.url,
                }
              : f
          )
        );
        onFileUploaded(file);
      } else if (response.status === 'success') {
        // Legacy format: {status, message, files}
        setFiles(prev =>
          prev.map(f =>
            f.file === file
              ? {
                  ...f,
                  status: 'uploaded',
                  progress: 100,
                  url: response.files?.[0]?.url,
                }
              : f
          )
        );
        onFileUploaded(file);
      } else {
        setFiles(prev =>
          prev.map(f =>
            f.file === file ? { ...f, status: 'error', error: response.message || response.error || 'Upload failed' } : f
          )
        );
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Network error';
      
      // Handle backend invalid/tampered UUID error
      if (errorMessage.includes('invalid session')) {
        window.location.reload(); // Optionally, trigger a full reload to reset session
        return;
      }
      
      setFiles(prev =>
        prev.map(f => (f.file === file ? { ...f, status: 'error', error: errorMessage } : f))
      );
    }
  };

  /**
   * Handles file removal using the FileApi service. Enforces UUID check before removal.
   */
  const handleRemove = async (file: File) => {
    // Enforce UUID check before any file remove action
    await getOrCreateSessionUUID();
    const fileObj = files.find(f => f.file === file);
    
    if (fileObj?.status === 'uploaded' && fileObj.url) {
      // Use FileApi service for deletion
      try {
        const uuid = await getOrCreateSessionUUID();
        const response = await FileApi.deleteFile(fileObj.file.name, uuid);
        
        if (response.status !== 'success') {
          // Handle deletion error, but still remove from UI
          console.warn('File deletion failed:', response.message);
        }
      } catch (error: any) {
        const errorMessage = error?.message || '';
        if (errorMessage.includes('invalid session')) {
          window.location.reload(); // Reset session on invalid UUID
          return;
        }
        // Log error but continue with removal from UI
        console.warn('File deletion error:', error);
      }
    }
    
    setFiles(prev => prev.filter(f => f.file !== file));
  };

  /**
   * Handles retrying a failed upload. Enforces UUID check before retry.
   */
  const handleRetry = async (file: File) => {
    // Enforce UUID check before any retry action
    await getOrCreateSessionUUID();
    uploadFile(file);
  };

  /**
   * Handles the "Done & Continue" action after uploads. Enforces UUID check before continuing.
   */
  const handleClick = async () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const uploadedCount = files.filter(f => f.status === 'uploaded').length;

  return (
    <div className="button-container" aria-live="polite">
      <button className="chat-button" onClick={handleClick} aria-label="Upload Files">
        Upload Files
      </button>
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        multiple
        data-testid="file-input"
        aria-label="Upload Files"
      />
      {globalError && (
        <div className="error-message" role="alert">
          {globalError}
        </div>
      )}
      <div className="uploaded-files">
        {files.map((f, index) => (
          <div key={index} className="uploaded-file" tabIndex={0} aria-label={f.file.name}>
            <span>
              {f.file.name} ({(f.file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
            {f.status === 'uploading' && (
              <span className="progress-bar" aria-label="Uploading">
                <progress value={f.progress} max={100} /> {f.progress}%
              </span>
            )}
            {f.status === 'uploaded' && (
              <span aria-label="Uploaded" style={{ color: 'green' }}>
                ✅
              </span>
            )}
            {f.status === 'error' && (
              <span className="error-message" role="alert" style={{ color: 'red' }}>
                ❌ {f.error}
              </span>
            )}
            {f.status === 'error' && (
              <button
                onClick={() => handleRetry(f.file)}
                aria-label={`Retry upload for ${f.file.name}`}
              >
                Retry
              </button>
            )}
            <button onClick={() => handleRemove(f.file)} aria-label={`Remove ${f.file.name}`}>
              X
            </button>
          </div>
        ))}
      </div>
      {uploadedCount > 0 && (
        <button
          className="chat-button"
          style={{ marginTop: 8 }}
          onClick={async () => {
            // Enforce UUID check before continuing
            await getOrCreateSessionUUID();
            onDone();
          }}
        >
          Done & Continue
        </button>
      )}
    </div>
  );
};

export default FileUpload;
