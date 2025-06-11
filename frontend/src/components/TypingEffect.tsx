import React, { useEffect, useRef } from 'react';

interface TypingEffectProps {
  message: string;
  onTypingComplete: () => void;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ message, onTypingComplete }) => {
  const messageRef = useRef<HTMLDivElement>(null);
  let index = 0;
  let intervalId: NodeJS.Timeout | null = null;

  useEffect(() => {
    const messageDiv = messageRef.current;
    if (!messageDiv || !message) return;

    intervalId = setInterval(() => {
      if (index < message.length) {
        const char = message[index];
        if (char === '\n') {
          messageDiv.appendChild(document.createElement('br'));
        } else {
          messageDiv.appendChild(document.createTextNode(char));
        }
        index++;
      } else {
        clearInterval(intervalId!);
        onTypingComplete();
      }
    }, 30);

    return () => clearInterval(intervalId!);
  }, [message, onTypingComplete]);

  return <div ref={messageRef} />;
};

export default TypingEffect;
