import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatMessages from '../ChatMessages';
import { Message } from '../../../utils/chatUtils';

// Mock scrollIntoView to avoid JSDOM errors
const mockScrollIntoView = jest.fn();

describe('ChatMessages', () => {
  const mockMessages: Message[] = [
    { id: 0, text: 'Hello', isUser: false, isTyping: false },
    { id: 1, text: 'Hi there', isUser: true, isTyping: false },
  ];

  const mockTypingMessages: Message[] = [
    { id: 0, text: 'Hello', isUser: false, isTyping: false },
    { id: 1, text: 'Typing...', isUser: false, isTyping: true },
  ];

  const mockOnTypingComplete = jest.fn();

  // Set up and tear down the mock for scrollIntoView
  beforeEach(() => {
    // Save the original implementation if it exists
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;

    // Mock scrollIntoView for all elements
    window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    // Clear mock calls between tests
    mockScrollIntoView.mockClear();
  });

  afterEach(() => {
    // Clean up - restore the original implementation
    window.HTMLElement.prototype.scrollIntoView = undefined as any;
    jest.clearAllMocks();
  });

  it('renders messages correctly', () => {
    render(<ChatMessages messages={mockMessages} onTypingComplete={mockOnTypingComplete} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
    // scrollIntoView should be called when messages are rendered
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('renders typing effect for typing messages', () => {
    render(<ChatMessages messages={mockTypingMessages} onTypingComplete={mockOnTypingComplete} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    // The typing effect component will be rendered
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('applies correct CSS classes for user and bot messages', () => {
    const { container } = render(
      <ChatMessages messages={mockMessages} onTypingComplete={mockOnTypingComplete} />
    );

    const userMessageDiv = container.querySelector('.user-message');
    const botMessageDiv = container.querySelector('.bot-message');

    expect(userMessageDiv).toBeInTheDocument();
    expect(botMessageDiv).toBeInTheDocument();
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});
