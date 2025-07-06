import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUploadButton from './FileUploadButton';

describe('FileUploadButton Component', () => {
  it('should render a button with correct label', () => {
    const onSelectFiles = jest.fn();
    render(<FileUploadButton onSelectFiles={onSelectFiles} />);

    const button = screen.getByRole('button', { name: /upload files/i });
    expect(button).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const onSelectFiles = jest.fn();
    render(<FileUploadButton onSelectFiles={onSelectFiles} disabled={true} />);

    const button = screen.getByRole('button', { name: /upload files/i });
    expect(button).toBeDisabled();
  });

  it('should open file dialog when clicked', () => {
    const onSelectFiles = jest.fn();
    render(<FileUploadButton onSelectFiles={onSelectFiles} />);

    // Get the file input and button
    const fileInput = screen.getByTestId('file-input');
    const button = screen.getByRole('button', { name: /upload files/i });

    // Mock the click method of the file input
    const clickSpy = jest.spyOn(fileInput, 'click');

    // Click the button
    fireEvent.click(button);

    // Verify file input click was called
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onSelectFiles when files are selected', () => {
    const onSelectFiles = jest.fn();
    render(<FileUploadButton onSelectFiles={onSelectFiles} />);

    // Get the file input
    const fileInput = screen.getByTestId('file-input');

    // Create dummy files
    const dummyFiles = [new File(['dummy content'], 'test.pdf', { type: 'application/pdf' })];

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: dummyFiles } });

    // Verify onSelectFiles was called with the files
    expect(onSelectFiles).toHaveBeenCalledWith(dummyFiles);
  });
});
