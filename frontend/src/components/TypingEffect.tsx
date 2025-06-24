import React, { useEffect, useRef } from 'react';

interface TypingEffectProps {
  message: string;
  onTypingComplete: () => void;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ message, onTypingComplete }) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const messageDiv = messageRef.current;
    if (!messageDiv || !message) return;

    // Reset index when message changes
    indexRef.current = 0;

    intervalIdRef.current = setInterval(() => {
      if (indexRef.current < message.length) {
        const char = message[indexRef.current];
        if (char === '\n') {
          messageDiv.appendChild(document.createElement('br'));
        } else {
          messageDiv.appendChild(document.createTextNode(char));
        }
        indexRef.current++;
        // Scroll into view after each character
        messageDiv.scrollIntoView({ behavior: 'smooth' });
      } else {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
        }
        onTypingComplete();
      }
    }, 30);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [message, onTypingComplete]);

  return <div ref={messageRef} />;
};

export default TypingEffect;
