import React, { useEffect, useRef, useState } from 'react';

/**
 * Props for the TypingEffect component
 */
interface TypingEffectProps {
  /** The message to display with a typing effect */
  readonly message: string;
  /** Function called when the typing effect is complete */
  readonly onTypingComplete: () => void;
  /** Typing speed in milliseconds per character (default: 30) */
  readonly typingSpeed?: number;
  /** Initial delay before typing starts in milliseconds (default: 0) */
  readonly startDelay?: number;
  /** CSS class name for styling the typing container */
  readonly className?: string;
}

/**
 * Component that simulates a typing effect for text messages
 * 
 * TypingEffect displays text character by character to simulate typing.
 * It supports newlines and automatically calls a callback when typing is complete.
 */
const TypingEffect: React.FC<TypingEffectProps> = ({
  message,
  onTypingComplete,
  typingSpeed = 30,
  startDelay = 0,
  className = '',
}) => {
  // Store the current typed text and completion status
  const [typedText, setTypedText] = useState<string>('');
  const [complete, setComplete] = useState<boolean>(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Reset state when message changes
    setTypedText('');
    setComplete(false);
    
    // Clean up any existing timers
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }
    
    // Don't start if message is empty
    if (!message) {
      onTypingComplete();
      return;
    }
    
    let currentIndex = 0;
    
    // Start typing after the initial delay
    timeoutIdRef.current = setTimeout(() => {
      // Set up interval to type character by character
      intervalIdRef.current = setInterval(() => {
        if (currentIndex < message.length) {
          setTypedText(message.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          // Clear interval when done typing
          if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
          }
          setComplete(true);
          onTypingComplete();
        }
      }, typingSpeed);
    }, startDelay);
    
    // Clean up on unmount or when dependencies change
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [message, onTypingComplete, typingSpeed, startDelay]);
  
  // Process the message to display with newline support
  const renderTypedText = () => {
    const lines = typedText.split('\n');
    return (
      <>
        {lines.map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </>
    );
  };
  
  return (
    <div 
      className={`typing-effect ${className}`} 
      data-testid="typing-effect"
      aria-live="polite"
      aria-busy={!complete}
    >
      {renderTypedText()}
    </div>
  );
};

export default TypingEffect;
