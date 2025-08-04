import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatMessage from '../ChatMessage';
// import { ChatButton } from '../../contexts/ChatContext';

describe('ChatMessage', () => {
  test('renders user message correctly', () => {
    const message = {
      text: 'Hello, this is a test',
      isUser: true,
      isTyping: false,
      id: 1,
    };

    render(<ChatMessage message={message} />);

    expect(screen.getByText('Hello, this is a test')).toBeInTheDocument();
    expect(screen.getByText('Hello, this is a test').parentNode?.parentNode).toHaveClass(
      'user-message'
    );
    expect(screen.getByText('Hello, this is a test').parentNode).not.toHaveClass('typing');
  });

  test('renders bot message correctly', () => {
    const message = {
      text: 'I am an AI assistant',
      isUser: false,
      isTyping: false,
      id: 2,
    };

    render(<ChatMessage message={message} />);

    expect(screen.getByText('I am an AI assistant')).toBeInTheDocument();
    expect(screen.getByText('I am an AI assistant').parentNode?.parentNode).toHaveClass(
      'bot-message'
    );
  });

  test('renders typing animation for bot messages', () => {
    const message = {
      text: 'I am typing...',
      isUser: false,
      isTyping: true,
      id: 3,
    };

    render(<ChatMessage message={message} />);

    expect(screen.getByText('I am typing...')).toBeInTheDocument();
    expect(screen.getByText('I am typing...').parentNode).toHaveClass('typing');
  });

  test('renders message buttons when provided', () => {
    const message = {
      text: 'Please choose an option:',
      isUser: false,
      isTyping: false,
      id: 4,
      buttons: [
        { text: 'Option 1', value: 'opt1' },
        { text: 'Option 2', value: 'opt2' },
      ],
    };

    render(<ChatMessage message={message} />);

    expect(screen.getByText('Please choose an option:')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();

    // Check data attributes
    expect(screen.getByText('Option 1')).toHaveAttribute('data-value', 'opt1');
    expect(screen.getByText('Option 2')).toHaveAttribute('data-value', 'opt2');
  });

  test('calls onTypingComplete callback when typing finishes', async () => {
    const onTypingComplete = jest.fn();
    const message = {
      text: 'I am typing...',
      isUser: false,
      isTyping: true,
      id: 5,
    };

    render(<ChatMessage message={message} onTypingComplete={onTypingComplete} />);

    await waitFor(
      () => {
        expect(onTypingComplete).toHaveBeenCalledWith(5);
      },
      { timeout: 1500 }
    );
  });

  test('avoids re-rendering when props have not changed', () => {
    // Create a test message
    const message = {
      text: 'Test message',
      isUser: false,
      isTyping: false,
      id: 6,
    };

    // Create a spy on React.createElement to count renders
    const createElementSpy = jest.spyOn(React, 'createElement');

    // Initial render
    const { rerender } = render(<ChatMessage message={message} />);

    const initialRenderCount = createElementSpy.mock.calls.length;

    // Re-render with same props
    rerender(<ChatMessage message={message} />);

    // Should have same number of createElement calls (no extra renders)
    expect(createElementSpy.mock.calls.length).toBe(initialRenderCount);

    // Clean up
    createElementSpy.mockRestore();
  });
});
