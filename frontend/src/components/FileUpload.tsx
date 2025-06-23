import React, { useState, useRef } from 'react';
import { API_BASE_URL } from '../utils/config';
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
const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, onDone, sessionUUID }) => {
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
   * Uploads a file to the backend. Enforces UUID check before upload.
   */
  const uploadFile = async (file: File) => {
    setFiles(prev => prev.map(f =>
      f.file === file ? { ...f, status: 'uploading', progress: 0, error: undefined } : f
    ));
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Always ensure a valid UUID is present before upload
      const uuid = await getOrCreateSessionUUID();
      formData.append('session_uuid', uuid);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setFiles(prev => prev.map(f =>
            f.file === file ? { ...f, progress: percent } : f
          ));
        }
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          setFiles(prev => prev.map(f =>
            f.file === file ? { ...f, status: 'uploaded', progress: 100, url: JSON.parse(xhr.response).files?.[0]?.url } : f
          ));
          onFileUploaded(file);
        } else if (xhr.status === 400 && xhr.responseText.includes('invalid session')) {
          // Handle backend invalid/tampered UUID error
          window.location.reload(); // Optionally, trigger a full reload to reset session
        } else {
          setFiles(prev => prev.map(f =>
            f.file === file ? { ...f, status: 'error', error: 'Failed to upload' } : f
          ));
        }
      };
      xhr.onerror = () => {
        setFiles(prev => prev.map(f =>
          f.file === file ? { ...f, status: 'error', error: 'Network error' } : f
        ));
      };
      xhr.send(formData);
    } catch (error) {
      setFiles(prev => prev.map(f =>
        f.file === file ? { ...f, status: 'error', error: 'Upload failed' } : f
      ));
    }
  };

  /**
   * Handles file removal. Enforces UUID check before removal.
   */
  const handleRemove = async (file: File) => {
    // Enforce UUID check before any file remove action
    await getOrCreateSessionUUID();
    const fileObj = files.find(f => f.file === file);
    if (fileObj?.status === 'uploaded' && fileObj.url) {
      // Backend delete request
      try {
        const uuid = await getOrCreateSessionUUID();
        const response = await fetch(`${API_BASE_URL}/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: fileObj.file.name, session_uuid: uuid }),
        });
        if (response.status === 400) {
          const text = await response.text();
          if (text.includes('invalid session')) {
            window.location.reload(); // Reset session on invalid UUID
            return;
          }
        }
      } catch (e) {
        // Optionally show error
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
        <div className="error-message" role="alert">{globalError}</div>
      )}
      <div className="uploaded-files">
        {files.map((f, index) => (
          <div key={index} className="uploaded-file" tabIndex={0} aria-label={f.file.name}>
            <span>{f.file.name} ({(f.file.size / 1024 / 1024).toFixed(2)} MB)</span>
            {f.status === 'uploading' && (
              <span className="progress-bar" aria-label="Uploading">
                <progress value={f.progress} max={100} /> {f.progress}%
              </span>
            )}
            {f.status === 'uploaded' && <span aria-label="Uploaded" style={{ color: 'green' }}>✅</span>}
            {f.status === 'error' && (
              <span className="error-message" role="alert" style={{ color: 'red' }}>
                ❌ {f.error}
              </span>
            )}
            {f.status === 'error' && (
              <button onClick={() => handleRetry(f.file)} aria-label={`Retry upload for ${f.file.name}`}>Retry</button>
            )}
            <button onClick={() => handleRemove(f.file)} aria-label={`Remove ${f.file.name}`}>X</button>
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
