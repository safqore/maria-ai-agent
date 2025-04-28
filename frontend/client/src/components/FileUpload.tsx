import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onFileUploaded: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      const validFiles = selectedFiles.filter(file => file.size <= 5 * 1024 * 1024); // Limit file size to 5 MB

      if (validFiles.length + files.length > 3) {
        alert('You can only upload up to 3 files.');
        return;
      }

      setFiles(prevFiles => [...prevFiles, ...validFiles]);
      validFiles.forEach(uploadFile);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/upload', { // Replace '/upload' with your actual endpoint
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log(`File ${file.name} uploaded successfully`);
        onFileUploaded(file);
      } else {
        console.error(`File ${file.name} upload failed`);
        alert(`There was an error uploading ${file.name}. Please try again.`);
      }
    } catch (error) {
      console.error(`Error during file upload for ${file.name}:`, error);
      alert(`There was an error uploading ${file.name}. Please try again.`);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="button-container"> {/* Added button-container */}
      <button className="chat-button" onClick={handleClick}> {/* Added chat-button */}
        Upload Files
      </button>
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        multiple
      />
      <div className="uploaded-files">
        {files.map((file, index) => (
          <div key={index} className="uploaded-file">
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileUpload;
