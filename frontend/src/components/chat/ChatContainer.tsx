import React, { useState, ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ChatProvider, useChat } from '../../contexts/ChatContext';
import { FileUploadProvider } from '../../contexts/FileUploadContext';
import ChatMessages from './ChatMessages';
import ChatControls from './ChatControls';
import ChatActions from './ChatActions';
import useChatStateMachine from '../../hooks/useChatStateMachine';
import { States, Transitions } from '../../state/FiniteStateMachine';
import { Button } from '../../types/buttonTypes';
import '../../styles.css';

/**
 * Props for the ChatContainerInner component
 */
interface ChatContainerInnerProps {
  /** The session UUID for API calls */
  sessionUUID: string;
}

/**
 * Inner component that handles chat functionality
 *
 * This component uses the chat and file upload contexts, and is wrapped
 * with error handling by the outer ChatContainer component.
 */
const ChatContainerInner: React.FC<ChatContainerInnerProps> = ({ sessionUUID }) => {
  // Get chat state and actions from context
  const {
    state: { messages, isInputDisabled, isButtonGroupVisible, error: chatError },
    setMessageTypingComplete,
    addUserMessage,
    addBotMessage,
    setInputDisabled,
    removeMessageButtons,
    // setError is available but not currently used in this component
  } = useChat();

  // Local state for user input
  const [userInput, setUserInput] = useState<string>('');

  // Create the finite state machine for chat flow
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
        // Use functional update pattern
        const updatedMessages = messagesOrFn(messages);
        // Find the new message and add it
        const newMessage = updatedMessages.find(msg => !messages.some(m => m.id === msg.id));
        if (newMessage) {
          if (newMessage.isUser) {
            addUserMessage(newMessage.text);
          } else {
            addBotMessage(newMessage.text, newMessage.buttons);
          }
        }
      } else {
        // TODO: Handle direct updates if needed
      }
    },
    setIsInputDisabled: (value: boolean | ((prevState: boolean) => boolean)) => {
      if (typeof value === 'function') {
        // If value is a function, we need to get the current isInputDisabled value
        const newValue = value(isInputDisabled);
        setInputDisabled(newValue);
      } else {
        setInputDisabled(value);
      }
    },
    setIsButtonGroupVisible: () => {
      // This is intentionally left empty - handled by ChatContext
    },
  });

  // Handle typing complete event
  const handleTypingComplete = (messageId: number) => {
    setMessageTypingComplete(messageId);
    typingCompleteHandler(messageId);
  };

  // Handle button clicks
  const handleButtonClick = (value: string) => {
    removeMessageButtons();
    buttonClickHandler(value);
  };

  // Handle text input changes
  const inputTextChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
  };

  // Handle sending messages
  const sendButtonHandler = (
    event: KeyboardEvent<HTMLInputElement> | MouseEvent<HTMLButtonElement>
  ) => {
    if ((event.type === 'click' || (event as KeyboardEvent).key === 'Enter') && !isInputDisabled) {
      processTextInputHandler(userInput);
      setUserInput('');
    }
  };

  // Get buttons based on current state
  const getStateButtons = (): Button[] | undefined => {
    if (fsm.getState() === States.USR_INIT_OPTIONS) {
      return [
        { text: 'Yes', value: 'YES_CLICKED' },
        { text: 'No', value: 'NO_CLICKED' },
      ];
    } else if (fsm.getState() === States.ENGAGE_USR_AGAIN) {
      return [
        { text: "Let's Go", value: 'LETS_GO_CLICKED' },
        { text: 'Maybe next time', value: 'MAYBE_NEXT_TIME_CLICKED' },
      ];
    }
    return undefined;
  };

  // File upload complete handler
  const handleFileUploadDone = () => {
    // Transition state machine to next state after file upload
    fsm.transition(Transitions.DOCS_UPLOADED);

    // Add bot message to prompt for email
    addBotMessage(
      'Great! Now, please enter your email address so I can send you updates and results.'
    );

    setInputDisabled(false);
  };

  return (
    <div className="chat-container">
      {chatError && <div className="chat-error-message">{chatError}</div>}

      <div className="chat-history" id="chat-history">
        <ChatMessages messages={messages} onTypingComplete={handleTypingComplete} />

        {fsm.getState() === States.UPLOAD_DOCS && (
          <ChatActions
            type="fileUpload"
            sessionUUID={sessionUUID}
            onFileUploaded={fileUploadHandler}
            onDone={handleFileUploadDone}
          />
        )}
      </div>

      <ChatControls
        userInput={userInput}
        isInputDisabled={isInputDisabled}
        onInputChange={inputTextChangeHandler}
        onSendMessage={sendButtonHandler}
        buttons={getStateButtons()}
        isButtonGroupVisible={isButtonGroupVisible}
        onButtonClick={handleButtonClick}
      />
    </div>
  );
};

/**
 * Props for the ChatContainer component
 */
interface ChatContainerProps {
  /** The session UUID for API calls */
  sessionUUID: string;
}

/**
 * Main chat container component
 *
 * This component provides context providers and error handling
 * for the chat functionality.
 */
const ChatContainer: React.FC<ChatContainerProps> = ({ sessionUUID }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="error-fallback">
          <h2>Something went wrong with the chat</h2>
          <p>Please refresh the page to try again.</p>
        </div>
      }
    >
      <ChatProvider>
        <FileUploadProvider>
          <ChatContainerInner sessionUUID={sessionUUID} />
        </FileUploadProvider>
      </ChatProvider>
    </ErrorBoundary>
  );
};

export default ChatContainer;
