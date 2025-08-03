import { useState } from 'react';
import { createStateMachine, States, Transitions, StateMachine } from '../state/FiniteStateMachine';
import { Message } from '../utils/chatUtils';
import { emailVerificationApi } from '../api/emailVerificationApi';
import { SessionApi } from '../api/sessionApi';
import { useSession } from '../contexts/SessionContext';
import { getOrCreateSessionUUID } from '../utils/sessionUtils';

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
  const [pendingEmail, setPendingEmail] = useState<string>(''); // Track email being verified
  const { state } = useSession();
  const sessionUUID = state.sessionUUID;

  const persistPartialSession = async (name: string) => {
    try {
      // Ensure we have a UUID
      const uuid = state.sessionUUID || (await getOrCreateSessionUUID());

      // Validate name
      if (!/^[a-zA-Z\s]+$/.test(name)) {
        throw new Error('Invalid name format');
      }

      // Persist session with just name
      await SessionApi.persistSession(uuid, name);

      return uuid;
    } catch (error) {
      console.error('Error persisting partial session:', error);
      throw error;
    }
  };

  const completeSessionPersistence = async (email: string) => {
    try {
      // Validate email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Invalid email format');
      }

      // Use existing UUID or generate new
      const uuid = state.sessionUUID || (await getOrCreateSessionUUID());

      // Full session persistence
      const response = await SessionApi.persistSession(uuid, undefined, email);

      return response;
    } catch (error) {
      console.error('Error completing session persistence:', error);
      throw error;
    }
  };

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

    // Handle transition to EMAIL_VERIFICATION_CODE_INPUT state
    if (
      fsm.getState() === States.EMAIL_VERIFICATION_CODE_INPUT &&
      messageId === messages.length - 1
    ) {
      // The verification code message has finished typing
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

          await persistPartialSession(userInput);

          fsm.transition(Transitions.NAME_PROVIDED);
          const botMessage: Message = {
            text: `Nice to meet you, ${userInput}! Perfect! Now let's upload a document to train your AI agent. This could be a PDF of your business materials, process guides, or product details.`,
            isUser: false,
            isTyping: true,
            id: messages.length + 1,
          };
          setMessages(prevMessages => [...prevMessages, botMessage]);
        } catch (error: unknown) {
          console.error('Error persisting session:', error);
          // Handle error (show error message)
        }
      }
    } else if (fsm.getState() === States.COLLECTING_EMAIL) {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInput)) {
        try {
          // Store the email for verification
          setPendingEmail(userInput);

          // Send verification code instead of persisting immediately
          if (!sessionUUID) {
            throw new Error('Session UUID is required');
          }
          const verificationResponse = await emailVerificationApi.verifyEmail(sessionUUID, {
            email: userInput,
          });

          if (verificationResponse.status === 'success') {
            // Transition to verification sending state
            fsm.transition(Transitions.EMAIL_PROVIDED);
            // Then immediately transition to code input state
            fsm.transition(Transitions.EMAIL_CODE_SENT);

            const botMessage: Message = {
              text: `I've sent a verification code to ${userInput}. Please check your email and enter the 6-digit code.\n\nIf you don't see the email, check your spam folder or type "resend" to send another code.`,
              isUser: false,
              isTyping: true,
              id: messages.length + 1,
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);
          } else {
            // Handle verification sending error
            const errorMessage: Message = {
              text: `Sorry, I couldn't send a verification code to ${userInput}. Please check the email address and try again.`,
              isUser: false,
              isTyping: true,
              id: messages.length + 1,
            };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
            setIsInputDisabled(false);
          }
        } catch (error: unknown) {
          console.error('Error sending verification code:', error);
          const errorMessage: Message = {
            text: 'Sorry, there was an error sending the verification code. Please try again.',
            isUser: false,
            isTyping: true,
            id: messages.length + 1,
          };
          setMessages(prevMessages => [...prevMessages, errorMessage]);
          setIsInputDisabled(false);
        }
      } else {
        // Invalid email format
        const errorMessage: Message = {
          text: 'Please enter a valid email address.',
          isUser: false,
          isTyping: true,
          id: messages.length + 1,
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
        setIsInputDisabled(false);
      }
    } else if (fsm.getState() === States.EMAIL_VERIFICATION_CODE_INPUT) {
      // Handle resend request
      if (userInput.toLowerCase() === 'resend') {
        try {
          if (!sessionUUID) {
            throw new Error('Session UUID is required');
          }
          const resendResponse = await emailVerificationApi.resendCode(sessionUUID);

          if (resendResponse.status === 'success') {
            const botMessage: Message = {
              text: `I've sent a new verification code to ${pendingEmail}. Please check your email and enter the 6-digit code.`,
              isUser: false,
              isTyping: true,
              id: messages.length + 1,
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);
          } else {
            const errorMessage: Message = {
              text: "Sorry, I couldn't resend the verification code. Please wait a moment and try again.",
              isUser: false,
              isTyping: true,
              id: messages.length + 1,
            };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
            setIsInputDisabled(false);
          }
        } catch (error: unknown) {
          console.error('Error resending verification code:', error);
          const errorMessage: Message = {
            text: 'Sorry, there was an error resending the verification code. Please try again later.',
            isUser: false,
            isTyping: true,
            id: messages.length + 1,
          };
          setMessages(prevMessages => [...prevMessages, errorMessage]);
          setIsInputDisabled(false);
        }
      } else if (/^\d{6}$/.test(userInput)) {
        // 6-digit code validation
        try {
          if (!sessionUUID) {
            throw new Error('Session UUID is required');
          }
          const verificationResponse = await emailVerificationApi.verifyCode(sessionUUID, {
            code: userInput,
          });

          if (verificationResponse.status === 'success') {
            // Now complete session persistence with the verified email
            await completeSessionPersistence(pendingEmail);

            // Transition to verification complete state
            fsm.transition(Transitions.EMAIL_CODE_VERIFIED);

            const botMessage: Message = {
              text: `Perfect! Your email has been verified. Your AI agent setup is now complete!`,
              isUser: false,
              isTyping: true,
              id: messages.length + 1,
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);

            // Clear the pending email
            setPendingEmail('');
          } else {
            // Handle verification failure
            const errorMessage: Message = {
              text: 'The verification code is incorrect. Please check your email and try again, or type "resend" to get a new code.',
              isUser: false,
              isTyping: true,
              id: messages.length + 1,
            };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
            setIsInputDisabled(false);
          }
        } catch (error: unknown) {
          console.error('Error verifying code:', error);
          const errorMessage: Message = {
            text: 'Sorry, there was an error verifying the code. Please try again.',
            isUser: false,
            isTyping: true,
            id: messages.length + 1,
          };
          setMessages(prevMessages => [...prevMessages, errorMessage]);
          setIsInputDisabled(false);
        }
      } else {
        // Invalid code format
        const errorMessage: Message = {
          text: 'Please enter a 6-digit verification code, or type "resend" to get a new code.',
          isUser: false,
          isTyping: true,
          id: messages.length + 1,
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
        setIsInputDisabled(false);
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
