import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileStatusItem, { FileStatus } from './FileStatusItem';

describe('FileStatusItem Component', () => {
  const createMockFile = (name = 'test.pdf'): File => {
    return new File(['dummy'], name, { type: 'application/pdf' });
  };

  const createMockFileStatus = (
    status: 'queued' | 'uploading' | 'uploaded' | 'error' = 'queued',
    progress = 0,
    error?: string
  ): FileStatus => {
    return {
      file: createMockFile(),
      status,
      progress,
      error,
    };
  };

  it('should display file name and size', () => {
    const file = createMockFile();
    const fileStatus = { file, status: 'queued' as const, progress: 0 };
    const onRetry = jest.fn();
    const onRemove = jest.fn();

    render(<FileStatusItem fileStatus={fileStatus} onRetry={onRetry} onRemove={onRemove} />);

    // Check if file name is displayed
    expect(screen.getByText(/test.pdf/i)).toBeInTheDocument();
    // Check if size is displayed (file size is very small in this mock)
    expect(screen.getByText(/0.00 MB/i)).toBeInTheDocument();
  });

  it('should show progress bar when uploading', () => {
    const fileStatus = createMockFileStatus('uploading', 50);
    const onRetry = jest.fn();
    const onRemove = jest.fn();

    render(<FileStatusItem fileStatus={fileStatus} onRetry={onRetry} onRemove={onRemove} />);

    // Check if progress bar is shown
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();

    // Check if progress value is displayed
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should show success icon when uploaded', () => {
    const fileStatus = createMockFileStatus('uploaded', 100);
    const onRetry = jest.fn();
    const onRemove = jest.fn();

    render(<FileStatusItem fileStatus={fileStatus} onRetry={onRetry} onRemove={onRemove} />);

    // Check if success icon/message is shown
    const uploadedStatus = screen.getByLabelText('Uploaded');
    expect(uploadedStatus).toBeInTheDocument();
    expect(uploadedStatus).toHaveTextContent('✅');
  });

  it('should show error message and retry button when error', () => {
    const fileStatus = createMockFileStatus('error', 0, 'Upload failed');
    const onRetry = jest.fn();
    const onRemove = jest.fn();

    render(<FileStatusItem fileStatus={fileStatus} onRetry={onRetry} onRemove={onRemove} />);

    // Check if error message is shown
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('❌ Upload failed');

    // Check if retry button is shown
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', () => {
    const file = createMockFile();
    const fileStatus = { file, status: 'error' as const, progress: 0, error: 'Upload failed' };
    const onRetry = jest.fn();
    const onRemove = jest.fn();

    render(<FileStatusItem fileStatus={fileStatus} onRetry={onRetry} onRemove={onRemove} />);

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    // Check if onRetry was called with the file
    expect(onRetry).toHaveBeenCalledWith(file);
  });

  it('should call onRemove when remove button is clicked', () => {
    const file = createMockFile();
    const fileStatus = { file, status: 'uploaded' as const, progress: 100 };
    const onRetry = jest.fn();
    const onRemove = jest.fn();

    render(<FileStatusItem fileStatus={fileStatus} onRetry={onRetry} onRemove={onRemove} />);

    // Click remove button
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    // Check if onRemove was called with the file
    expect(onRemove).toHaveBeenCalledWith(file);
  });
});
