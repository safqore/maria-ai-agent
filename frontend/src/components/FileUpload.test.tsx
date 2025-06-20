import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUpload from './FileUpload';

// Improved Mock XMLHttpRequest for test isolation
class MockXHR {
  upload = { onprogress: null as null | ((e: any) => void) };
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;
  status: number;
  response: string;
  open = jest.fn();
  send = jest.fn(function (this: MockXHR) {
    // Simulate progress event if needed
    if (this.upload.onprogress) {
      this.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
    }
    setTimeout(() => {
      if (this.status === 200 && this.onload) this.onload();
      if (this.status !== 200 && this.onerror) this.onerror();
    }, 10);
  });
  constructor(status?: number, response?: string) {
    // Use static nextStatus if set, then reset it
    this.status = (MockXHR as any).nextStatus ?? 200;
    (MockXHR as any).nextStatus = undefined;
    this.response = response ?? JSON.stringify({ files: [{ url: 'https://s3.com/file.pdf' }] });
  }
}

describe('FileUpload Component', () => {
  let originalXHR: any;
  beforeEach(() => {
    originalXHR = global.XMLHttpRequest;
    global.XMLHttpRequest = MockXHR as any;
  });
  afterEach(() => {
    global.XMLHttpRequest = originalXHR;
    jest.clearAllMocks();
  });

  const setup = (onFileUploaded = jest.fn(), onDone = jest.fn(), sessionUUID = 'test-uuid') => {
    render(<FileUpload onFileUploaded={onFileUploaded} onDone={onDone} sessionUUID={sessionUUID} />);
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
    const files = [1, 2, 3, 4].map(i => new File(['dummy'], `file${i}.pdf`, { type: 'application/pdf' }));
    fireEvent.change(fileInput, { target: { files } });
    expect(await screen.findByText(/only upload up to 3 files/i)).toBeInTheDocument();
  });

  it('should not allow files larger than 5MB', async () => {
    setup();
    const fileInput = screen.getByTestId('file-input');
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
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
    // Patch the next instance to fail
    (MockXHR as any).nextStatus = 500;
    setup();
    const fileInput = screen.getByTestId('file-input');
    const pdfFile = new File(['dummy'], 'fail.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    await waitFor(() => expect(screen.getByText(/network error/i)).toBeInTheDocument());
    // Retry button should be present
    expect(screen.getByLabelText(/retry upload for fail.pdf/i)).toBeInTheDocument();
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
