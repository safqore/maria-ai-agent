import React, { useRef } from 'react';

/**
 * Props for the FileUploadButton component
 */
interface FileUploadButtonProps {
  /** Function called when files are selected */
  onSelectFiles: (files: FileList | null) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * Button component that triggers file selection dialog
 */
export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onSelectFiles,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle button click to open file dialog
   */
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  /**
   * Handle file selection from dialog
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSelectFiles(event.target.files);
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
        onChange={handleFileChange}
        multiple
        data-testid="file-input"
        aria-label="Upload Files"
      />
    </>
  );
};

export default FileUploadButton;
