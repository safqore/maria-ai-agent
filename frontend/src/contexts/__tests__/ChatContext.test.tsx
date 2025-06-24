import React from 'react';
import { render, act } from '@testing-library/react';
import { ChatProvider, useChat } from '../../contexts/ChatContext';
import { ChatActionTypes } from '../../contexts/ChatContext';

// A test component that uses the chat context
const TestComponent: React.FC = () => {
  const {
    state,
    addUserMessage,
    addBotMessage,
    setMessageTypingComplete,
    setInputDisabled,
    setButtonGroupVisible,
    removeMessageButtons,
    setError,
    clearError,
  } = useChat();

  return (
    <div>
      <div data-testid="message-count">{state.messages.length}</div>
      <div data-testid="input-disabled">{state.isInputDisabled.toString()}</div>
      <div data-testid="error">{state.error || 'no-error'}</div>
      <button data-testid="add-user-message" onClick={() => addUserMessage('User message')}>
        Add User Message
      </button>
      <button data-testid="add-bot-message" onClick={() => addBotMessage('Bot message')}>
        Add Bot Message
      </button>
      <button data-testid="set-typing-complete" onClick={() => setMessageTypingComplete(0)}>
        Set Typing Complete
      </button>
      <button
        data-testid="toggle-input-disabled"
        onClick={() => setInputDisabled(!state.isInputDisabled)}
      >
        Toggle Input Disabled
      </button>
      <button
        data-testid="toggle-button-visibility"
        onClick={() => setButtonGroupVisible(!state.isButtonGroupVisible)}
      >
        Toggle Button Visibility
      </button>
      <button data-testid="remove-buttons" onClick={() => removeMessageButtons()}>
        Remove Buttons
      </button>
      <button data-testid="set-error" onClick={() => setError('Test error')}>
        Set Error
      </button>
      <button data-testid="clear-error" onClick={() => clearError()}>
        Clear Error
      </button>
    </div>
  );
};

describe('ChatContext', () => {
  it('provides initial state', () => {
    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    // Check initial state
    expect(getByTestId('message-count').textContent).toBe('1'); // Should have 1 welcome message
    expect(getByTestId('input-disabled').textContent).toBe('true');
    expect(getByTestId('error').textContent).toBe('no-error');
  });

  it('adds user message', () => {
    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    act(() => {
      getByTestId('add-user-message').click();
    });

    expect(getByTestId('message-count').textContent).toBe('2');
  });

  it('adds bot message', () => {
    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    act(() => {
      getByTestId('add-bot-message').click();
    });

    expect(getByTestId('message-count').textContent).toBe('2');
  });

  it('toggles input disabled state', () => {
    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    act(() => {
      getByTestId('toggle-input-disabled').click();
    });

    expect(getByTestId('input-disabled').textContent).toBe('false');
  });

  it('sets and clears error message', () => {
    const { getByTestId } = render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    act(() => {
      getByTestId('set-error').click();
    });

    expect(getByTestId('error').textContent).toBe('Test error');

    act(() => {
      getByTestId('clear-error').click();
    });

    expect(getByTestId('error').textContent).toBe('no-error');
  });
});
