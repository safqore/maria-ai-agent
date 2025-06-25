import React, { ChangeEvent, KeyboardEvent, MouseEvent, useRef, useEffect } from 'react';

/**
 * Props for the ChatInputArea component
 */
interface ChatInputAreaProps {
  /** Current value of the input field */
  readonly userInput: string;
  /** Handler called when input text changes */
  readonly inputTextChangeHandler: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Handler called when Enter key is pressed or Send button is clicked */
  readonly sendButtonHandler: (
    event: KeyboardEvent<HTMLInputElement> | MouseEvent<HTMLButtonElement>
  ) => void;
  /** Whether the input and button should be disabled */
  readonly disabled: boolean;
  /** Whether to automatically focus the input field when rendered */
  readonly autoFocus?: boolean;
  /** Placeholder text for the input field */
  readonly placeholder?: string;
}

/**
 * Component that provides a text input area with a send button for chat interactions
 *
 * ChatInputArea handles user text input and provides a way to send messages.
 * It includes an input field and a send button that can be enabled/disabled.
 * The send button is disabled when there's no text input.
 */
const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  userInput,
  inputTextChangeHandler,
  sendButtonHandler,
  disabled,
  autoFocus = false,
  placeholder = 'Type your message...',
}) => {
  // Reference to the input element for autofocus
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input field if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [autoFocus, disabled]);

  return (
    <div className="chat-input-area" role="form" aria-label="Chat message input">
      <input
        ref={inputRef}
        type="text"
        id="user-input"
        data-testid="chat-input"
        value={userInput}
        onChange={inputTextChangeHandler}
        onKeyPress={sendButtonHandler}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Message input"
      />
      <button
        id="send-button"
        data-testid="send-button"
        onClick={sendButtonHandler}
        disabled={disabled || !userInput.trim()}
        aria-label="Send message"
      >
        Send
      </button>
    </div>
  );
};

export default ChatInputArea;
