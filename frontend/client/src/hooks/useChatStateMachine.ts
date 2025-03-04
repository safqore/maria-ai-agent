import { useState } from 'react';
import { createStateMachine, States, Transitions, StateMachine } from '../state/FiniteStateMachine';
import { Message } from '../utils/chatUtils';

interface ChatStateMachineOptions {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsInputDisabled: React.Dispatch<React.SetStateAction<boolean>>;
  setIsButtonGroupVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const useChatStateMachine = ({ messages, setMessages, setIsInputDisabled, setIsButtonGroupVisible }: ChatStateMachineOptions) => {
  const [fsm, setFsm] = useState<StateMachine>(createStateMachine());
  const [userName, setUserName] = useState<string>('');

  const typingCompleteHandler = (messageId: number) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, isTyping: false } : msg
      )
    );
    if (messageId !== 0) {
      setIsInputDisabled(false);
    }

    if (fsm.getState() === States.OPPORTUNITIES_EXIST && messageId === messages.length - 1) {
      fsm.transition(Transitions.OPPORTUNITIES_EXIST_COMPLETE);
      setIsButtonGroupVisible(true);
    }

    if (fsm.getState() === States.ENGAGE_USR_AGAIN && messageId === messages.length - 1) {
      setIsButtonGroupVisible(true);
    }
  };

  const buttonClickHandler = (response: string) => {
    const displayValue = fsm.getResponseDisplayValue(response) || response;
    const userMessage: Message = { text: displayValue, isUser: true, isTyping: false, id: messages.length };
    setMessages([...messages, userMessage]);

    setMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.buttons ? false : true)
    );

    if ((fsm.canTransition(Transitions.YES_CLICKED) && response === 'YES_CLICKED') ||
        (fsm.canTransition(Transitions.LETS_GO_CLICKED) && response === 'LETS_GO_CLICKED')) {
      fsm.transition(response === 'YES_CLICKED' ? Transitions.YES_CLICKED : Transitions.LETS_GO_CLICKED);
      const botMessage: Message = { 
        text: "Absolutely! Let’s get started. First things first — what’s your name?", 
        isUser: false, 
        isTyping: true, 
        id: messages.length + 1 
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } 
    else if (fsm.canTransition(Transitions.NO_CLICKED) && response === 'NO_CLICKED') {
      fsm.transition(Transitions.NO_CLICKED);
      const botMessage: Message = { 
        text: "💡 Psst… Great opportunities start with a “yes.” Change your mind? Click “Let’s Go” anytime!", 
        isUser: false, 
        isTyping: true, 
        id: messages.length + 1 
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } 
    else if (fsm.canTransition(Transitions.MAYBE_NEXT_TIME_CLICKED) && response === 'MAYBE_NEXT_TIME_CLICKED') {
      fsm.transition(Transitions.MAYBE_NEXT_TIME_CLICKED);
      const botMessage: Message = { 
        text: "I’ll be here when you’re ready!", 
        isUser: false, 
        isTyping: true, 
        id: messages.length + 1 
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      setIsButtonGroupVisible(true);
    }
  };

  const processTextInputHandler = (userInput: string) => {
    if (userInput.trim() === '') return;

    const newUserMessage: Message = { text: userInput, isUser: true, isTyping: false, id: messages.length };
    setMessages([...messages, newUserMessage]);
    setIsInputDisabled(true);

    if (fsm.getState() === States.COLLECTING_NAME) {
      if (/^[a-zA-Z\s]+$/.test(userInput)) {
        setUserName(userInput);
        fsm.transition(Transitions.NAME_PROVIDED);
        const botMessage: Message = { 
          text: `Nice to meet you, ${userInput}! Let’s build your personalized AI agent. To get started, I’ll need a document to train on—like a PDF of your business materials, process guides, or product details. This helps me tailor insights just for you!\nWhat happens next?\nUpload: Share your file (PDF/JPEG under 10MB).\nTrain: I’ll analyze and convert it into AI-friendly data.\nVerify: I’ll check for clarity and completeness.\nDon’t worry—your data is secure and only used to power your AI tools. Ready to begin?`,
          isUser: false, 
          isTyping: true, 
          id: messages.length + 1 
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } else {
        const botMessage: Message = { 
          text: "Please provide a valid name. Names can only contain letters and spaces.", 
          isUser: false, 
          isTyping: true, 
          id: messages.length + 1 
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      }
    }

    // const botResponse = "This is a placeholder response."; // Get responses from LLM later down the line
    // const botReply: Message = { text: botResponse, isUser: false, isTyping: true, id: messages.length + 1 };
    // setMessages((prevMessages) => [...prevMessages, botReply]);
  };

  return { fsm, buttonClickHandler, typingCompleteHandler, processTextInputHandler, isButtonGroupVisible: true };
};

export default useChatStateMachine;