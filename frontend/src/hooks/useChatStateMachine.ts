import React from 'react';
import { createStateMachine, States, Transitions, StateMachine } from '../state/FiniteStateMachine';
import { Message } from '../utils/chatUtils';
import { emailVerificationApi } from '../api/emailVerificationApi';

interface ChatStateMachineOptions {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsInputDisabled: React.Dispatch<React.SetStateAction<boolean>>;
  setIsButtonGroupVisible: React.Dispatch<React.SetStateAction<boolean>>;
  sessionUUID?: string;
  setUserName?: (name: string) => void;
  fsm?: StateMachine; // Accept FSM as parameter
}

const useChatStateMachine = ({
  messages,
  setMessages,
  setIsInputDisabled,
  setIsButtonGroupVisible,
  sessionUUID,
  setUserName,
  fsm,
}: ChatStateMachineOptions) => {
  // Use provided FSM or create a new one if not provided
  const defaultStateMachine = React.useMemo(() => createStateMachine(), []);
  const stateMachine = fsm || defaultStateMachine;

  const typingCompleteHandler = (messageId: number) => {
    setMessages(prevMessages =>
      prevMessages.map(msg => (msg.id === messageId ? { ...msg, isTyping: false } : msg))
    );
    setIsInputDisabled(false);
  };

  const buttonClickHandler = (response: string) => {
    if (stateMachine.canTransition(Transitions.YES_CLICKED) && response === 'YES_CLICKED') {
      stateMachine.transition(Transitions.YES_CLICKED);
      const botMessage: Message = {
        text: "Absolutely! Let's get started. First things first — what's your name?",
        isUser: false,
        isTyping: true,
        id: messages.length + 1,
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else if (stateMachine.canTransition(Transitions.NO_CLICKED) && response === 'NO_CLICKED') {
      stateMachine.transition(Transitions.NO_CLICKED);
      const botMessage: Message = {
        text: 'I understand! But I think there are some great opportunities we could explore together. Would you like to hear about them?',
        isUser: false,
        isTyping: true,
        id: messages.length + 1,
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else if (
      stateMachine.canTransition(Transitions.LETS_GO_CLICKED) &&
      response === 'LETS_GO_CLICKED'
    ) {
      stateMachine.transition(Transitions.LETS_GO_CLICKED);
      const botMessage: Message = {
        text: "Great! Let's get started. First things first — what's your name?",
        isUser: false,
        isTyping: true,
        id: messages.length + 1,
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else if (
      stateMachine.canTransition(Transitions.MAYBE_NEXT_TIME_CLICKED) &&
      response === 'MAYBE_NEXT_TIME_CLICKED'
    ) {
      stateMachine.transition(Transitions.MAYBE_NEXT_TIME_CLICKED);
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

  const processTextInputHandler = async (userInput: string) => {
    if (userInput.trim() === '') return;

    const newUserMessage: Message = {
      text: userInput,
      isUser: true,
      isTyping: false,
      id: messages.length,
    };
    setMessages([...messages, newUserMessage]);
    setIsInputDisabled(true);

    if (stateMachine.getState() === States.COLLECTING_NAME) {
      if (/^[a-zA-Z\s]+$/.test(userInput)) {
        setUserName?.(userInput);
        stateMachine.transition(Transitions.NAME_PROVIDED);
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
    } else if (stateMachine.getState() === States.COLLECTING_EMAIL) {
      // Handle email input in regular chat input
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(userInput)) {
        // First transition to EMAIL_VERIFICATION_SENDING state
        stateMachine.transition(Transitions.EMAIL_PROVIDED);

        try {
          // Call the email verification API
          const response = await emailVerificationApi.verifyEmail(sessionUUID!, {
            email: userInput,
          });

          if (response.status === 'success') {
            stateMachine.transition(Transitions.EMAIL_CODE_SENT);
            const botMessage: Message = {
              text: `I've sent a verification code to ${userInput}. Please check your email and enter the 6-digit code below.`,
              isUser: false,
              isTyping: true,
              id: messages.length + 1,
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);
          } else {
            stateMachine.transition(Transitions.EMAIL_VERIFICATION_FAILED);
            const botMessage: Message = {
              text: `Sorry, I couldn't send the verification code: ${response.error}. Please try again.`,
              isUser: false,
              isTyping: true,
              id: messages.length + 1,
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);
          }
        } catch (error: any) {
          stateMachine.transition(Transitions.EMAIL_VERIFICATION_FAILED);
          const errorMessage = error?.error || error?.message || 'Failed to send verification code';
          const botMessage: Message = {
            text: `Sorry, I couldn't send the verification code: ${errorMessage}. Please try again.`,
            isUser: false,
            isTyping: true,
            id: messages.length + 1,
          };
          setMessages(prevMessages => [...prevMessages, botMessage]);
        }
      } else {
        const botMessage: Message = {
          text: 'Please enter a valid email address.',
          isUser: false,
          isTyping: true,
          id: messages.length + 1,
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      }
    }

    // const botResponse = "This is a placeholder response."; // Get responses from LLM later down the line
    // const botReply: Message = { text: botResponse, isUser: false, isTyping: true, id: messages.length + 1 };
    // setMessages((prevMessages) => [...prevMessages, botReply]);
  };

  const fileUploadHandler = (file: File) => {
    //  Process the uploaded file.  This is a placeholder; replace with your actual logic.
    console.log('File uploaded:', file);
    // Example: Add a message to indicate file upload
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

  // Don't need to return isButtonGroupVisible as it's now managed by the parent component
  return {
    fsm: stateMachine,
    buttonClickHandler,
    typingCompleteHandler,
    processTextInputHandler,
    fileUploadHandler,
  };
};

export default useChatStateMachine;
