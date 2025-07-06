import React, { useRef, useEffect } from 'react';
import TypingEffect from '../TypingEffect';
import ButtonGroup from '../ButtonGroup';
import { useChat } from '../../contexts/ChatContext';

/**
 * Props for the ChatMessages component
 */
interface ChatMessagesProps {
  /** Function to call when a typing animation completes */
  onTypingComplete: (messageId: number) => void;
  /** Optional function to handle button clicks */
  onButtonClick?: (value: string) => void;
}

/**
 * Component to display chat messages with typing effects
 *
 * This component renders chat messages from the ChatContext,
 * including typing animations and auto-scrolling to the latest message.
 * It supports button groups for interactive chat options.
 */
const ChatMessages: React.FC<ChatMessagesProps> = ({ onTypingComplete, onButtonClick }) => {
  // Get messages and button visibility from chat context
  const {
    state: { messages, isButtonGroupVisible },
  } = useChat();

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
    <div role="log" aria-label="Chat messages" aria-live="polite">
      {messages.map((message, index) => (
        <div
          key={index}
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
              <div
                data-testid={`message-text-${index}`}
                dangerouslySetInnerHTML={{
                  __html: message.text
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\n/g, '<br>'),
                }}
              />
              {message.buttons && onButtonClick && (
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
      <div ref={endOfMessagesRef} data-testid="end-of-messages" />
    </div>
  );
};

export default ChatMessages;
