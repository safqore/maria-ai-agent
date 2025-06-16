import React, { useState, useEffect, ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import ChatHistory from './ChatHistory';
import ChatInputArea from './ChatInputArea';
import useChatStateMachine from '../hooks/useChatStateMachine';
import '../styles.css';
import { Transitions } from '../state/FiniteStateMachine';
import { Message } from '../utils/chatUtils';

const welcomeMessage = "👋 Hi there! I’m Maria, your AI guide at Safqore. Ready to discover how we can help you grow?";
const initialBotMessage: Message = { text: welcomeMessage, isUser: false, isTyping: true, id: 0 };

function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([initialBotMessage]);
  const [userInput, setUserInput] = useState<string>('');
  const [isInputDisabled, setIsInputDisabled] = useState<boolean>(true);
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

  const inputTextChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
  };

  const sendButtonHandler = (event: KeyboardEvent<HTMLInputElement> | MouseEvent<HTMLButtonElement>) => {
    if ((event.type === 'click' || (event as KeyboardEvent).key === 'Enter') && !isInputDisabled) {
      processTextInputHandler(userInput);
      setUserInput('');
    }
  }

  return (
    <div className="chat-container">
      <ChatHistory 
        messages={messages} 
        onTypingComplete={typingCompleteHandler} 
        onButtonClick={(value) => {
          buttonClickHandler(value);
        }}
        onFileUploaded={fileUploadHandler} 
        onFileUploadDone={() => {
          // Transition state machine to next state after file upload
          fsm.transition(Transitions.DOCS_UPLOADED);
        }}
        currentState={fsm.getState()} 
        isButtonGroupVisible={isButtonGroupVisible}
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