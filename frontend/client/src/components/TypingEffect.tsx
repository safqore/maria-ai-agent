import React, { useEffect, useRef } from 'react';

interface TypingEffectProps {
  message: string;
  onTypingComplete: () => void;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ message, onTypingComplete }) => {
  const messageRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const messageDiv = messageRef.current;
    if (!messageDiv || !message) return;

    let index = 0;
    const intervalId = setInterval(() => {
      if (index < message.length) {
        messageDiv.textContent += message[index];
        index++;
      } else {
        clearInterval(intervalId);
        onTypingComplete();
      }
    }, 30);

    return () => clearInterval(intervalId);
  }, [message, onTypingComplete]);

  return <span ref={messageRef} />;
};

export default TypingEffect;
