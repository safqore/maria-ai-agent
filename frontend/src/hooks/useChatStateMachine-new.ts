import { useState } from 'react';
import { createStateMachine, States, Transitions, StateMachine } from '../state/FiniteStateMachine';
import { Message } from '../utils/chatUtils';

interface ChatStateMachineOptions {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsInputDisabled: React.Dispatch<React.SetStateAction<boolean>>;
  setIsButtonGroupVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const useChatStateMachine = ({
  messages,
  setMessages,
  setIsInputDisabled,
  setIsButtonGroupVisible,
}: ChatStateMachineOptions) => {
  const [fsm] = useState<StateMachine>(createStateMachine());

  const typingCompleteHandler = (messageId: number) => {
    setMessages(prevMessages =>
      prevMessages.map(msg => (msg.id === messageId ? { ...msg, isTyping: false } : msg))
    );

    if (messageId !== 0) {
      setIsInputDisabled(false);
    }

    // If this is the welcome message
    if (messageId === 0) {
      // Enable input and show buttons after welcome message is typed
      setIsInputDisabled(false);
      setIsButtonGroupVisible(true);
      fsm.transition(Transitions.WELCOME_MSG_COMPLETE);
      console.log('Welcome message complete, new state:', fsm.getState());
    }

    if (fsm.getState() === States.OPPTYS_EXIST_MSG && messageId === messages.length - 1) {
      fsm.transition(Transitions.OPPTYS_EXIST_MSG_COMPLETE);
      setIsButtonGroupVisible(true);
    }

    if (fsm.getState() === States.ENGAGE_USR_AGAIN && messageId === messages.length - 1) {
      setIsButtonGroupVisible(true);
    }

    if (fsm.getState() === States.UPLOAD_DOCS_MSG && messageId === messages.length - 1) {
      fsm.transition(Transitions.UPLOAD_DOCS_MSG_COMPLETE);
    }
  };

  const buttonClickHandler = (response: string) => {
    console.log('Button clicked:', response, 'Current state:', fsm.getState());

    const displayValue = fsm.getResponseDisplayValue(response) || response;
    const userMessage: Message = {
      text: displayValue,
      isUser: true,
      isTyping: false,
      id: messages.length,
    };

    setMessages([...messages, userMessage]);

    // Hide the button group after clicking
    setIsButtonGroupVisible(false);

    // Remove buttons from messages
    setMessages(prevMessages => prevMessages.filter(msg => !msg.buttons));

    if (
      (fsm.canTransition(Transitions.YES_CLICKED) && response === 'YES_CLICKED') ||
      (fsm.canTransition(Transitions.LETS_GO_CLICKED) && response === 'LETS_GO_CLICKED')
    ) {
      fsm.transition(
        response === 'YES_CLICKED' ? Transitions.YES_CLICKED : Transitions.LETS_GO_CLICKED
      );

      const botMessage: Message = {
        text: "Absolutely! Let's get started. First things first — what's your name?",
        isUser: false,
        isTyping: true,
        id: messages.length + 1,
      };

      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else if (fsm.canTransition(Transitions.NO_CLICKED) && response === 'NO_CLICKED') {
      fsm.transition(Transitions.NO_CLICKED);

      const botMessage: Message = {
        text: '💡 Psst… Great opportunities start with a "yes." Change your mind? Click "Let\'s Go" anytime!',
        isUser: false,
        isTyping: true,
        id: messages.length + 1,
      };

      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else if (
      fsm.canTransition(Transitions.MAYBE_NEXT_TIME_CLICKED) &&
      response === 'MAYBE_NEXT_TIME_CLICKED'
    ) {
      fsm.transition(Transitions.MAYBE_NEXT_TIME_CLICKED);

      const botMessage: Message = {
        text: "I'll be here when you're ready!",
        isUser: false,
        isTyping: true,
        id: messages.length + 1,
      };

      setMessages(prevMessages => [...prevMessages, botMessage]);
      setIsButtonGroupVisible(true);
    }
  };

  const processTextInputHandler = (userInput: string) => {
    if (userInput.trim() === '') return;

    const newUserMessage: Message = {
      text: userInput,
      isUser: true,
      isTyping: false,
      id: messages.length,
    };

    setMessages([...messages, newUserMessage]);
    setIsInputDisabled(true);

    if (fsm.getState() === States.COLLECTING_NAME) {
      if (/^[a-zA-Z\s]+$/.test(userInput)) {
        fsm.transition(Transitions.NAME_PROVIDED);
        const botMessage: Message = {
          text: `Nice to meet you, ${userInput}! Let's build your personalized AI agent.\n\nTo get started, I'll need a document to train on—like a PDF of your business materials, process guides, or product details. This helps me tailor insights just for you!`,
          isUser: false,
          isTyping: true,
          id: messages.length + 1,
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } else {
        const botMessage: Message = {
          text: 'Please provide a valid name. Names can only contain letters and spaces.',
          isUser: false,
          isTyping: true,
          id: messages.length + 1,
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      }
    }
  };

  const fileUploadHandler = (file: File) => {
    console.log('File uploaded:', file);
    setMessages([
      ...messages,
      {
        text: `File "${file.name}" uploaded successfully!`,
        isUser: false,
        isTyping: true,
        id: messages.length + 1,
      },
    ]);
  };

  return {
    fsm,
    buttonClickHandler,
    typingCompleteHandler,
    processTextInputHandler,
    fileUploadHandler,
    isButtonGroupVisible: true,
  };
};

export default useChatStateMachine;
