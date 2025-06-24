import React, { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';

interface ChatInputAreaProps {
  userInput: string;
  inputTextChangeHandler: (event: ChangeEvent<HTMLInputElement>) => void;
  sendButtonHandler: (
    event: KeyboardEvent<HTMLInputElement> | MouseEvent<HTMLButtonElement>
  ) => void;
  disabled: boolean;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  userInput,
  inputTextChangeHandler,
  sendButtonHandler,
  disabled,
}) => {
  return (
    <div className="chat-input-area">
      <input
        type="text"
        id="user-input"
        value={userInput}
        onChange={inputTextChangeHandler}
        onKeyPress={sendButtonHandler}
        placeholder="Type your message..."
        disabled={disabled}
      />
      <button id="send-button" onClick={sendButtonHandler} disabled={disabled}>
        Send
      </button>
    </div>
  );
};

export default ChatInputArea;
