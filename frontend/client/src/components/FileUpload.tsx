import React, { useEffect, useRef, useState } from 'react';
import Uppy, { UppyFile, UploadResult } from '@uppy/core';
import { Dashboard } from '@uppy/react';
import XHRUpload from '@uppy/xhr-upload';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import type { BasePlugin, Uppy as UppyType } from '@uppy/core'; // Import BasePlugin and Uppy type
import type { Meta } from '@uppy/core';

interface FileUploadProps {
  onFileUploaded: (file: File) => void;
}

// Define a type for DashboardProps that matches the Uppy version
type DashboardProps = {
  uppy: UppyType<Meta, Record<string, never>>;
  inline?: boolean;
  showProgressDetails?: boolean;
  height?: number;
  width?: string | number;
  plugins?: string[]; // Changed to string[]
  // Add other properties as needed from the Dashboard component
};

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const uppyRef = useRef<Uppy | null>(null);
  const [uppyReady, setUppyReady] = useState(false);
  const [isUppyDestroyed, setIsUppyDestroyed] = useState(false);

  useEffect(() => {
    const uppyInstance = new Uppy({
      debug: true,
      autoProceed: false,
      restrictions: {
        maxFileSize: 10 * 1024 * 1024,
        maxNumberOfFiles: 1,
        allowedFileTypes: ['application/pdf'],
      },
    });

    uppyInstance.use(XHRUpload, {
      endpoint: '/upload',
      fieldName: 'file',
    });

    uppyInstance.on('file-added', (file: UppyFile<Record<string, any>, any>) => {
      console.log('Added file', file);
    });

    uppyInstance.on('complete', (result: UploadResult<Record<string, any>, any>) => {
      console.log('Upload complete:', result);
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0].data as File;
        onFileUploaded(uploadedFile);
      } else {
        console.error('Upload failed:', result.failed);
        alert('There was an error uploading your file. Please try again.');
      }
    });

    uppyInstance.on('error', (error: any) => {
      console.error('Upload error:', error);
      alert('There was an error uploading your file. Please try again.');
    });

    uppyRef.current = uppyInstance;
    setUppyReady(true);

    return () => {
      if (uppyRef.current) {
        try {
          uppyRef.current.destroy();
          console.log('Uppy instance destroyed successfully.');
        } catch (error) {
          console.error('Error destroying Uppy instance:', error);
        } finally {
          setIsUppyDestroyed(true);
        }
      }
    };
  }, [onFileUploaded]);

  // Define the type for the props we're passing to Dashboard
  const dashboardProps: Partial<DashboardProps> = {
    inline: true,
    showProgressDetails: true,
    height: 300,
    width: '100%',
    uppy: uppyRef.current!,
    // plugins: [] // Remove this line or set it to an empty array if you don't use plugins
  };

  return uppyReady && !isUppyDestroyed ? (
    <Dashboard
      uppy={uppyRef.current!}
      {...dashboardProps}
    />
  ) : (
    <p>Loading Uppy...</p>
  );
};

export default FileUpload;
