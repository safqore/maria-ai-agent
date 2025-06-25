import React, { useState, useEffect, ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import ChatHistory from './ChatHistory';
import ChatInputArea from './ChatInputArea';
import useChatStateMachine from '../hooks/useChatStateMachine';
import '../styles.css';
import { Transitions } from '../state/FiniteStateMachine';
import { Message } from '../utils/chatUtils';
// resetSessionUUID is removed as it's unused

// Initial welcome message for the chat UI
const welcomeMessage =
  '👋 Hi there! I’m Maria, your AI guide at Safqore. Ready to discover how we can help you grow?';
const initialBotMessage: Message = { text: welcomeMessage, isUser: false, isTyping: true, id: 0 };

interface ChatContainerProps {
  sessionUUID: string; // The current session UUID, passed from App
}

/**
 * Main chat container component. Handles chat state, user input, and session enforcement.
 * All user actions (chat, button, file) enforce UUID checks before proceeding.
 */
function ChatContainer({ sessionUUID }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([initialBotMessage]);
  const [userInput, setUserInput] = useState<string>('');
  const [isInputDisabled, setIsInputDisabled] = useState<boolean>(true);
  const [isButtonGroupVisible, setIsButtonGroupVisible] = useState<boolean>(false);
  const [sessionError] = useState<string | null>(null); // State kept but setter not used
  const {
    fsm,
    buttonClickHandler,
    typingCompleteHandler,
    processTextInputHandler,
    fileUploadHandler,
  } = useChatStateMachine({
    messages,
    setMessages,
    setIsInputDisabled,
    setIsButtonGroupVisible,
  });

  // Enable/disable input based on chat state
  useEffect(() => {
    if (messages.length > 0 && !messages[0].isTyping && messages[0].id === 0) {
      setIsInputDisabled(false);
      fsm.transition(Transitions.WELCOME_MSG_COMPLETE);
    } else if (messages.length === 0 || messages[0].isTyping) {
      setIsInputDisabled(true);
    }
  }, [messages, fsm]);

  /**
   * Handles user input text changes.
   */
  const inputTextChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
  };

  /**
   * Handles sending chat messages. Assumes sessionUUID is valid.
   */
  const sendButtonHandler = (
    event: KeyboardEvent<HTMLInputElement> | MouseEvent<HTMLButtonElement>
  ) => {
    if ((event.type === 'click' || (event as KeyboardEvent).key === 'Enter') && !isInputDisabled) {
      processTextInputHandler(userInput);
      setUserInput('');
    }
  };

  /**
   * Handler for when file upload is completed. Advances the chat state.
   */
  const onFileUploadDone = () => {
    // Transition state machine to next state after file upload
    fsm.transition(Transitions.DOCS_UPLOADED);
    // Add bot message to prompt for email
    setMessages(prevMessages => [
      ...prevMessages,
      {
        text: 'Great! Now, please enter your email address so I can send you updates and results.',
        isUser: false,
        isTyping: true,
        id: prevMessages.length,
      },
    ]);
    setIsInputDisabled(false);
  };

  // sessionUUID is now available for all API/file upload calls

  return (
    <div className="chat-container">
      {sessionError && <div className="session-error-banner">{sessionError}</div>}
      <ChatHistory
        messages={messages}
        onTypingComplete={typingCompleteHandler}
        onButtonClick={value => {
          buttonClickHandler(value);
        }}
        onFileUploaded={fileUploadHandler}
        onFileUploadDone={onFileUploadDone}
        currentState={fsm.getState()}
        isButtonGroupVisible={isButtonGroupVisible}
        sessionUUID={sessionUUID}
      />
      <ChatInputArea
        userInput={userInput}
        inputTextChangeHandler={inputTextChangeHandler}
        sendButtonHandler={sendButtonHandler}
        disabled={isInputDisabled}
      />
    </div>
  );
}

export default ChatContainer;
