import React, { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import ButtonGroup from '../ButtonGroup';
import { Button } from '../../types/buttonTypes';

/**
 * Props for the ChatControls component
 */
interface ChatControlsProps {
  /** Current user input text */
  userInput: string;
  /** Whether the input is disabled */
  isInputDisabled: boolean;
  /** Function to handle text input changes */
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Function to handle send button clicks or Enter key presses */
  onSendMessage: (event: KeyboardEvent<HTMLInputElement> | MouseEvent<HTMLButtonElement>) => void;
  /** Array of buttons to display */
  buttons?: Button[];
  /** Whether the button group is visible */
  isButtonGroupVisible?: boolean;
  /** Function to handle button clicks */
  onButtonClick?: (value: string) => void;
}

/**
 * Component for chat input controls and optional button groups
 *
 * This component handles the rendering of the input field, send button,
 * and optional button groups for interactive chat options.
 */
const ChatControls: React.FC<ChatControlsProps> = ({
  userInput,
  isInputDisabled,
  onInputChange,
  onSendMessage,
  buttons,
  isButtonGroupVisible = true,
  onButtonClick,
}) => {
  return (
    <div className="chat-controls">
      {buttons && buttons.length > 0 && onButtonClick && isButtonGroupVisible && (
        <div className="state-buttons">
          <ButtonGroup
            buttons={buttons}
            onButtonClick={onButtonClick}
            isButtonGroupVisible={true}
          />
        </div>
      )}

      <div className="chat-input-area">
        <input
          type="text"
          id="user-input"
          value={userInput}
          onChange={onInputChange}
          onKeyDown={onSendMessage}
          placeholder="Type your message here..."
          disabled={isInputDisabled}
          className="chat-input"
        />
        <button
          id="send-button"
          onClick={onSendMessage}
          disabled={isInputDisabled || !userInput.trim()}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatControls;
