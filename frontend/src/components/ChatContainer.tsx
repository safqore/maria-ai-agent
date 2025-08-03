import React, { useState, useEffect, ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import ChatHistory from './chat/ChatHistory';
import ChatInputArea from './ChatInputArea';
import useChatStateMachine from '../hooks/useChatStateMachine';
import '../styles.css';
import { Transitions } from '../state/FiniteStateMachine';
// import { Message } from '../utils/chatUtils';
import { useChat } from '../contexts/ChatContext';
import { useFileUpload } from '../contexts/FileUploadContext';
import { sanitizeHtml } from '../utils/sanitizeUtils';

// Initial welcome message for the chat UI
const welcomeMessage =
  "👋 Hi there! I'm Maria, your AI guide at Safqore. Ready to discover how we can help you grow?";
// const initialBotMessage: Message = { text: welcomeMessage, isUser: false, isTyping: true, id: 0 };

interface ChatContainerProps {
  sessionUUID: string; // The current session UUID, passed from App
}

/**
 * Main chat container component. Handles chat state, user input, and session enforcement.
 * All user actions (chat, button, file) enforce UUID checks before proceeding.
 */
function ChatContainer({ sessionUUID }: ChatContainerProps) {
  // Use contexts instead of local state where possible
  const {
    state: { messages, error: sessionError },
    addUserMessage,
    addBotMessage,
    setInputDisabled: setContextInputDisabled,
  } = useChat();

  const {
    state: { files },
  } = useFileUpload();
  const fileUploadInProgress = files.some(file => file.isUploading);

  // Local state that doesn't belong in contexts
  const [userInput, setUserInput] = useState<string>('');
  const [isInputDisabled, setIsInputDisabled] = useState<boolean>(true);
  const [isButtonGroupVisible, setIsButtonGroupVisible] = useState<boolean>(false);

  // Initialize with welcome message if messages is empty
  useEffect(() => {
    if (messages.length === 0) {
      addBotMessage(welcomeMessage);
    }
  }, [messages, addBotMessage]);

  const {
    fsm,
    buttonClickHandler,
    typingCompleteHandler,
    processTextInputHandler,
    fileUploadHandler,
  } = useChatStateMachine({
    messages,
    setMessages: messagesOrFn => {
      if (typeof messagesOrFn === 'function') {
        const newMessages = messagesOrFn(messages);
        // Add each message as needed
        newMessages
          .filter(msg => !messages.some(existingMsg => existingMsg.id === msg.id))
          .forEach(msg => {
            if (msg.isUser) {
              addUserMessage(msg.text);
            } else {
              addBotMessage(msg.text);
            }
          });
      }
    },
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
   * Handles user input submission via Enter key or Send button
   * @param event - Keyboard or mouse event triggering the submission
   */
  const handleSubmit = (event: KeyboardEvent<HTMLInputElement> | MouseEvent<HTMLButtonElement>) => {
    // Prevent default for keyboard events
    if ('key' in event && event.key === 'Enter') {
      event.preventDefault();
    }

    // Skip empty submissions
    if (!userInput.trim()) return;

    // Process the input through FSM with session validation
    addUserMessage(userInput);
    processTextInputHandler(userInput);
    setUserInput('');
  };

  /**
   * Handles changes to the text input field
   * @param event - Change event from the input field
   */
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
  };

  /**
   * Handles button clicks from the button group
   * @param buttonText - Text of the clicked button
   */
  const handleButtonClick = (buttonText: string) => {
    buttonClickHandler(buttonText);
  };

  /**
   * Adapter function to handle file uploads with session validation
   * @param file - The file selected by the user
   */
  const handleFileUpload = (file: File) => {
    fileUploadHandler(file);
  };

  /**
   * Callback when a bot message finishes typing animation
   * @param messageId - ID of the message that completed typing
   */
  const handleTypingComplete = (messageId: number) => {
    typingCompleteHandler(messageId);
  };

  /**
   * Handler for when file upload is completed. Advances the chat state.
   */
  const handleFileUploadDone = () => {
    // Transition state machine to next state after file upload
    fsm.transition(Transitions.DOCS_UPLOADED);

    // Add bot message through context
    addBotMessage(
      'Great! Now, please enter your email address so I can send you updates and results.'
    );

    // Enable input for email entry
    setIsInputDisabled(false);
    setContextInputDisabled(false);
  };

  return (
    <div className="chat-container" role="region" aria-label="Chat interface">
      {/* Error display area */}
      {sessionError && (
        <div className="error-banner" role="alert">
          <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(sessionError) }} />
        </div>
      )}

      {/* Chat history */}
      <ChatHistory
        onTypingComplete={handleTypingComplete}
        onButtonClick={handleButtonClick}
        currentState={fsm.getState()}
        onFileUploaded={handleFileUpload}
        onFileUploadDone={handleFileUploadDone}
        sessionUUID={sessionUUID}
      />

      {/* Input area */}
      <ChatInputArea
        userInput={userInput}
        inputTextChangeHandler={handleInputChange}
        sendButtonHandler={handleSubmit}
        disabled={isInputDisabled || fileUploadInProgress}
        autoFocus={true}
      />
    </div>
  );
}

export default ChatContainer;
