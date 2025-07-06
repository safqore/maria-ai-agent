import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatActions from '../ChatActions';

// Mock the FileUpload component
jest.mock('../../fileUpload/FileUpload', () => {
  const MockFileUpload = () => <div data-testid="mock-file-upload">Mock File Upload</div>;
  MockFileUpload.displayName = 'MockFileUpload';
  return MockFileUpload;
});

describe('ChatActions', () => {
  const mockSessionUUID = '12345-67890';
  const mockOnFileUploaded = jest.fn();
  const mockOnDone = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders file upload component when type is fileUpload', () => {
    render(
      <ChatActions
        type="fileUpload"
        sessionUUID={mockSessionUUID}
        onFileUploaded={mockOnFileUploaded}
        onDone={mockOnDone}
      />
    );

    expect(screen.getByTestId('mock-file-upload')).toBeInTheDocument();
  });

  it('renders survey placeholder when type is survey', () => {
    render(<ChatActions type="survey" sessionUUID={mockSessionUUID} />);

    expect(screen.getByText('Survey would go here')).toBeInTheDocument();
  });

  it('renders feedback placeholder when type is feedback', () => {
    render(<ChatActions type="feedback" sessionUUID={mockSessionUUID} />);

    expect(screen.getByText('Feedback form would go here')).toBeInTheDocument();
  });

  it('renders nothing when type is invalid', () => {
    // Use proper typing with type assertion for testing invalid cases
    const { container } = render(
      <ChatActions type={'invalid' as any} sessionUUID={mockSessionUUID} />
    );

    expect(container.firstChild).toBeNull();
  });
});
