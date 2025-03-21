import React, { useState, ChangeEvent } from 'react';

interface FileUploadProps {
  onFileUploaded: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const firstFile = files[0];
      if (firstFile.type === 'application/pdf' && firstFile.size <= 10 * 1024 * 1024) {
        setFile(firstFile);
        onFileUploaded(firstFile);
      } else {
        alert('Please upload a PDF file smaller than 10MB.');
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024) {
        setFile(file);
        onFileUploaded(file);
      } else {
        alert('Please upload a PDF file smaller than 10MB.');
      }
    }
  };

  return (
    <div
      className={`file-upload ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      {file ? (
        <div>
          <p>File Uploaded: {file.name}</p>
        </div>
      ) : (
        <>
          <input type="file" accept=".pdf" onChange={handleInputChange} style={{ display: 'none' }} id="file-upload" />
          <label htmlFor="file-upload" className="upload-button">
            Upload PDF
          </label>
          <p>Drag and drop a PDF file here, or click to select a file.</p>
        </>
      )}
    </div>
  );
};

export default FileUpload;
