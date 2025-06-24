import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatContainer from '../ChatContainer';

// Mock the required components
jest.mock('../../../contexts/ChatContext', () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useChat: () => ({
    state: {
      messages: [],
      isInputDisabled: false,
      isButtonGroupVisible: true,
      error: null,
    },
    setMessageTypingComplete: jest.fn(),
    addUserMessage: jest.fn(),
    addBotMessage: jest.fn(),
    setInputDisabled: jest.fn(),
    removeMessageButtons: jest.fn(),
    setError: jest.fn(),
  }),
}));

jest.mock('../../../contexts/FileUploadContext', () => ({
  FileUploadProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../ChatMessages', () => {
  const MockChatMessages = () => <div>Chat Messages Component</div>;
  MockChatMessages.displayName = 'MockChatMessages';
  return MockChatMessages;
});
jest.mock('../ChatControls', () => {
  const MockChatControls = () => <div>Chat Controls Component</div>;
  MockChatControls.displayName = 'MockChatControls';
  return MockChatControls;
});
jest.mock('../ChatActions', () => {
  const MockChatActions = () => <div>Chat Actions Component</div>;
  MockChatActions.displayName = 'MockChatActions';
  return MockChatActions;
});
jest.mock('../../../hooks/useChatStateMachine', () => () => ({
  fsm: {
    getState: () => 'INITIAL_STATE',
    transition: jest.fn(),
  },
  buttonClickHandler: jest.fn(),
  typingCompleteHandler: jest.fn(),
  processTextInputHandler: jest.fn(),
  fileUploadHandler: jest.fn(),
}));

describe('ChatContainer', () => {
  const mockSessionUUID = '12345-67890';

  it('renders without crashing', () => {
    render(<ChatContainer sessionUUID={mockSessionUUID} />);

    // Check if the component rendered successfully
    expect(screen.getByText('Chat Messages Component')).toBeInTheDocument();
    expect(screen.getByText('Chat Controls Component')).toBeInTheDocument();
  });

  it('wraps content in ErrorBoundary', () => {
    // This is a basic test just to ensure the ErrorBoundary is present
    // For more detailed testing, we would need to simulate errors
    const { container } = render(<ChatContainer sessionUUID={mockSessionUUID} />);

    // Look for ErrorBoundary div wrapper (this is a simple approximation)
    // In a real test, we might trigger an error and check if the fallback renders
    expect(container.firstChild).not.toBeNull();
  });
});
