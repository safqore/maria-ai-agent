import React, { useRef, useEffect } from 'react';
import TypingEffect from '../TypingEffect';
import ButtonGroup from '../ButtonGroup';
import FileUpload from '../fileUpload/FileUpload';
import { States } from '../../state/FiniteStateMachine';
import { useChat } from '../../contexts/ChatContext';
import { useFileUpload } from '../../contexts/FileUploadContext';
import { sanitizeHtml } from '../../utils/sanitizeUtils';

/**
 * Props for the ChatHistory component
 */
interface ChatHistoryProps {
  /** Function to call when typing animation is complete */
  readonly onTypingComplete: (messageId: number) => void;
  /** Function to handle button clicks */
  readonly onButtonClick: (value: string) => void;
  /** Current state of the chat flow machine */
  readonly currentState: string;
  /** Function to call when a file has been uploaded */
  readonly onFileUploaded: (file: File) => void;
  /** Function to call when file upload is complete */
  readonly onFileUploadDone: () => void;
  /** Session UUID for the current chat */
  readonly sessionUUID: string;
}

/**
 * Component that displays the chat history including messages, buttons, and file upload
 *
 * This component renders all chat messages, special buttons based on the current state,
 * and the file upload component when needed. It uses both the chat and file upload contexts.
 */
const ChatHistory: React.FC<ChatHistoryProps> = ({
  onTypingComplete,
  onButtonClick,
  onFileUploaded,
  onFileUploadDone,
  currentState,
  sessionUUID,
}) => {
  // Get messages and button visibility from chat context
  const {
    state: { messages, isButtonGroupVisible },
  } = useChat();

  // Get file upload state from context
  const { state: _ } = useFileUpload(); // Using _ to indicate we're not using this at the moment

  // Ref for auto-scrolling to the end of messages
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change
  useEffect(() => {
    if (endOfMessagesRef.current?.scrollIntoView) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Also scroll when a message is typing
  useEffect(() => {
    const typing = messages.some(msg => msg.isTyping);
    if (typing && endOfMessagesRef.current?.scrollIntoView) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div
      className="chat-history"
      id="chat-history"
      role="log"
      aria-live="polite"
      aria-label="Chat conversation history"
      data-testid="chat-history"
    >
      {messages.map((message, index) => (
        <div
          key={message.id || index}
          className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}
          data-testid={`message-${index}`}
          role={message.isUser ? 'textbox' : 'article'}
          aria-label={message.isUser ? 'Your message' : 'Assistant message'}
        >
          {message.isTyping ? (
            <TypingEffect
              message={message.text}
              onTypingComplete={() => onTypingComplete(message.id)}
              data-testid={`typing-effect-${index}`}
            />
          ) : (
            <>
              {message.text && (
                <div
                  data-testid={`message-text-${index}`}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(message.text),
                  }}
                  aria-live="polite"
                />
              )}
              {message.buttons && (
                <ButtonGroup
                  buttons={message.buttons}
                  onButtonClick={onButtonClick}
                  isButtonGroupVisible={isButtonGroupVisible}
                  data-testid={`button-group-${index}`}
                />
              )}
            </>
          )}
        </div>
      ))}
      {currentState === States.USR_INIT_OPTIONS && (
        <ButtonGroup
          buttons={[
            { text: 'Yes', value: 'YES_CLICKED' },
            { text: 'No', value: 'NO_CLICKED' },
          ]}
          onButtonClick={onButtonClick}
          isButtonGroupVisible={isButtonGroupVisible}
          data-testid="initial-options-buttons"
        />
      )}
      {currentState === States.ENGAGE_USR_AGAIN && (
        <ButtonGroup
          buttons={[
            { text: "Let's Go", value: 'LETS_GO_CLICKED' },
            { text: 'Maybe next time', value: 'MAYBE_NEXT_TIME_CLICKED' },
          ]}
          onButtonClick={onButtonClick}
          isButtonGroupVisible={isButtonGroupVisible}
          data-testid="engage-again-buttons"
        />
      )}
      {currentState === States.UPLOAD_DOCS && (
        <FileUpload
          onFileUploaded={onFileUploaded}
          onDone={onFileUploadDone}
          sessionUUID={sessionUUID}
          data-testid="file-upload-component"
        />
      )}
      <div ref={endOfMessagesRef} data-testid="end-of-messages" />
    </div>
  );
};

export default ChatHistory;
