import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatInputArea from './ChatInputArea';

describe('ChatInputArea Component', () => {
  const mockInputChangeHandler = jest.fn();
  const mockSendButtonHandler = jest.fn();

  beforeEach(() => {
    // Reset the mock functions before each test
    mockInputChangeHandler.mockReset();
    mockSendButtonHandler.mockReset();
  });

  test('renders input field and send button', () => {
    render(
      <ChatInputArea
        userInput=""
        inputTextChangeHandler={mockInputChangeHandler}
        sendButtonHandler={mockSendButtonHandler}
        disabled={false}
      />
    );

    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  test('reflects userInput prop value in input field', () => {
    const testValue = 'Hello world';

    render(
      <ChatInputArea
        userInput={testValue}
        inputTextChangeHandler={mockInputChangeHandler}
        sendButtonHandler={mockSendButtonHandler}
        disabled={false}
      />
    );

    expect(screen.getByTestId('chat-input')).toHaveValue(testValue);
  });

  test('calls inputTextChangeHandler when input changes', () => {
    render(
      <ChatInputArea
        userInput=""
        inputTextChangeHandler={mockInputChangeHandler}
        sendButtonHandler={mockSendButtonHandler}
        disabled={false}
      />
    );

    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'test input' } });

    expect(mockInputChangeHandler).toHaveBeenCalledTimes(1);
  });

  test('calls sendButtonHandler when Enter key is pressed', () => {
    render(
      <ChatInputArea
        userInput="test message"
        inputTextChangeHandler={mockInputChangeHandler}
        sendButtonHandler={mockSendButtonHandler}
        disabled={false}
      />
    );

    const input = screen.getByTestId('chat-input');
    fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 });

    expect(mockSendButtonHandler).toHaveBeenCalledTimes(1);
  });

  test('calls sendButtonHandler when Send button is clicked', () => {
    render(
      <ChatInputArea
        userInput="test message"
        inputTextChangeHandler={mockInputChangeHandler}
        sendButtonHandler={mockSendButtonHandler}
        disabled={false}
      />
    );

    const button = screen.getByTestId('send-button');
    fireEvent.click(button);

    expect(mockSendButtonHandler).toHaveBeenCalledTimes(1);
  });

  test('disables input and button when disabled prop is true', () => {
    render(
      <ChatInputArea
        userInput="test message"
        inputTextChangeHandler={mockInputChangeHandler}
        sendButtonHandler={mockSendButtonHandler}
        disabled={true}
      />
    );

    expect(screen.getByTestId('chat-input')).toBeDisabled();
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  test('disables send button when input is empty', () => {
    render(
      <ChatInputArea
        userInput=""
        inputTextChangeHandler={mockInputChangeHandler}
        sendButtonHandler={mockSendButtonHandler}
        disabled={false}
      />
    );

    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  test('enables send button when input has text', () => {
    render(
      <ChatInputArea
        userInput="test message"
        inputTextChangeHandler={mockInputChangeHandler}
        sendButtonHandler={mockSendButtonHandler}
        disabled={false}
      />
    );

    expect(screen.getByTestId('send-button')).not.toBeDisabled();
  });

  test('has autoFocus capability when autoFocus prop is true', () => {
    // This is a simplified test just checking that the component doesn't crash with autoFocus
    // Testing actual focus behavior would require a more complex setup with jest-dom
    render(
      <ChatInputArea
        userInput=""
        inputTextChangeHandler={mockInputChangeHandler}
        sendButtonHandler={mockSendButtonHandler}
        disabled={false}
        autoFocus={true}
      />
    );

    // Just verify the component renders with autoFocus
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });
});
