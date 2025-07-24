import { useState } from 'react';
import { createStateMachine, States, Transitions, StateMachine } from '../state/FiniteStateMachine';
import { Message } from '../utils/chatUtils';
import { emailVerificationApi } from '../api/emailVerificationApi';
import { SessionApi } from '../api/sessionApi';
import { useSession } from '../contexts/SessionContext';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const { state } = useSession();
  const sessionUUID = state.sessionUUID;

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

    // Handle transition to COLLECTING_EMAIL state
    if (fsm.getState() === States.COLLECTING_EMAIL && messageId === messages.length - 1) {
      // The email collection message has finished typing
      setIsInputDisabled(false);
    }
  };

  const buttonClickHandler = (response: string) => {
    console.log('Button clicked:', response, 'Current state:', fsm.getState());

    // Prevent multiple rapid clicks
    if (isProcessing) {
      console.log('Ignoring button click - already processing');
      return;
    }

    setIsProcessing(true);

    // Reset processing flag after a delay to prevent accidental double-clicks
    setTimeout(() => setIsProcessing(false), 1000);

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

    if (fsm.getState() === States.COLLECTING_NAME) {
      if (/^[a-zA-Z\s]+$/.test(userInput)) {
        try {
          // Persist the session with the user's name
          if (!sessionUUID) {
            throw new Error('Session UUID is required');
          }

          // Validate UUID format
          const uuidPattern =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidPattern.test(sessionUUID)) {
            throw new Error('Invalid session UUID format');
          }

          console.log('Persisting session with UUID:', sessionUUID, 'Name:', userInput);
          const response = await SessionApi.persistSession(sessionUUID, userInput);
          console.log('Session persistence response:', response);

          fsm.transition(Transitions.NAME_PROVIDED);
          const botMessage: Message = {
            text: `Nice to meet you, ${userInput}! Let's build your personalized AI agent.\n\nTo get started, I'll need a document to train on—like a PDF of your business materials, process guides, or product details. This helps me tailor insights just for you!`,
            isUser: false,
            isTyping: true,
            id: messages.length + 1,
          };
          setMessages(prevMessages => [...prevMessages, botMessage]);
        } catch (error: unknown) {
          console.error('Error persisting session:', error);

          // Enhanced error handling with more specific error types
          let errorMessage = 'Failed to save your information';
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null) {
            errorMessage = (error as any)?.error || (error as any)?.message || errorMessage;
          }

          const botMessage: Message = {
            text: `Sorry, I couldn't save your information: ${errorMessage}. Please try again.`,
            isUser: false,
            isTyping: true,
            id: messages.length + 1,
          };
          setMessages(prevMessages => [...prevMessages, botMessage]);
        }
      } else {
        const botMessage: Message = {
          text: 'Please provide a valid name. Names can only contain letters and spaces.',
          isUser: false,
          isTyping: true,
          id: messages.length + 1,
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      }
    } else if (fsm.getState() === States.COLLECTING_EMAIL) {
      // Handle email input in regular chat input
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(userInput)) {
        // First transition to EMAIL_VERIFICATION_SENDING state
        fsm.transition(Transitions.EMAIL_PROVIDED);

        try {
          // Call the email verification API
          if (!sessionUUID) {
            throw new Error('Session UUID is required');
          }
          const response = await emailVerificationApi.verifyEmail(sessionUUID, {
            email: userInput,
          });

          if (response.status === 'success') {
            fsm.transition(Transitions.EMAIL_CODE_SENT);
            const botMessage: Message = {
              text: `I've sent a verification code to ${userInput}. Please check your email and enter the 6-digit code below.`,
              isUser: false,
              isTyping: true,
              id: messages.length + 1,
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);
          } else {
            fsm.transition(Transitions.EMAIL_VERIFICATION_FAILED);
            const botMessage: Message = {
              text: `Sorry, I couldn't send the verification code: ${response.error}. Please try again.`,
              isUser: false,
              isTyping: true,
              id: messages.length + 1,
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);
          }
        } catch (error: unknown) {
          fsm.transition(Transitions.EMAIL_VERIFICATION_FAILED);
          const errorMessage =
            (error as any)?.error || (error as any)?.message || 'Failed to send verification code';
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
    } else if (fsm.getState() === States.EMAIL_VERIFICATION_CODE_INPUT) {
      // Handle verification code input
      const codeRegex = /^\d{6}$/;
      if (codeRegex.test(userInput)) {
        try {
          // Call the verification API
          if (!sessionUUID) {
            throw new Error('Session UUID is required');
          }
          const response = await emailVerificationApi.verifyCode(sessionUUID, {
            code: userInput,
          });

          if (response.status === 'success') {
            fsm.transition(Transitions.EMAIL_CODE_VERIFIED);
            const botMessage: Message = {
              text: `Great! Your email has been verified successfully. Your AI agent is now ready to help you!`,
              isUser: false,
              isTyping: true,
              id: messages.length + 1,
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);
          } else {
            fsm.transition(Transitions.EMAIL_VERIFICATION_FAILED);
            const botMessage: Message = {
              text: `Sorry, that verification code is not correct: ${response.error}. Please try again.`,
              isUser: false,
              isTyping: true,
              id: messages.length + 1,
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);
          }
        } catch (error: unknown) {
          fsm.transition(Transitions.EMAIL_VERIFICATION_FAILED);
          const errorMessage =
            (error as any)?.error || (error as any)?.message || 'Failed to verify code';
          const botMessage: Message = {
            text: `Sorry, there was an error verifying your code: ${errorMessage}. Please try again.`,
            isUser: false,
            isTyping: true,
            id: messages.length + 1,
          };
          setMessages(prevMessages => [...prevMessages, botMessage]);
        }
      } else {
        const botMessage: Message = {
          text: 'Please enter a valid 6-digit verification code.',
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

    // Transition to COLLECTING_EMAIL state
    if (fsm.getState() === States.UPLOAD_DOCS) {
      fsm.transition(Transitions.DOCS_UPLOADED);

      setMessages(prevMessages => [
        ...prevMessages,
        {
          text: `File "${file.name}" uploaded successfully!`,
          isUser: false,
          isTyping: true,
          id: prevMessages.length + 1,
        },
        {
          text: `Perfect! Now I need your email address to send you a verification code and complete your AI agent setup.`,
          isUser: false,
          isTyping: true,
          id: prevMessages.length + 2,
        },
      ]);
    } else {
      setMessages([
        ...messages,
        {
          text: `File "${file.name}" uploaded successfully!`,
          isUser: false,
          isTyping: true,
          id: messages.length + 1,
        },
      ]);
    }
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
