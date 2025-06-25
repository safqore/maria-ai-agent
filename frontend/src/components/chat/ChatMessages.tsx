import React, { useRef, useEffect } from 'react';
import { Message } from '../../utils/chatUtils';
import TypingEffect from '../TypingEffect';
import ButtonGroup from '../ButtonGroup';

/**
 * Props for the ChatMessages component
 */
interface ChatMessagesProps {
  /** List of messages to display in the chat */
  messages: Message[];
  /** Function to call when a typing animation completes */
  onTypingComplete: (messageId: number) => void;
  /** Optional function to handle button clicks */
  onButtonClick?: (value: string) => void;
  /** Whether the button group is visible */
  isButtonGroupVisible?: boolean;
}

/**
 * Component to display chat messages with typing effects
 *
 * This component handles the rendering of individual messages,
 * including typing animations and auto-scrolling to the latest message.
 */
const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  onTypingComplete, 
  onButtonClick,
  isButtonGroupVisible = true
}) => {
  // Ref for auto-scrolling to the end of messages
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change
  useEffect(() => {
    if (typeof window !== 'undefined' && endOfMessagesRef.current?.scrollIntoView) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Also scroll when a message is typing
  useEffect(() => {
    const typing = messages.some(msg => msg.isTyping);
    if (typing && typeof window !== 'undefined' && endOfMessagesRef.current?.scrollIntoView) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <>
      {messages.map((message, index) => (
        <div key={index} className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}>
          {message.isTyping ? (
            <TypingEffect
              message={message.text}
              onTypingComplete={() => onTypingComplete(message.id)}
            />
          ) : (
            <>
              <div dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br>') }} />
              {message.buttons && onButtonClick && (
                <ButtonGroup
                  buttons={message.buttons}
                  onButtonClick={onButtonClick}
                  isButtonGroupVisible={isButtonGroupVisible}
                />
              )}
            </>
          )}
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </>
  );
};

export default ChatMessages;
