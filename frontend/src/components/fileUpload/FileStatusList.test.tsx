import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileStatusList from './FileStatusList';
import { FileStatus } from './FileStatusItem';

// Mock the FileStatusItem component
jest.mock('./FileStatusItem', () => {
  return {
    __esModule: true,
    default: ({ fileStatus }: { fileStatus: FileStatus }) => (
      <div data-testid="file-status-item" data-status={fileStatus.status}>
        {fileStatus.file.name}
      </div>
    ),
  };
});

describe('FileStatusList Component', () => {
  const createMockFile = (name = 'test.pdf'): File => {
    return new File(['dummy'], name, { type: 'application/pdf' });
  };

  const createMockFileStatus = (
    name: string,
    status: 'queued' | 'uploading' | 'uploaded' | 'error' = 'queued'
  ): FileStatus => {
    return {
      file: createMockFile(name),
      status,
      progress: 0,
    };
  };

  it('should render nothing when files array is empty', () => {
    const onRetry = jest.fn();
    const onRemove = jest.fn();

    const { container } = render(
      <FileStatusList files={[]} onRetry={onRetry} onRemove={onRemove} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render a FileStatusItem for each file', () => {
    const files = [
      createMockFileStatus('file1.pdf', 'queued'),
      createMockFileStatus('file2.pdf', 'uploading'),
      createMockFileStatus('file3.pdf', 'uploaded'),
    ];
    const onRetry = jest.fn();
    const onRemove = jest.fn();

    render(<FileStatusList files={files} onRetry={onRetry} onRemove={onRemove} />);

    // Check if all FileStatusItems are rendered
    const fileItems = screen.getAllByTestId('file-status-item');
    expect(fileItems).toHaveLength(3);

    // Check if the file names are displayed in order
    expect(fileItems[0]).toHaveTextContent('file1.pdf');
    expect(fileItems[1]).toHaveTextContent('file2.pdf');
    expect(fileItems[2]).toHaveTextContent('file3.pdf');
  });

  it('should pass correct props to FileStatusItem', () => {
    const files = [
      createMockFileStatus('file1.pdf', 'queued'),
      createMockFileStatus('file2.pdf', 'error'),
    ];
    const onRetry = jest.fn();
    const onRemove = jest.fn();

    render(<FileStatusList files={files} onRetry={onRetry} onRemove={onRemove} />);

    // Check if the correct status is passed to each FileStatusItem
    const fileItems = screen.getAllByTestId('file-status-item');
    expect(fileItems[0]).toHaveAttribute('data-status', 'queued');
    expect(fileItems[1]).toHaveAttribute('data-status', 'error');
  });
});
