import React from 'react';
import FileStatusItem, { FileStatus } from './FileStatusItem';

/**
 * Props for the FileStatusList component
 */
interface FileStatusListProps {
  /** Array of file status objects */
  files: FileStatus[];
  /** Function called to retry a failed upload */
  onRetry: (file: File) => void;
  /** Function called to remove a file */
  onRemove: (file: File) => void;
}

/**
 * Component that displays a list of file upload statuses
 */
export const FileStatusList: React.FC<FileStatusListProps> = ({ files, onRetry, onRemove }) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="uploaded-files">
      {files.map((fileStatus, index) => (
        <FileStatusItem key={index} fileStatus={fileStatus} onRetry={onRetry} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default FileStatusList;
