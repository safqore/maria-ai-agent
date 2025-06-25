import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatMessages from '../ChatMessages';
import { Message } from '../../../utils/chatUtils';

// Mock scrollIntoView to avoid JSDOM errors
const mockScrollIntoView = jest.fn();

// Test messages
const mockMessages: Message[] = [
  { id: 0, text: 'Hello', isUser: false, isTyping: false },
  { id: 1, text: 'Hi there', isUser: true, isTyping: false },
];

// Mock typing messages
const mockTypingMessages: Message[] = [
  { id: 0, text: 'Hello', isUser: false, isTyping: false },
  { id: 1, text: 'Typing...', isUser: false, isTyping: true },
];

// Mock the ChatContext
jest.mock('../../../contexts/ChatContext', () => ({
  useChat: () => ({
    state: {
      messages: mockMessages,
      isButtonGroupVisible: true,
    },
  }),
}));

// Mock handlers
const mockOnTypingComplete = jest.fn();
const mockOnButtonClick = jest.fn();

describe('ChatMessages', () => {
  // Set up and tear down the mock for scrollIntoView
  beforeEach(() => {
    // Save the original implementation if it exists
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;

    // Mock scrollIntoView for all elements
    window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    // Clear mock calls between tests
    mockScrollIntoView.mockClear();
    mockOnTypingComplete.mockClear();
    mockOnButtonClick.mockClear();
  });

  afterEach(() => {
    // Clean up - restore the original implementation
    window.HTMLElement.prototype.scrollIntoView = undefined as any;
    jest.clearAllMocks();
  });

  it('renders messages correctly', () => {
    render(
      <ChatMessages 
        onTypingComplete={mockOnTypingComplete} 
        onButtonClick={mockOnButtonClick}
      />
    );

    expect(screen.getByTestId('message-0')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
    // scrollIntoView should be called when messages are rendered
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('applies correct CSS classes for user and bot messages', () => {
    const { container } = render(
      <ChatMessages 
        onTypingComplete={mockOnTypingComplete} 
        onButtonClick={mockOnButtonClick}
      />
    );

    const userMessageDiv = container.querySelector('.user-message');
    const botMessageDiv = container.querySelector('.bot-message');

    expect(userMessageDiv).toBeInTheDocument();
    expect(botMessageDiv).toBeInTheDocument();
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  // Test with typing messages
  it('handles typing messages correctly', () => {
    // Override the mock to include typing messages
    jest.resetModules();
    jest.mock('../../../contexts/ChatContext', () => ({
      useChat: () => ({
        state: {
          messages: mockTypingMessages,
          isButtonGroupVisible: true,
        },
      }),
    }));

    render(
      <ChatMessages 
        onTypingComplete={mockOnTypingComplete} 
        onButtonClick={mockOnButtonClick}
      />
    );

    // The scroll should happen for typing messages too
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});
