import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUpload from './FileUpload';
import * as sessionApi from '../api/sessionApi';
import * as fileApi from '../api/fileApi';

// Mock APIs to prevent real fetch calls
jest.mock('../api/sessionApi');
jest.mock('../api/fileApi');
const mockedSessionApi = sessionApi.SessionApi as jest.Mocked<typeof sessionApi.SessionApi>;
const mockedFileApi = fileApi.FileApi as jest.Mocked<typeof fileApi.FileApi>;

// Define a simple mock function for progress tracking
// const mockProgressCallback = jest.fn();

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

    // Mock FileApi methods
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
    const files = [1, 2, 3, 4].map(
      i => new File(['dummy'], `file${i}.pdf`, { type: 'application/pdf' })
    );
    fireEvent.change(fileInput, { target: { files } });
    expect(await screen.findByText(/only upload up to 3 files/i)).toBeInTheDocument();
  });

  it('should not allow files larger than 5MB', async () => {
    setup();
    const fileInput = screen.getByTestId('file-input');
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.pdf', {
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
    // Simulate progress event
    await waitFor(() => {
      expect(screen.getByText(/test.pdf/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('should show upload success and allow removal after upload', async () => {
    setup();
    const fileInput = screen.getByTestId('file-input');
    const pdfFile = new File(['dummy'], 'success.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    await waitFor(() => expect(screen.getByLabelText('Uploaded')).toBeInTheDocument());
    // Remove button should be present
    expect(screen.getByLabelText(/remove success.pdf/i)).toBeInTheDocument();
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
    expect(screen.getByLabelText(/retry upload for fail.pdf/i)).toBeInTheDocument();

    // Click retry and verify upload gets called again
    fireEvent.click(screen.getByLabelText(/retry upload for fail.pdf/i));
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
    const doneBtn = screen.queryByText(/done & continue/i);
    if (doneBtn) expect(doneBtn).toBeDisabled();
    const fileInput = screen.getByTestId('file-input');
    const pdfFile = new File(['dummy'], 'done.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    await waitFor(() => expect(screen.getByLabelText('Uploaded')).toBeInTheDocument());
    const doneBtnAfter = screen.getByText(/done & continue/i);
    expect(doneBtnAfter).not.toBeDisabled();
  });

  it('should call onFileUploaded after upload', async () => {
    const onFileUploaded = jest.fn();
    setup(onFileUploaded);
    const fileInput = screen.getByTestId('file-input');
    const pdfFile = new File(['dummy'], 'cb.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    await waitFor(() => expect(onFileUploaded).toHaveBeenCalledWith(pdfFile));
  });
});
