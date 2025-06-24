import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatControls from '../ChatControls';

describe('ChatControls', () => {
  const mockOnInputChange = jest.fn();
  const mockOnSendMessage = jest.fn();
  const mockOnButtonClick = jest.fn();

  const mockButtons = [
    { text: 'Yes', value: 'YES_CLICKED' },
    { text: 'No', value: 'NO_CLICKED' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input field and send button', () => {
    render(
      <ChatControls
        userInput="Hello"
        isInputDisabled={false}
        onInputChange={mockOnInputChange}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('disables input and button when isInputDisabled is true', () => {
    render(
      <ChatControls
        userInput="Hello"
        isInputDisabled={true}
        onInputChange={mockOnInputChange}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(screen.getByPlaceholderText('Type your message here...')).toBeDisabled();
    expect(screen.getByText('Send')).toBeDisabled();
  });

  it('renders buttons when provided', () => {
    render(
      <ChatControls
        userInput="Hello"
        isInputDisabled={false}
        onInputChange={mockOnInputChange}
        onSendMessage={mockOnSendMessage}
        buttons={mockButtons}
        onButtonClick={mockOnButtonClick}
      />
    );

    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('calls onInputChange when input changes', () => {
    render(
      <ChatControls
        userInput="Hello"
        isInputDisabled={false}
        onInputChange={mockOnInputChange}
        onSendMessage={mockOnSendMessage}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Type your message here...'), {
      target: { value: 'New message' },
    });

    expect(mockOnInputChange).toHaveBeenCalled();
  });

  it('calls onSendMessage when send button is clicked', () => {
    render(
      <ChatControls
        userInput="Hello"
        isInputDisabled={false}
        onInputChange={mockOnInputChange}
        onSendMessage={mockOnSendMessage}
      />
    );

    fireEvent.click(screen.getByText('Send'));

    expect(mockOnSendMessage).toHaveBeenCalled();
  });

  it('calls onSendMessage when Enter key is pressed', () => {
    render(
      <ChatControls
        userInput="Hello"
        isInputDisabled={false}
        onInputChange={mockOnInputChange}
        onSendMessage={mockOnSendMessage}
      />
    );

    fireEvent.keyDown(screen.getByPlaceholderText('Type your message here...'), {
      key: 'Enter',
      code: 'Enter',
    });

    expect(mockOnSendMessage).toHaveBeenCalled();
  });
});
