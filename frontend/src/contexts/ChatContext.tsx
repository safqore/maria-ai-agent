import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Message } from '../utils/chatUtils';
import { StateMachine, States, Transitions } from '../state/FiniteStateMachine';
import { ChatApi, ChatResponse, ApiError, ApiErrorType } from '../api';
import { useSessionUUID } from '../hooks/useSessionUUID';

/**
 * Button interface for chat interactions
 * @interface ChatButton
 */
export interface ChatButton {
  /** Display text for the button */
  text: string;
  /** Value used when the button is clicked */
  value: string;
}

/**
 * Chat state interface defining the data structure for chat state
 * @interface ChatState
 */
export interface ChatState {
  /** List of chat messages */
  messages: Message[];
  /** Whether the input is disabled */
  isInputDisabled: boolean;
  /** Whether buttons are visible */
  isButtonGroupVisible: boolean;
  /** Current loading state */
  isLoading: boolean;
  /** Error message, if any */
  error: string | null;
  /** Error type for more specific handling */
  errorType?: ApiErrorType;
  /** Current finite state machine state */
  currentFsmState?: States;
  /** Last correlation ID from API for tracking and debugging */
  lastCorrelationId?: string;
  /** API request in progress flag */
  isApiRequestInProgress: boolean;
  /** Email verification state */
  emailVerification: {
    /** Whether email verification is in progress */
    isInProgress: boolean;
    /** The email address being verified */
    email?: string;
    /** Whether email has been sent */
    isEmailSent: boolean;
    /** Whether email has been verified */
    isVerified: boolean;
  };
}

/**
 * Chat action types enum
 * @enum {string}
 */
export enum ChatActionTypes {
  /** Add a user message to the chat */
  ADD_USER_MESSAGE = 'ADD_USER_MESSAGE',
  /** Add a bot message to the chat */
  ADD_BOT_MESSAGE = 'ADD_BOT_MESSAGE',
  /** Mark a message as completed typing */
  SET_MESSAGE_TYPING_COMPLETE = 'SET_MESSAGE_TYPING_COMPLETE',
  /** Enable/disable user input */
  SET_INPUT_DISABLED = 'SET_INPUT_DISABLED',
  /** Show/hide button group */
  SET_BUTTON_GROUP_VISIBLE = 'SET_BUTTON_GROUP_VISIBLE',
  /** Remove buttons from messages */
  REMOVE_MESSAGE_BUTTONS = 'REMOVE_MESSAGE_BUTTONS',
  /** Set error state */
  SET_ERROR = 'SET_ERROR',
  /** Clear error state */
  CLEAR_ERROR = 'CLEAR_ERROR',
  /** Set loading state */
  SET_LOADING = 'SET_LOADING',
  /** Update FSM state */
  UPDATE_FSM_STATE = 'UPDATE_FSM_STATE',
  /** Set API request in progress flag */
  SET_API_REQUEST_STATUS = 'SET_API_REQUEST_STATUS',
  /** Set correlation ID from API response */
  SET_CORRELATION_ID = 'SET_CORRELATION_ID',
  /** Set detailed error information */
  SET_DETAILED_ERROR = 'SET_DETAILED_ERROR',
  /** Reset chat to initial state */
  RESET_CHAT = 'RESET_CHAT',
  /** Start email verification process */
  START_EMAIL_VERIFICATION = 'START_EMAIL_VERIFICATION',
  /** Email verification code sent */
  EMAIL_CODE_SENT = 'EMAIL_CODE_SENT',
  /** Email verification completed */
  EMAIL_VERIFICATION_COMPLETE = 'EMAIL_VERIFICATION_COMPLETE',
  /** Reset email verification state */
  RESET_EMAIL_VERIFICATION = 'RESET_EMAIL_VERIFICATION',
}

/**
 * Chat action union type for reducer
 * @typedef {Object} ChatAction
 */
export type ChatAction =
  | { type: ChatActionTypes.ADD_USER_MESSAGE; payload: { text: string } }
  | {
      type: ChatActionTypes.ADD_BOT_MESSAGE;
      payload: { text: string; buttons?: ChatButton[] };
    }
  | { type: ChatActionTypes.SET_MESSAGE_TYPING_COMPLETE; payload: { messageId: number } }
  | { type: ChatActionTypes.SET_INPUT_DISABLED; payload: { isDisabled: boolean } }
  | { type: ChatActionTypes.SET_BUTTON_GROUP_VISIBLE; payload: { isVisible: boolean } }
  | { type: ChatActionTypes.REMOVE_MESSAGE_BUTTONS; payload: Record<string, never> }
  | { type: ChatActionTypes.SET_ERROR; payload: { error: string } }
  | { type: ChatActionTypes.CLEAR_ERROR; payload: Record<string, never> }
  | { type: ChatActionTypes.SET_LOADING; payload: { isLoading: boolean } }
  | { type: ChatActionTypes.UPDATE_FSM_STATE; payload: { state: States } }
  | { type: ChatActionTypes.SET_API_REQUEST_STATUS; payload: { isInProgress: boolean } }
  | { type: ChatActionTypes.SET_CORRELATION_ID; payload: { correlationId?: string } }
  | {
      type: ChatActionTypes.SET_DETAILED_ERROR;
      payload: { error: string; errorType: ApiErrorType; correlationId?: string };
    }
  | { type: ChatActionTypes.RESET_CHAT; payload: Record<string, never> }
  | { type: ChatActionTypes.START_EMAIL_VERIFICATION; payload: { email: string } }
  | { type: ChatActionTypes.EMAIL_CODE_SENT; payload: Record<string, never> }
  | { type: ChatActionTypes.EMAIL_VERIFICATION_COMPLETE; payload: Record<string, never> }
  | { type: ChatActionTypes.RESET_EMAIL_VERIFICATION; payload: Record<string, never> };

/**
 * Initial welcome message
 */
const welcomeMessage =
  "👋 Hi there! I'm Maria, your AI guide at Safqore. Ready to discover how we can help you grow?";

/**
 * Initial chat state
 */
/**
 * Initial chat state
 */
const initialState: ChatState = {
  messages: [{ text: welcomeMessage, isUser: false, isTyping: true, id: 0 }],
  isInputDisabled: false,
  isButtonGroupVisible: true,
  isLoading: false,
  error: null,
  errorType: undefined,
  currentFsmState: States.WELCOME_MSG,
  lastCorrelationId: undefined,
  isApiRequestInProgress: false,
  emailVerification: {
    isInProgress: false,
    email: undefined,
    isEmailSent: false,
    isVerified: false,
  },
};

/**
 * Chat reducer function to manage state transitions
 * @param {ChatState} state - Current state
 * @param {ChatAction} action - Action to process
 * @returns {ChatState} New state
 */
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case ChatActionTypes.ADD_USER_MESSAGE:
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            text: action.payload.text,
            isUser: true,
            isTyping: false,
            id: state.messages.length,
          },
        ],
      };

    case ChatActionTypes.ADD_BOT_MESSAGE:
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            text: action.payload.text,
            isUser: false,
            isTyping: true,
            id: state.messages.length,
            buttons: action.payload.buttons,
          },
        ],
      };

    case ChatActionTypes.SET_MESSAGE_TYPING_COMPLETE:
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId ? { ...msg, isTyping: false } : msg
        ),
      };

    case ChatActionTypes.SET_INPUT_DISABLED:
      return {
        ...state,
        isInputDisabled: action.payload.isDisabled,
      };

    case ChatActionTypes.SET_BUTTON_GROUP_VISIBLE:
      return {
        ...state,
        isButtonGroupVisible: action.payload.isVisible,
      };

    case ChatActionTypes.REMOVE_MESSAGE_BUTTONS:
      return {
        ...state,
        messages: state.messages.map(msg => ({ ...msg, buttons: undefined })),
      };

    case ChatActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload.error,
      };

    case ChatActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case ChatActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading,
      };

    case ChatActionTypes.UPDATE_FSM_STATE:
      return {
        ...state,
        currentFsmState: action.payload.state,
      };

    case ChatActionTypes.SET_API_REQUEST_STATUS:
      return {
        ...state,
        isApiRequestInProgress: action.payload.isInProgress,
      };

    case ChatActionTypes.SET_CORRELATION_ID:
      return {
        ...state,
        lastCorrelationId: action.payload.correlationId,
      };

    case ChatActionTypes.SET_DETAILED_ERROR:
      return {
        ...state,
        error: action.payload.error,
        errorType: action.payload.errorType,
        lastCorrelationId: action.payload.correlationId || state.lastCorrelationId,
      };

    case ChatActionTypes.RESET_CHAT:
      return {
        ...initialState,
      };

    case ChatActionTypes.START_EMAIL_VERIFICATION:
      return {
        ...state,
        emailVerification: {
          ...state.emailVerification,
          isInProgress: true,
          email: action.payload.email,
          isEmailSent: false,
          isVerified: false,
        },
      };

    case ChatActionTypes.EMAIL_CODE_SENT:
      return {
        ...state,
        emailVerification: {
          ...state.emailVerification,
          isEmailSent: true,
        },
      };

    case ChatActionTypes.EMAIL_VERIFICATION_COMPLETE:
      return {
        ...state,
        emailVerification: {
          ...state.emailVerification,
          isInProgress: false,
          isVerified: true,
        },
      };

    case ChatActionTypes.RESET_EMAIL_VERIFICATION:
      return {
        ...state,
        emailVerification: {
          isInProgress: false,
          email: undefined,
          isEmailSent: false,
          isVerified: false,
        },
      };

    default:
      return state;
  }
};

/**
 * Chat context interface defining all available methods and state
 * @interface ChatContextValue
 */
interface ChatContextValue {
  /** Current chat state */
  state: ChatState;
  /** Function to add a user message */
  addUserMessage: (text: string) => void;
  /** Function to add a bot message */
  addBotMessage: (text: string, buttons?: ChatButton[]) => void;
  /** Function to mark a message as typing complete */
  setMessageTypingComplete: (messageId: number) => void;
  /** Function to set input disabled state */
  setInputDisabled: (isDisabled: boolean) => void;
  /** Function to set button group visibility */
  setButtonGroupVisible: (isVisible: boolean) => void;
  /** Function to remove all message buttons */
  removeMessageButtons: () => void;
  /** Function to set an error message */
  setError: (error: string) => void;
  /** Function to clear the error message */
  clearError: () => void;
  /** Function to set loading state */
  setLoading: (isLoading: boolean) => void;
  /** Function to update FSM state */
  updateFsmState: (state: States) => void;
  /** Function to handle button clicks */
  handleButtonClick: (value: string) => void;
  /** Function to send a message and process response */
  sendMessage: (text: string) => Promise<void>;
  /** Function to reset the conversation */
  resetChat: () => void;
  /** Function to set API request status */
  setApiRequestStatus: (isInProgress: boolean) => void;
  /** Function to set correlation ID */
  setCorrelationId: (correlationId?: string) => void;
  /** Function to set detailed error information */
  setDetailedError: (error: string, errorType: ApiErrorType, correlationId?: string) => void;
  /** Function to start email verification process */
  startEmailVerification: (email: string) => void;
  /** Function to mark email code as sent */
  emailCodeSent: () => void;
  /** Function to mark email verification as complete */
  emailVerificationComplete: () => void;
  /** Function to reset email verification state */
  resetEmailVerification: () => void;
}

/**
 * Chat context
 */
const ChatContext = createContext<ChatContextValue | undefined>(undefined);

/**
 * Chat provider props
 * @interface ChatProviderProps
 */
interface ChatProviderProps {
  /** Child components */
  children: ReactNode;
  /** Optional FSM to use */
  fsm?: StateMachine;
}

/**
 * Chat context provider component
 * @param {ChatProviderProps} props - Provider props
 * @returns {React.ReactElement} Provider component
 */
export const ChatProvider: React.FC<ChatProviderProps> = ({ children, fsm }) => {
  // Use the reducer to manage state
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Use the session UUID hook
  const { sessionUUID } = useSessionUUID();

  /**
   * Enable or disable user input
   * @param {boolean} isDisabled - Whether input should be disabled
   */
  const setInputDisabled = useCallback((isDisabled: boolean): void => {
    dispatch({ type: ChatActionTypes.SET_INPUT_DISABLED, payload: { isDisabled } });
  }, []);

  /**
   * Show or hide button groups
   * @param {boolean} isVisible - Whether buttons should be visible
   */
  const setButtonGroupVisible = useCallback((isVisible: boolean): void => {
    dispatch({ type: ChatActionTypes.SET_BUTTON_GROUP_VISIBLE, payload: { isVisible } });
  }, []);

  /**
   * Update FSM state
   * @param {States} state - New FSM state
   */
  const updateFsmState = useCallback((state: States): void => {
    dispatch({ type: ChatActionTypes.UPDATE_FSM_STATE, payload: { state } });
  }, []);

  /**
   * Add a user message to the chat
   * @param {string} text - Message text
   */
  const addUserMessage = useCallback((text: string): void => {
    dispatch({ type: ChatActionTypes.ADD_USER_MESSAGE, payload: { text } });
  }, []);

  /**
   * Add a bot message to the chat
   * @param {string} text - Message text
   * @param {ChatButton[]} [buttons] - Interactive buttons
   */
  const addBotMessage = useCallback((text: string, buttons?: ChatButton[]): void => {
    dispatch({ type: ChatActionTypes.ADD_BOT_MESSAGE, payload: { text, buttons } });
  }, []);

  /**
   * Mark a message as finished typing
   * @param {number} messageId - ID of the message
   */
  const setMessageTypingComplete = useCallback(
    (messageId: number): void => {
      dispatch({ type: ChatActionTypes.SET_MESSAGE_TYPING_COMPLETE, payload: { messageId } });

      // Handle special cases for certain message IDs
      if (messageId === 0 && fsm) {
        // Welcome message is done typing
        fsm.transition(Transitions.WELCOME_MSG_COMPLETE);
        updateFsmState(fsm.getCurrentState());
        setInputDisabled(false);
        setButtonGroupVisible(true);
      } else {
        // For other messages, just enable input
        setInputDisabled(false);
      }

      // Handle state-specific actions when typing completes
      if (
        fsm &&
        state.currentFsmState === States.OPPTYS_EXIST_MSG &&
        messageId === state.messages.length - 1
      ) {
        fsm.transition(Transitions.OPPTYS_EXIST_MSG_COMPLETE);
        updateFsmState(fsm.getCurrentState());
        setButtonGroupVisible(true);
      }

      if (
        fsm &&
        state.currentFsmState === States.UPLOAD_DOCS_MSG &&
        messageId === state.messages.length - 1
      ) {
        fsm.transition(Transitions.UPLOAD_DOCS_MSG_COMPLETE);
        updateFsmState(fsm.getCurrentState());
      }

      // Always ensure buttons are visible in relevant states
      if (
        fsm &&
        (state.currentFsmState === States.USR_INIT_OPTIONS ||
          state.currentFsmState === States.ENGAGE_USR_AGAIN)
      ) {
        setButtonGroupVisible(true);
      }
    },
    [
      fsm,
      state.currentFsmState,
      state.messages.length,
      setInputDisabled,
      setButtonGroupVisible,
      updateFsmState,
    ]
  );

  /**
   * Remove all message buttons
   */
  const removeMessageButtons = useCallback((): void => {
    dispatch({ type: ChatActionTypes.REMOVE_MESSAGE_BUTTONS, payload: {} });
  }, []);

  /**
   * Set error message
   * @param {string} error - Error message
   */
  const setError = useCallback((error: string): void => {
    dispatch({ type: ChatActionTypes.SET_ERROR, payload: { error } });
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback((): void => {
    dispatch({ type: ChatActionTypes.CLEAR_ERROR, payload: {} });
  }, []);

  /**
   * Set loading state
   * @param {boolean} isLoading - Whether the system is loading
   */
  const setLoading = useCallback((isLoading: boolean): void => {
    dispatch({ type: ChatActionTypes.SET_LOADING, payload: { isLoading } });
  }, []);

  /**
   * Set API request status
   * @param {boolean} isInProgress - Whether an API request is in progress
   */
  const setApiRequestStatus = useCallback((isInProgress: boolean): void => {
    dispatch({ type: ChatActionTypes.SET_API_REQUEST_STATUS, payload: { isInProgress } });
  }, []);

  /**
   * Set correlation ID from API response
   * @param {string} correlationId - Correlation ID from API
   */
  const setCorrelationId = useCallback((correlationId?: string): void => {
    dispatch({ type: ChatActionTypes.SET_CORRELATION_ID, payload: { correlationId } });
  }, []);

  /**
   * Set detailed error information
   * @param {string} error - Error message
   * @param {ApiErrorType} errorType - Type of error
   * @param {string} correlationId - Optional correlation ID associated with the error
   */
  const setDetailedError = useCallback(
    (error: string, errorType: ApiErrorType, correlationId?: string): void => {
      dispatch({
        type: ChatActionTypes.SET_DETAILED_ERROR,
        payload: { error, errorType, correlationId },
      });
    },
    []
  );

  /**
   * Handle button click
   * @param {string} value - Button value
   */
  const handleButtonClick = useCallback(
    (value: string): void => {
      if (!fsm) return;

      const displayValue = fsm.getResponseDisplayValue(value) || value;

      // Add the user's button choice as a message
      addUserMessage(displayValue);

      // Hide buttons after click
      setButtonGroupVisible(false);
      removeMessageButtons();

      // Disable input while processing
      setInputDisabled(true);

      // Handle different button actions based on FSM state
      if (
        state.currentFsmState === States.USR_INIT_OPTIONS &&
        value === 'YES_CLICKED' &&
        fsm.canTransition(Transitions.YES_CLICKED)
      ) {
        fsm.transition(Transitions.YES_CLICKED);
        updateFsmState(fsm.getCurrentState());

        // Add bot response for yes clicked
        addBotMessage("Absolutely! Let's get started. First things first — what's your name?");
      } else if (
        state.currentFsmState === States.USR_INIT_OPTIONS &&
        value === 'NO_CLICKED' &&
        fsm.canTransition(Transitions.NO_CLICKED)
      ) {
        fsm.transition(Transitions.NO_CLICKED);
        updateFsmState(fsm.getCurrentState());

        // Add bot response for no clicked
        addBotMessage(
          '💡 Psst… Great opportunities start with a "yes." Change your mind? Click "Let\'s Go" anytime!'
        );
      } else if (
        state.currentFsmState === States.ENGAGE_USR_AGAIN &&
        value === 'LETS_GO_CLICKED' &&
        fsm.canTransition(Transitions.LETS_GO_CLICKED)
      ) {
        fsm.transition(Transitions.LETS_GO_CLICKED);
        updateFsmState(fsm.getCurrentState());

        // Add bot response for let's go clicked
        addBotMessage("Great choice! Let's get started. First things first — what's your name?");
      } else if (
        state.currentFsmState === States.ENGAGE_USR_AGAIN &&
        value === 'MAYBE_NEXT_TIME_CLICKED' &&
        fsm.canTransition(Transitions.MAYBE_NEXT_TIME_CLICKED)
      ) {
        fsm.transition(Transitions.MAYBE_NEXT_TIME_CLICKED);
        updateFsmState(fsm.getCurrentState());

        // Add bot response for maybe next time clicked
        addBotMessage("I'll be here when you're ready!");

        // Enable buttons again
        setButtonGroupVisible(true);
      }
    },
    [
      fsm,
      state.currentFsmState,
      addUserMessage,
      removeMessageButtons,
      setInputDisabled,
      setButtonGroupVisible,
      updateFsmState,
      addBotMessage,
    ]
  );

  /**
   * Send a message and process the response
   * @param {string} text - Message text
   * @returns {Promise<void>}
   */
  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      if (text.trim() === '') return;

      // Add user message
      addUserMessage(text);

      // Disable input while processing
      setInputDisabled(true);
      setLoading(true);
      setApiRequestStatus(true);

      try {
        if (!fsm) {
          throw new Error('State machine not initialized');
        }

        // Use session UUID from hook
        if (
          !sessionUUID &&
          state.currentFsmState !== States.WELCOME_MSG &&
          state.currentFsmState !== States.COLLECTING_NAME
        ) {
          throw new ApiError('No session UUID available', 401, { type: ApiErrorType.UNAUTHORIZED });
        }

        // For states that require API calls, use the ChatApi
        if (
          state.currentFsmState === States.UPLOAD_DOCS ||
          state.currentFsmState === States.CREATE_BOT
        ) {
          // Call the API with proper error handling and retry
          const response = await ChatApi.sendMessage(text, sessionUUID || '');

          // Store correlation ID
          if (response.correlationId) {
            setCorrelationId(response.correlationId);
          }

          // Process API response
          if (response.status === 'success' && response.message) {
            // Handle successful API response
            addBotMessage(response.message.text);

            // Update FSM state based on API response if needed
            if (response.message.nextTransition) {
              const nextTransition = response.message.nextTransition as Transitions;
              fsm.transition(nextTransition);
              updateFsmState(fsm.getCurrentState());
            } else if (response.message.nextState) {
              // Legacy support for direct state updates
              console.warn(
                'Using deprecated nextState property. Please use nextTransition instead.'
              );
              // Handle the state update differently since we can't directly set the state
              const nextState = response.message.nextState as States;
              updateFsmState(nextState);
            }
          } else {
            // Handle API error in response
            throw new ApiError(response.error || 'Unknown API error', 400, {
              type: ApiErrorType.SERVER,
              correlationId: response.correlationId,
            });
          }
        } else {
          // Process user input based on current state for non-API states
          if (state.currentFsmState === States.COLLECTING_NAME) {
            if (/^[a-zA-Z\s]+$/.test(text)) {
              // Valid name provided
              fsm.transition(Transitions.NAME_PROVIDED);
              updateFsmState(fsm.getCurrentState());

              // Add bot response for name provided
              addBotMessage(
                `Nice to meet you, ${text}! Let's build your personalized AI agent.\n\n` +
                  `To get started, I'll need a document to train on—like a PDF of your ` +
                  `business materials, process guides, or product details. This helps ` +
                  `me tailor insights just for you!`
              );
            } else {
              // Invalid name provided
              addBotMessage(
                'Please provide a valid name. Names can only contain letters and spaces.'
              );
            }
          }
          // Add additional state handling here as needed
        }
      } catch (error) {
        console.error('Error processing message:', error);

        if (error instanceof ApiError) {
          // Handle API errors with detailed information
          const correlationId =
            error.details && typeof error.details === 'object' && 'correlationId' in error.details
              ? (error.details.correlationId as string)
              : undefined;
          setDetailedError(error.message, error.type || ApiErrorType.UNKNOWN, correlationId);

          // Show user-friendly error message based on error type
          switch (error.type) {
            case ApiErrorType.NETWORK:
              addBotMessage(
                "I'm having trouble connecting to our servers. Please check your internet connection and try again."
              );
              break;
            case ApiErrorType.TIMEOUT:
              addBotMessage(
                'Our servers are taking too long to respond. Please try again in a moment.'
              );
              break;
            case ApiErrorType.UNAUTHORIZED:
              addBotMessage('Your session has expired. Please refresh the page to continue.');
              break;
            default:
              addBotMessage(
                'I encountered an issue processing your request. Please try again or contact support if the problem persists.'
              );
          }
        } else {
          // Handle generic errors
          setError(error instanceof Error ? error.message : 'An unknown error occurred');
          addBotMessage("I'm sorry, something went wrong. Please try again later.");
        }
      } finally {
        setLoading(false);
        setApiRequestStatus(false);
      }
    },
    [
      addUserMessage,
      setInputDisabled,
      setLoading,
      setApiRequestStatus,
      fsm,
      state.currentFsmState,
      updateFsmState,
      addBotMessage,
      setError,
      setDetailedError,
      setCorrelationId,
      sessionUUID,
    ]
  );

  /**
   * Reset the chat to initial state
   */
  const resetChat = useCallback((): void => {
    // Reset the FSM if available
    if (fsm) {
      fsm.reset();
    }

    // Reset entire chat state to initial state
    dispatch({
      type: ChatActionTypes.RESET_CHAT,
      payload: {},
    });

    // Update FSM state after reset
    if (fsm) {
      updateFsmState(fsm.getCurrentState());
    }
  }, [fsm, updateFsmState]);

  /**
   * Start email verification process
   */
  const startEmailVerification = useCallback((email: string): void => {
    dispatch({ type: ChatActionTypes.START_EMAIL_VERIFICATION, payload: { email } });
  }, []);

  /**
   * Mark email code as sent
   */
  const emailCodeSent = useCallback((): void => {
    dispatch({ type: ChatActionTypes.EMAIL_CODE_SENT, payload: {} });
  }, []);

  /**
   * Mark email verification as complete
   */
  const emailVerificationComplete = useCallback((): void => {
    dispatch({ type: ChatActionTypes.EMAIL_VERIFICATION_COMPLETE, payload: {} });
  }, []);

  /**
   * Reset email verification state
   */
  const resetEmailVerification = useCallback((): void => {
    dispatch({ type: ChatActionTypes.RESET_EMAIL_VERIFICATION, payload: {} });
  }, []);

  // Create the context value with all methods
  const value = {
    state,
    addUserMessage,
    addBotMessage,
    setMessageTypingComplete,
    setInputDisabled,
    setButtonGroupVisible,
    removeMessageButtons,
    setError,
    clearError,
    setLoading,
    updateFsmState,
    handleButtonClick,
    sendMessage,
    resetChat,
    setApiRequestStatus,
    setCorrelationId,
    setDetailedError,
    startEmailVerification,
    emailCodeSent,
    emailVerificationComplete,
    resetEmailVerification,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

/**
 * Hook to use the chat context
 * @returns {ChatContextValue} The chat context value
 */
export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
