import React, { useRef, useEffect } from 'react';
import TypingEffect from './TypingEffect';
import ButtonGroup from './ButtonGroup';
import FileUpload from './FileUpload';
import { States } from '../state/FiniteStateMachine';
import { Message } from '../utils/chatUtils';

interface ChatHistoryProps {
  messages: Message[];
  onTypingComplete: (messageId: number) => void;
  onButtonClick: (value: string) => void;
  currentState: string;
  isButtonGroupVisible: boolean;
  onFileUploaded: (file: File) => void;
  onFileUploadDone: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, onTypingComplete, onButtonClick, onFileUploaded, onFileUploadDone, currentState, isButtonGroupVisible }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Also scroll when a message is typing
  useEffect(() => {
    const typing = messages.some(msg => msg.isTyping);
    if (typing) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="chat-history" id="chat-history">
      {messages.map((message, index) => (
        <div key={index} className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}>
          {message.isTyping ? (
            <TypingEffect message={message.text} onTypingComplete={() => onTypingComplete(message.id)} />
          ) : (
            <>
              {message.text && (
                <div dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br>') }} />
              )}
              {message.buttons && (
                <ButtonGroup buttons={message.buttons} onButtonClick={onButtonClick} isButtonGroupVisible={isButtonGroupVisible} />
              )}
            </>
          )}
        </div>
      ))}
      {currentState === States.USR_INIT_OPTIONS && (
        <ButtonGroup
          buttons={[
            { text: "Yes", value: "YES_CLICKED" },
            { text: "No", value: "NO_CLICKED" }
          ]}
          onButtonClick={onButtonClick}
          isButtonGroupVisible={isButtonGroupVisible}
        />
      )}
      {currentState === States.ENGAGE_USR_AGAIN && (
        <ButtonGroup
          buttons={[
            { text: "Let's Go", value: "LETS_GO_CLICKED" },
            { text: "Maybe next time", value: "MAYBE_NEXT_TIME_CLICKED" }
          ]}
          onButtonClick={onButtonClick}
          isButtonGroupVisible={isButtonGroupVisible}
        />
      )}
      {currentState === States.UPLOAD_DOCS && (
        <FileUpload onFileUploaded={onFileUploaded} onDone={onFileUploadDone} />
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ChatHistory;
