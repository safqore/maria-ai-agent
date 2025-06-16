import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onFileUploaded: (file: File) => void;
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

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | undefined => {
    if (file.type !== ACCEPTED_TYPE) return 'Unsupported file type';
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return 'File too large';
    return undefined;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const uploadFile = async (file: File) => {
    setFiles(prev => prev.map(f =>
      f.file === file ? { ...f, status: 'uploading', progress: 0, error: undefined } : f
    ));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://localhost:5001/upload');
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

  const handleRemove = async (file: File) => {
    const fileObj = files.find(f => f.file === file);
    if (fileObj?.status === 'uploaded' && fileObj.url) {
      // Backend delete request
      try {
        await fetch('http:/localhost:5001/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: fileObj.url }),
        });
      } catch (e) {
        // Optionally show error
      }
    }
    setFiles(prev => prev.filter(f => f.file !== file));
  };

  const handleRetry = (file: File) => {
    uploadFile(file);
  };

  const handleClick = () => {
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
      <button
        className="chat-button"
        disabled={uploadedCount === 0}
        aria-disabled={uploadedCount === 0}
        style={{ marginTop: 8 }}
        onClick={() => {/* TODO: integrate with state machine */}}
      >
        Done & Continue
      </button>
    </div>
  );
};

export default FileUpload;
