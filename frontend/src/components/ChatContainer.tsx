import React, { useState, useEffect, ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import ChatHistory from './ChatHistory';
import ChatInputArea from './ChatInputArea';
import useChatStateMachine from '../hooks/useChatStateMachine';
import '../styles.css';
import { Transitions } from '../state/FiniteStateMachine';
import { Message } from '../utils/chatUtils';
import { resetSessionUUID } from '../utils/sessionUtils';

const welcomeMessage = "👋 Hi there! I’m Maria, your AI guide at Safqore. Ready to discover how we can help you grow?";
const initialBotMessage: Message = { text: welcomeMessage, isUser: false, isTyping: true, id: 0 };

interface ChatContainerProps {
  sessionUUID: string;
}

function ChatContainer({ sessionUUID }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([initialBotMessage]);
  const [userInput, setUserInput] = useState<string>('');
  const [isInputDisabled, setIsInputDisabled] = useState<boolean>(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const { fsm, buttonClickHandler, typingCompleteHandler, processTextInputHandler, fileUploadHandler, isButtonGroupVisible } = useChatStateMachine({
    messages,
    setMessages,
    setIsInputDisabled,
    setIsButtonGroupVisible: () => {} // No need to set visibility directly here
  });

  useEffect(() => {
    if (messages.length > 0 && !messages[0].isTyping && messages[0].id === 0) {
      setIsInputDisabled(false);
      fsm.transition(Transitions.WELCOME_MSG_COMPLETE);
    } else if (messages.length === 0 || messages[0].isTyping) {
      setIsInputDisabled(true);
    }
  }, [messages, fsm]);

  // Error handler for session reset
  const handleSessionReset = () => {
    resetSessionUUID();
    setSessionError('Your session has been reset due to a technical issue. Please start again.');
    setMessages([{
      text: 'Your session has been reset due to a technical issue. Please start again.',
      isUser: false,
      isTyping: false,
      id: Date.now(),
    }]);
    setUserInput('');
    setIsInputDisabled(true);
  };

  const inputTextChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
  };

  const sendButtonHandler = (event: KeyboardEvent<HTMLInputElement> | MouseEvent<HTMLButtonElement>) => {
    if ((event.type === 'click' || (event as KeyboardEvent).key === 'Enter') && !isInputDisabled) {
      processTextInputHandler(userInput);
      setUserInput('');
    }
  }

  const onFileUploadDone = () => {
    // Transition state machine to next state after file upload
    fsm.transition(Transitions.DOCS_UPLOADED);
    // Add bot message to prompt for email
    setMessages(prevMessages => [
      ...prevMessages,
      {
        text: "Great! Now, please enter your email address so I can send you updates and results.",
        isUser: false,
        isTyping: true,
        id: prevMessages.length
      }
    ]);
    setIsInputDisabled(false);
  };

  // sessionUUID is now available for all API/file upload calls

  return (
    <div className="chat-container">
      {sessionError && (
        <div className="session-error-banner">{sessionError}</div>
      )}
      <ChatHistory 
        messages={messages} 
        onTypingComplete={typingCompleteHandler} 
        onButtonClick={(value) => {
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