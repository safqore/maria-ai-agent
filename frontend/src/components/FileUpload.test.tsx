import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUpload from './FileUpload';

// Mock XMLHttpRequest for upload progress and result
class MockXHR {
  static instances: MockXHR[] = [];
  upload = { onprogress: jest.fn() };
  onload: any = null;
  onerror: any = null;
  status = 200;
  response = JSON.stringify({ files: [{ url: 'https://s3.com/file.pdf' }] });
  open = jest.fn();
  send = jest.fn(function (this: MockXHR) {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 10);
  });
}

global.XMLHttpRequest = MockXHR as any;

describe('FileUpload Component', () => {
  const setup = (onFileUploaded = jest.fn()) => {
    render(<FileUpload onFileUploaded={onFileUploaded} />);
  };

  it('should only allow PDF files', async () => {
    setup();
    const fileInput = screen.getByLabelText(/upload files/i);
    const nonPdfFile = new File(['dummy'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [nonPdfFile] } });
    expect(await screen.findByText(/unsupported file type/i)).toBeInTheDocument();
  });

  it('should not allow more than 3 files', async () => {
    setup();
    const fileInput = screen.getByLabelText(/upload files/i);
    const files = [1, 2, 3, 4].map(i => new File(['dummy'], `file${i}.pdf`, { type: 'application/pdf' }));
    fireEvent.change(fileInput, { target: { files } });
    expect(await screen.findByText(/only upload up to 3 files/i)).toBeInTheDocument();
  });

  it('should not allow files larger than 5MB', async () => {
    setup();
    const fileInput = screen.getByLabelText(/upload files/i);
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    expect(await screen.findByText(/file too large/i)).toBeInTheDocument();
  });

  it('should show progress bar per file during upload', async () => {
    setup();
    const fileInput = screen.getByLabelText(/upload files/i);
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
    const fileInput = screen.getByLabelText(/upload files/i);
    const pdfFile = new File(['dummy'], 'success.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    await waitFor(() => expect(screen.getByLabelText('Uploaded')).toBeInTheDocument());
    // Remove button should be present
    expect(screen.getByLabelText(/remove success.pdf/i)).toBeInTheDocument();
  });

  it('should show error and allow retry on upload failure', async () => {
    // Mock XHR to fail
    (MockXHR.prototype as any).status = 500;
    setup();
    const fileInput = screen.getByLabelText(/upload files/i);
    const pdfFile = new File(['dummy'], 'fail.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    await waitFor(() => expect(screen.getByText(/failed to upload/i)).toBeInTheDocument());
    // Retry button should be present
    expect(screen.getByLabelText(/retry upload for fail.pdf/i)).toBeInTheDocument();
    // Reset for other tests
    (MockXHR.prototype as any).status = 200;
  });

  it('should be accessible to screen readers', async () => {
    setup();
    const fileInput = screen.getByLabelText(/upload files/i);
    const nonPdfFile = new File(['dummy'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [nonPdfFile] } });
    const error = await screen.findByRole('alert');
    expect(error).toHaveTextContent(/unsupported file type/i);
  });

  it('should disable Done & Continue until at least one file is uploaded', async () => {
    setup();
    const doneBtn = screen.getByText(/done & continue/i);
    expect(doneBtn).toBeDisabled();
    const fileInput = screen.getByLabelText(/upload files/i);
    const pdfFile = new File(['dummy'], 'done.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    await waitFor(() => expect(screen.getByLabelText('Uploaded')).toBeInTheDocument());
    expect(doneBtn).not.toBeDisabled();
  });

  it('should call onFileUploaded after upload', async () => {
    const onFileUploaded = jest.fn();
    setup(onFileUploaded);
    const fileInput = screen.getByLabelText(/upload files/i);
    const pdfFile = new File(['dummy'], 'cb.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    await waitFor(() => expect(onFileUploaded).toHaveBeenCalledWith(pdfFile));
  });
});
