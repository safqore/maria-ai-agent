import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { ChatProvider, useChat } from '../../contexts/ChatContext';
import { States, StateMachine, createStateMachine } from '../../state/FiniteStateMachine';

// Mock FSM for testing
const createMockFSM = (): StateMachine => {
  const fsm = createStateMachine();

  // Mock the methods that handleButtonClick depends on
  fsm.getResponseDisplayValue = jest.fn().mockReturnValue('Yes');
  fsm.canTransition = jest.fn().mockReturnValue(true);
  fsm.transition = jest.fn();
  fsm.getCurrentState = jest.fn().mockReturnValue(States.COLLECTING_NAME);
  fsm.getState = jest.fn().mockReturnValue(States.COLLECTING_NAME);
  fsm.reset = jest.fn();

  return fsm;
};

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
    setLoading,
    updateFsmState,
    handleButtonClick,
    sendMessage,
    resetChat,
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
      <button data-testid="set-loading" onClick={() => setLoading(true)}>
        Set Loading
      </button>
      <button data-testid="update-fsm" onClick={() => updateFsmState(States.COLLECTING_NAME)}>
        Update FSM State
      </button>
      <button data-testid="handle-button" onClick={() => handleButtonClick('yes')}>
        Handle Yes Button
      </button>
      <button data-testid="send-message" onClick={() => sendMessage('Hello!')}>
        Send Message
      </button>
      <button data-testid="reset-chat" onClick={() => resetChat()}>
        Reset Chat
      </button>
    </div>
  );
};

describe('ChatContext', () => {
  let mockFSM: StateMachine;

  beforeEach(() => {
    mockFSM = createMockFSM();
  });

  it('provides initial state', () => {
    const { getByTestId } = render(
      <ChatProvider fsm={mockFSM}>
        <TestComponent />
      </ChatProvider>
    );

    // Check initial state
    expect(getByTestId('message-count').textContent).toBe('1'); // Should have 1 welcome message
    expect(getByTestId('input-disabled').textContent).toBe('false');
    expect(getByTestId('error').textContent).toBe('no-error');
  });

  it('adds user message', () => {
    const { getByTestId } = render(
      <ChatProvider fsm={mockFSM}>
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
      <ChatProvider fsm={mockFSM}>
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
      <ChatProvider fsm={mockFSM}>
        <TestComponent />
      </ChatProvider>
    );

    act(() => {
      getByTestId('toggle-input-disabled').click();
    });

    expect(getByTestId('input-disabled').textContent).toBe('true');
  });

  it('sets and clears error message', () => {
    const { getByTestId } = render(
      <ChatProvider fsm={mockFSM}>
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

  it('updates FSM state', () => {
    const { getByTestId } = render(
      <ChatProvider fsm={mockFSM}>
        <TestComponent />
      </ChatProvider>
    );

    // Update FSM state
    act(() => {
      getByTestId('update-fsm').click();
    });

    // We can't directly check the state since it's not displayed in the test component
    // But we can verify it doesn't crash
  });

  it('handles button clicks', async () => {
    const { getByTestId } = render(
      <ChatProvider fsm={mockFSM}>
        <TestComponent />
      </ChatProvider>
    );

    act(() => {
      getByTestId('handle-button').click();
    });

    // Should add a user message with the button value
    await waitFor(() => {
      expect(getByTestId('message-count').textContent).toBe('2');
    });
  });

  it('sends messages and processes responses', async () => {
    const { getByTestId } = render(
      <ChatProvider fsm={mockFSM}>
        <TestComponent />
      </ChatProvider>
    );

    // First, update the FSM state to COLLECTING_NAME so sendMessage will process the text
    act(() => {
      getByTestId('update-fsm').click();
    });

    act(() => {
      getByTestId('send-message').click();
    });

    // Should add both user message and bot response
    await waitFor(() => {
      expect(getByTestId('message-count').textContent).toBe('3');
    });
  });

  it('resets the chat', async () => {
    const { getByTestId } = render(
      <ChatProvider fsm={mockFSM}>
        <TestComponent />
      </ChatProvider>
    );

    // Add some messages first
    act(() => {
      getByTestId('add-user-message').click();
      getByTestId('add-bot-message').click();
    });

    expect(getByTestId('message-count').textContent).toBe('3');

    // Reset chat
    act(() => {
      getByTestId('reset-chat').click();
    });

    // Should reset to initial state
    await waitFor(() => {
      expect(getByTestId('message-count').textContent).toBe('1'); // Back to initial welcome message
    });

    act(() => {
      getByTestId('clear-error').click();
    });

    expect(getByTestId('error').textContent).toBe('no-error');
  });
});
