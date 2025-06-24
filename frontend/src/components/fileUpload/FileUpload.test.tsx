import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileUpload } from './index';
import * as sessionApi from '../../api/sessionApi';
import * as fileApi from '../../api/fileApi';

// Mock APIs to prevent real fetch calls
jest.mock('../../api/sessionApi');
jest.mock('../../api/fileApi');
const mockedSessionApi = sessionApi.SessionApi as jest.Mocked<typeof sessionApi.SessionApi>;
const mockedFileApi = fileApi.FileApi as jest.Mocked<typeof fileApi.FileApi>;

describe('FileUpload Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock SessionApi methods
    mockedSessionApi.generateUUID.mockResolvedValue({
      status: 'success',
      uuid: 'test-uuid',
      message: 'ok',
    });

    mockedSessionApi.validateUUID.mockResolvedValue({
      status: 'success',
      uuid: 'test-uuid',
      message: 'ok',
    });

    // Mock FileApi methods with progress simulation
    mockedFileApi.uploadFile.mockImplementation((file, sessionUUID, onProgress) => {
      // Simulate progress updates if callback provided
      if (onProgress) {
        setTimeout(() => onProgress(50), 10); // 50% progress
        setTimeout(() => onProgress(100), 20); // 100% progress
      }

      return Promise.resolve({
        status: 'success',
        message: 'File uploaded successfully',
        files: [{ name: file.name, url: `https://s3.com/${file.name}`, size: file.size }],
      });
    });

    mockedFileApi.deleteFile.mockResolvedValue({
      status: 'success',
      message: 'File deleted successfully',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const setup = (onFileUploaded = jest.fn(), onDone = jest.fn(), sessionUUID = 'test-uuid') => {
    render(
      <FileUpload onFileUploaded={onFileUploaded} onDone={onDone} sessionUUID={sessionUUID} />
    );
  };

  it('should only allow PDF files', async () => {
    setup();
    const fileInput = screen.getByTestId('file-input');
    const nonPdfFile = new File(['dummy'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [nonPdfFile] } });

    expect(await screen.findByText(/unsupported file type/i)).toBeInTheDocument();
  });

  it('should not allow more than 3 files', async () => {
    setup();
    const fileInput = screen.getByTestId('file-input');

    // Create 4 PDF files
    const files = Array(4)
      .fill(null)
      .map((_, i) => new File(['dummy'], `test${i}.pdf`, { type: 'application/pdf' }));

    fireEvent.change(fileInput, { target: { files } });
    expect(await screen.findByText(/only upload up to 3 files/i)).toBeInTheDocument();
  });

  it('should limit file size', async () => {
    setup();
    const fileInput = screen.getByTestId('file-input');

    // Create a file that exceeds the 5MB limit
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    expect(await screen.findByText(/file too large/i)).toBeInTheDocument();
  });

  it('should show progress bar per file during upload', async () => {
    setup();
    const fileInput = screen.getByTestId('file-input');
    const pdfFile = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    // Verify progress bar appears
    await waitFor(() => {
      expect(screen.getByText(/test.pdf/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('should show error and allow retry on upload failure', async () => {
    // Mock FileApi to fail once then succeed on retry
    mockedFileApi.uploadFile.mockRejectedValueOnce(new Error('Network error'));

    setup();
    const fileInput = screen.getByTestId('file-input');
    const pdfFile = new File(['dummy'], 'fail.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    // Error should appear
    await waitFor(() => expect(screen.getByText(/network error/i)).toBeInTheDocument());

    // Retry button should be present
    const retryButton = await screen.findByLabelText(/retry upload for fail.pdf/i);
    expect(retryButton).toBeInTheDocument();

    // Click retry and verify upload gets called again
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockedFileApi.uploadFile).toHaveBeenCalledTimes(2);
    });
  });

  it('should be accessible to screen readers', async () => {
    setup();
    const fileInput = screen.getByTestId('file-input');
    const nonPdfFile = new File(['dummy'], 'test.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [nonPdfFile] } });

    const error = await screen.findByRole('alert');
    expect(error).toHaveTextContent(/unsupported file type/i);
  });

  it('should disable Done & Continue until at least one file is uploaded', async () => {
    setup();

    // Initially, no Done button
    expect(screen.queryByText(/done & continue/i)).not.toBeInTheDocument();

    // Upload a file
    const fileInput = screen.getByTestId('file-input');
    const pdfFile = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    // Wait for upload to complete
    await waitFor(() => {
      expect(mockedFileApi.uploadFile).toHaveBeenCalled();
    });

    // Done button should appear
    await waitFor(() => {
      expect(screen.getByText(/done & continue/i)).toBeInTheDocument();
    });
  });

  it('should call onDone when Done & Continue is clicked', async () => {
    const onDone = jest.fn();
    setup(jest.fn(), onDone);

    // Upload a file
    const fileInput = screen.getByTestId('file-input');
    const pdfFile = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    // Wait for upload to complete
    await waitFor(() => {
      expect(mockedFileApi.uploadFile).toHaveBeenCalled();
    });

    // Done button should appear and be clickable
    const doneButton = await screen.findByText(/done & continue/i);
    fireEvent.click(doneButton);

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
