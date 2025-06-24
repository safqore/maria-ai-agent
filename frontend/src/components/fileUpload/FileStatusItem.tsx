import React from 'react';

/**
 * File status type for tracking upload state
 */
export interface FileStatus {
  /** The file object */
  file: File;
  /** Current upload status */
  status: 'queued' | 'uploading' | 'uploaded' | 'error';
  /** Upload progress (0-100) */
  progress: number;
  /** Error message if status is 'error' */
  error?: string;
  /** URL of the uploaded file if status is 'uploaded' */
  url?: string;
}

/**
 * Props for the FileStatusItem component
 */
interface FileStatusItemProps {
  /** The file status object */
  fileStatus: FileStatus;
  /** Function called to retry a failed upload */
  onRetry: (file: File) => void;
  /** Function called to remove a file */
  onRemove: (file: File) => void;
}

/**
 * Component that displays the status of a single file upload
 */
export const FileStatusItem: React.FC<FileStatusItemProps> = ({
  fileStatus,
  onRetry,
  onRemove,
}) => {
  const { file, status, progress, error } = fileStatus;

  return (
    <div className="uploaded-file" tabIndex={0} aria-label={file.name}>
      <span>
        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
      </span>

      {status === 'uploading' && (
        <span className="progress-bar" aria-label="Uploading">
          <progress value={progress} max={100} /> {progress}%
        </span>
      )}

      {status === 'uploaded' && (
        <span aria-label="Uploaded" style={{ color: 'green' }}>
          ✅
        </span>
      )}

      {status === 'error' && (
        <span className="error-message" role="alert" style={{ color: 'red' }}>
          ❌ {error}
        </span>
      )}

      {status === 'error' && (
        <button onClick={() => onRetry(file)} aria-label={`Retry upload for ${file.name}`}>
          Retry
        </button>
      )}

      <button onClick={() => onRemove(file)} aria-label={`Remove ${file.name}`}>
        X
      </button>
    </div>
  );
};

export default FileStatusItem;
