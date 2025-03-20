import React, { useEffect, useRef, useState } from 'react';

interface TypingEffectProps {
  message: string;
  onTypingComplete: () => void;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ message, onTypingComplete }) => {
  const messageRef = useRef<HTMLDivElement>(null); // Changed to HTMLDivElement
  const [typedMessage, setTypedMessage] = useState('');

  useEffect(() => {
    const messageDiv = messageRef.current;
    if (!messageDiv || !message) return;

    let index = 0;
    const intervalId = setInterval(() => {
      if (index < message.length) {
        const char = message[index];
        setTypedMessage(prev => prev + char);
        index++;
      } else {
        clearInterval(intervalId);
        onTypingComplete();
      }
    }, 30);

    return () => clearInterval(intervalId);
  }, [message, onTypingComplete]);

  useEffect(() => {
    const messageDiv = messageRef.current;
    if (!messageDiv) return;
    messageDiv.innerHTML = ''; // Clear before re-rendering

    for (let i = 0; i < typedMessage.length; i++) {
      const char = typedMessage[i];
      if (char === '\n') {
        messageDiv.appendChild(document.createElement('br'));
      } else {
        messageDiv.appendChild(document.createTextNode(char));
      }
    }
  }, [typedMessage]);

  return <div ref={messageRef} />; // Changed to <div>
};

export default TypingEffect;
