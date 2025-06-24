import React, { useState } from 'react';
import FileUploadButton from './FileUploadButton';
import FileStatusList from './FileStatusList';
import { FileStatus } from './FileStatusItem';
import { FileApi } from '../../api';

/**
 * Constants for file upload
 */
const MAX_FILES = 3;
const MAX_SIZE_MB = 5;
const ACCEPTED_TYPE = 'application/pdf';

/**
 * Props for the FileUpload component
 */
interface FileUploadProps {
  /** The session UUID to associate uploads with */
  sessionUUID: string;
  /** Function called when a file is successfully uploaded */
  onFileUploaded: (file: File) => void;
  /** Function called when the user clicks "Done & Continue" */
  onDone: () => void;
}

/**
 * Component that handles file uploads, including selection,
 * validation, progress tracking, and status display
 */
export const FileUpload: React.FC<FileUploadProps> = ({ sessionUUID, onFileUploaded, onDone }) => {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  /**
   * Validates a file for type and size constraints
   */
  const validateFile = (file: File): string | undefined => {
    if (file.type !== ACCEPTED_TYPE) return 'Unsupported file type';
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `File too large (max ${MAX_SIZE_MB}MB)`;
    return undefined;
  };

  /**
   * Handles file selection from FileUploadButton
   */
  const handleFileSelection = (selectedFiles: FileList | null) => {
    setGlobalError(null);

    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);

    if (fileArray.length + files.length > MAX_FILES) {
      setGlobalError(`Only upload up to ${MAX_FILES} files.`);
      return;
    }

    const newUploadingFiles: FileStatus[] = fileArray.map(file => {
      const error = validateFile(file);
      return {
        file,
        status: error ? 'error' : 'queued',
        progress: 0,
        error,
      };
    });

    setFiles(prev => [...prev, ...newUploadingFiles]);

    // Start uploads for valid files
    newUploadingFiles.forEach(fileStatus => {
      if (!fileStatus.error) {
        uploadFile(fileStatus.file);
      }
    });
  };

  /**
   * Uploads a file to the backend using FileApi
   */
  const uploadFile = async (file: File) => {
    // Update file status to uploading
    setFiles(prev =>
      prev.map(f =>
        f.file === file ? { ...f, status: 'uploading', progress: 0, error: undefined } : f
      )
    );

    try {
      // Upload file using the API service
      await FileApi.uploadFile(file, sessionUUID, progress => {
        setFiles(prev => prev.map(f => (f.file === file ? { ...f, progress } : f)));
      });

      // Update file status to uploaded on success
      setFiles(prev =>
        prev.map(f =>
          f.file === file
            ? {
                ...f,
                status: 'uploaded',
                progress: 100,
              }
            : f
        )
      );

      onFileUploaded(file);
    } catch (error) {
      // Handle errors
      setFiles(prev =>
        prev.map(f =>
          f.file === file
            ? {
                ...f,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : f
        )
      );
    }
  };

  /**
   * Handles retry of a failed upload
   */
  const handleRetry = (file: File) => {
    uploadFile(file);
  };

  /**
   * Handles removal of a file
   */
  const handleRemove = async (file: File) => {
    const fileObj = files.find(f => f.file === file);

    // If file was uploaded, try to delete it from backend
    if (fileObj?.status === 'uploaded') {
      try {
        await FileApi.deleteFile(file.name, sessionUUID);
      } catch (error) {
        // Continue with removal even if deletion fails
        console.error('Failed to delete file from server:', error);
      }
    }

    // Remove file from state
    setFiles(prev => prev.filter(f => f.file !== file));
  };

  // Count of successfully uploaded files
  const uploadedCount = files.filter(f => f.status === 'uploaded').length;

  return (
    <div className="button-container" aria-live="polite">
      <FileUploadButton onSelectFiles={handleFileSelection} />

      {globalError && (
        <div className="error-message" role="alert">
          {globalError}
        </div>
      )}

      <FileStatusList files={files} onRetry={handleRetry} onRemove={handleRemove} />

      {uploadedCount > 0 && (
        <button className="chat-button" style={{ marginTop: 8 }} onClick={onDone}>
          Done & Continue
        </button>
      )}
    </div>
  );
};

export default FileUpload;
