import React, { useState, useEffect, ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import { ErrorBoundary } from './shared/ErrorBoundary';
import ButtonGroup from './ButtonGroup';
import TypingEffect from './TypingEffect';
import FileUpload from './FileUpload';
import { States, Transitions } from '../state/FiniteStateMachine';
import useChatStateMachine from '../hooks/useChatStateMachine-new';
import { Message } from '../utils/chatUtils';
import '../styles.css';

// Initial welcome message for the chat UI
const welcomeMessage = "👋 Hi there! I'm Maria, your AI guide at Safqore. Ready to discover how we can help you grow?";
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
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isButtonGroupVisible, setIsButtonGroupVisible] = useState<boolean>(true);
  
  const { 
    fsm, 
    buttonClickHandler, 
    typingCompleteHandler, 
    processTextInputHandler, 
    fileUploadHandler
  } = useChatStateMachine({
    messages,
    setMessages,
    setIsInputDisabled,
    setIsButtonGroupVisible
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
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
  };

  /**
   * Handles sending chat messages.
   */
  const handleSendMessage = (event: KeyboardEvent<HTMLInputElement> | MouseEvent<HTMLButtonElement>) => {
    if ((event.type === 'click' || (event as KeyboardEvent).key === 'Enter') && !isInputDisabled && userInput.trim()) {
      processTextInputHandler(userInput);
      setUserInput('');
    }
  };

  /**
   * Handler for when file upload is completed. Advances the chat state.
   */
  const handleFileUploadDone = () => {
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

  // Create a reference to scroll to the end of messages
  const endOfMessagesRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <ErrorBoundary
      fallback={
        <div className="error-fallback">
          <h2>Something went wrong with the chat</h2>
          <p>Please refresh the page to try again.</p>
        </div>
      }
    >
      <div className="chat-container">
        <div className="chat-history" id="chat-history">
          {/* Display messages */}
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}>
              {message.isTyping ? (
                <TypingEffect message={message.text} onTypingComplete={() => typingCompleteHandler(message.id)} />
              ) : (
                <>
                  {message.text && (
                    <div dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br>') }} />
                  )}
                  {message.buttons && (
                    <ButtonGroup
                      buttons={message.buttons}
                      onButtonClick={(value) => buttonClickHandler(value)}
                      isButtonGroupVisible={isButtonGroupVisible}
                    />
                  )}
                </>
              )}
            </div>
          ))}

          {/* State-based buttons */}
          {fsm.getState() === States.USR_INIT_OPTIONS && (
            <ButtonGroup
              buttons={[
                { text: "Yes", value: "YES_CLICKED" },
                { text: "No", value: "NO_CLICKED" }
              ]}
              onButtonClick={(value) => buttonClickHandler(value)}
              isButtonGroupVisible={isButtonGroupVisible}
            />
          )}
          
          {fsm.getState() === States.ENGAGE_USR_AGAIN && (
            <ButtonGroup
              buttons={[
                { text: "Let's Go", value: "LETS_GO_CLICKED" },
                { text: "Maybe next time", value: "MAYBE_NEXT_TIME_CLICKED" }
              ]}
              onButtonClick={(value) => buttonClickHandler(value)}
              isButtonGroupVisible={isButtonGroupVisible}
            />
          )}
          
          {/* File upload component */}
          {fsm.getState() === States.UPLOAD_DOCS && (
            <FileUpload
              onFileUploaded={fileUploadHandler}
              onDone={handleFileUploadDone}
              sessionUUID={sessionUUID}
            />
          )}
          
          <div ref={endOfMessagesRef} />
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            id="user-input"
            value={userInput}
            onChange={handleInputChange}
            onKeyPress={handleSendMessage}
            placeholder="Type your message here..."
            disabled={isInputDisabled}
          />
          <button
            id="send-button"
            onClick={handleSendMessage}
            disabled={isInputDisabled || !userInput.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default ChatContainer;
