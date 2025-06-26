import React, { memo, useMemo } from 'react';
import { Message } from '../utils/chatUtils';
import { ChatButton } from '../contexts/ChatContext';

/**
 * Props for ChatMessage component
 */
interface ChatMessageProps {
  /** Message data */
  message: Message;
  /** Callback when typing animation is complete */
  onTypingComplete?: (messageId: number) => void;
}

/**
 * A memoized chat message component that only re-renders when its props change
 * This optimization reduces unnecessary re-renders when the chat state changes
 * 
 * The custom comparison function ensures we only re-render when actual content changes
 */
const ChatMessage: React.FC<ChatMessageProps> = memo(({ message, onTypingComplete }) => {
  const { text, isUser, isTyping, id, buttons } = message;

  // Use simulated typing if this is a bot message and it's currently typing
  React.useEffect(() => {
    if (!isUser && isTyping) {
      const typingTimeout = setTimeout(() => {
        if (onTypingComplete) {
          onTypingComplete(id);
        }
      }, 1000);

      return () => clearTimeout(typingTimeout);
    }
  }, [isUser, isTyping, id, onTypingComplete]);

  // Memoize the button rendering to prevent unnecessary recalculations
  const buttonElements = useMemo(() => {
    if (!buttons || buttons.length === 0) return null;
    
    return (
      <div className="message-buttons">
        {buttons.map((button, index) => (
          <button key={index} className="message-button" data-value={button.value}>
            {button.text}
          </button>
        ))}
      </div>
    );
  }, [buttons]);

  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'bot-message'}`}>
      <div className={`message-bubble ${isTyping ? 'typing' : ''}`}>
        <div className="message-text">{text}</div>
        {buttonElements}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo optimization
  // Only re-render if these specific properties change
  const prevMsg = prevProps.message;
  const nextMsg = nextProps.message;
  
  return (
    prevMsg.id === nextMsg.id &&
    prevMsg.text === nextMsg.text &&
    prevMsg.isTyping === nextMsg.isTyping &&
    prevMsg.isUser === nextMsg.isUser &&
    // Compare buttons array
    ((!prevMsg.buttons && !nextMsg.buttons) || 
     (prevMsg.buttons?.length === nextMsg.buttons?.length &&
      JSON.stringify(prevMsg.buttons) === JSON.stringify(nextMsg.buttons)))
  );
});

// Display name for debugging
ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
