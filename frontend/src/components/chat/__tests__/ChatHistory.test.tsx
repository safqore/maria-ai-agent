import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatHistory from '../ChatHistory';
import { ChatProvider } from '../../../contexts/ChatContext';
import { FileUploadProvider } from '../../../contexts/FileUploadContext';
import { Message } from '../../../utils/chatUtils';
import { States } from '../../../state/FiniteStateMachine';

// Mock the required components
jest.mock('../../TypingEffect', () => ({ message, onTypingComplete }: { message: string, onTypingComplete: () => void }) => (
  <div data-testid="typing-effect" onClick={onTypingComplete}>{message}</div>
));

jest.mock('../../ButtonGroup', () => ({ buttons, onButtonClick }: { buttons: any[], onButtonClick: (value: string) => void }) => (
  <div data-testid="button-group" onClick={() => buttons && buttons.length > 0 && onButtonClick(buttons[0].value)}>
    {buttons ? buttons.map(b => b.text).join(',') : ''}
  </div>
));

jest.mock('../../fileUpload/FileUpload', () => {
  return function MockFileUpload({ onFileUploaded, onDone }: { onFileUploaded: (file: File) => void, onDone: () => void }) {
    return <div data-testid="file-upload" onClick={() => { 
      onFileUploaded(new File([''], 'test.txt')); 
      onDone(); 
    }}>File Upload</div>;
  }
});

// Mock the sanitizeUtils
jest.mock('../../../utils/sanitizeUtils', () => ({
  sanitizeHtml: (html: string) => html,
}));

// Setup test data
const mockMessages: Message[] = [
  { id: 0, text: 'Hello', isUser: false, isTyping: false },
  { id: 1, text: 'Hi there', isUser: true, isTyping: false },
  { id: 2, text: 'Typing message', isUser: false, isTyping: true },
];

// Mock contexts
jest.mock('../../../contexts/ChatContext', () => {
  const originalModule = jest.requireActual('../../../contexts/ChatContext');
  return {
    ...originalModule,
    useChat: () => ({
      state: {
        messages: mockMessages,
        isButtonGroupVisible: true,
      },
    }),
  };
});

jest.mock('../../../contexts/FileUploadContext', () => {
  const originalModule = jest.requireActual('../../../contexts/FileUploadContext');
  return {
    ...originalModule,
    useFileUpload: () => ({
      state: {
        files: [],
        isUploadEnabled: true,
        allComplete: false,
        error: null,
      },
    }),
  };
});

// Mock scrollIntoView
const mockScrollIntoView = jest.fn();
window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

describe('ChatHistory', () => {
  const mockProps = {
    onTypingComplete: jest.fn(),
    onButtonClick: jest.fn(),
    onFileUploaded: jest.fn(),
    onFileUploadDone: jest.fn(),
    currentState: States.WELCOME_MSG,
    sessionUUID: 'test-uuid',
  };

  beforeEach(() => {
    mockScrollIntoView.mockClear();
    mockProps.onTypingComplete.mockClear();
    mockProps.onButtonClick.mockClear();
    mockProps.onFileUploaded.mockClear();
    mockProps.onFileUploadDone.mockClear();
  });

  // Wrapper component for tests
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <ChatProvider>
        <FileUploadProvider>
          {ui}
        </FileUploadProvider>
      </ChatProvider>
    );
  };

  it('renders messages correctly', () => {
    renderWithProviders(<ChatHistory {...mockProps} />);
    
    // Messages come from mocked context
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
    expect(screen.getByTestId('typing-effect')).toBeInTheDocument();
    expect(mockScrollIntoView).toHaveBeenCalled();
  });

  it('renders buttons in USR_INIT_OPTIONS state', () => {
    renderWithProviders(<ChatHistory {...mockProps} currentState={States.USR_INIT_OPTIONS} />);
    
    expect(screen.getByText('Yes,No')).toBeInTheDocument();
  });

  it('renders buttons in ENGAGE_USR_AGAIN state', () => {
    renderWithProviders(<ChatHistory {...mockProps} currentState={States.ENGAGE_USR_AGAIN} />);
    
    expect(screen.getByText("Let's Go,Maybe next time")).toBeInTheDocument();
  });

  it('renders file upload in UPLOAD_DOCS state', () => {
    renderWithProviders(<ChatHistory {...mockProps} currentState={States.UPLOAD_DOCS} />);
    
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
  });

  it('calls handlers when interactions occur', () => {
    renderWithProviders(<ChatHistory {...mockProps} />);
    
    // Test typing complete
    screen.getByTestId('typing-effect').click();
    expect(mockProps.onTypingComplete).toHaveBeenCalledWith(2);
    
    // Test file upload in UPLOAD_DOCS state
    renderWithProviders(<ChatHistory {...mockProps} currentState={States.UPLOAD_DOCS} />);
    screen.getByTestId('file-upload').click();
    expect(mockProps.onFileUploaded).toHaveBeenCalled();
    expect(mockProps.onFileUploadDone).toHaveBeenCalled();
  });

  it('handles button clicks correctly', () => {
    renderWithProviders(<ChatHistory {...mockProps} currentState={States.USR_INIT_OPTIONS} />);
    
    fireEvent.click(screen.getByTestId('button-group'));
    expect(mockProps.onButtonClick).toHaveBeenCalled();
  });
});
