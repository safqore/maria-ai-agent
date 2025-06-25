import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Message } from '../utils/chatUtils';
import { StateMachine, States, Transitions } from '../state/FiniteStateMachine';

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
  /** Current finite state machine state */
  currentFsmState?: States;
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
  UPDATE_FSM_STATE = 'UPDATE_FSM_STATE'
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
  | { type: ChatActionTypes.UPDATE_FSM_STATE; payload: { state: States } };

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
  currentFsmState: States.WELCOME_MSG
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
  const addBotMessage = useCallback(
    (text: string, buttons?: ChatButton[]): void => {
      dispatch({ type: ChatActionTypes.ADD_BOT_MESSAGE, payload: { text, buttons } });
    },
    []
  );

  /**
   * Mark a message as finished typing
   * @param {number} messageId - ID of the message
   */
  const setMessageTypingComplete = useCallback((messageId: number): void => {
    dispatch({ type: ChatActionTypes.SET_MESSAGE_TYPING_COMPLETE, payload: { messageId } });
  }, []);

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
   * Update FSM state
   * @param {States} state - New FSM state
   */
  const updateFsmState = useCallback((state: States): void => {
    dispatch({ type: ChatActionTypes.UPDATE_FSM_STATE, payload: { state } });
  }, []);
  
  /**
   * Handle button click
   * @param {string} value - Button value
   */
  const handleButtonClick = useCallback((value: string): void => {
    // Process button click based on current state
    if (fsm && state.currentFsmState) {
      // Map button values to transitions
      switch (value) {
        case 'yes':
          fsm.transition(Transitions.YES_CLICKED);
          break;
        case 'no':
          fsm.transition(Transitions.NO_CLICKED);
          break;
        case 'lets-go':
          fsm.transition(Transitions.LETS_GO_CLICKED);
          break;
        case 'maybe-next-time':
          fsm.transition(Transitions.MAYBE_NEXT_TIME_CLICKED);
          break;
        case 'create-bot':
          fsm.transition(Transitions.BOT_CREATION_INITIALISED);
          break;
        case 'end-workflow':
          // Use a valid transition that leads to END_WORKFLOW
          fsm.transition(Transitions.MAYBE_NEXT_TIME_CLICKED);
          break;
        default:
          console.warn(`Unhandled button value: ${value}`);
      }
    }
    
    // Add the button text as a user message
    addUserMessage(value);
    
    // Remove buttons after click
    removeMessageButtons();
    
    // Disable input temporarily
    setInputDisabled(true);
  }, [fsm, state.currentFsmState, addUserMessage, removeMessageButtons, setInputDisabled]);
  
  /**
   * Send a message and process the response
   * @param {string} text - Message text
   * @returns {Promise<void>}
   */
  const sendMessage = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;
    
    // Add user message
    addUserMessage(text);
    
    // Disable input during processing
    setInputDisabled(true);
    setLoading(true);
    
    try {
      // This would normally call an API
      // For now we'll just simulate a response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Process input based on current state
      if (fsm && state.currentFsmState) {
        switch (state.currentFsmState) {
          case States.COLLECTING_NAME:
            fsm.transition(Transitions.NAME_PROVIDED);
            addBotMessage(`Thanks ${text}! What's your email address?`);
            break;
          case States.COLLECTING_EMAIL:
            fsm.transition(Transitions.EMAIL_PROVIDED);
            addBotMessage('Great! Now you can upload your documents.');
            break;
          default:
            addBotMessage(`I received your message: "${text}"`);
        }
      } else {
        addBotMessage(`I received your message: "${text}"`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      setInputDisabled(false);
    }
  }, [
    addUserMessage,
    setInputDisabled,
    setLoading,
    fsm,
    state.currentFsmState,
    addBotMessage,
    setError
  ]);
  
  /**
   * Reset the chat to initial state
   */
  const resetChat = useCallback((): void => {
    // Reset to initial state
    const [initialMessage] = initialState.messages;
    dispatch({ type: ChatActionTypes.ADD_BOT_MESSAGE, payload: { text: initialMessage.text } });
    setInputDisabled(false);
    setButtonGroupVisible(true);
    clearError();
    
    // Reset FSM if provided
    if (fsm) {
      fsm.reset();
      updateFsmState(States.WELCOME_MSG);
    }
  }, [fsm, setInputDisabled, setButtonGroupVisible, clearError, updateFsmState]);

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
    resetChat
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

/**
 * Hook to use the chat context
 */
export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
