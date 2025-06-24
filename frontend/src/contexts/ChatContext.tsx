import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Message } from '../utils/chatUtils';
import { StateMachine } from '../state/FiniteStateMachine';

/**
 * Chat state interface
 */
export interface ChatState {
  /** List of chat messages */
  messages: Message[];
  /** Whether the input is disabled */
  isInputDisabled: boolean;
  /** Whether buttons are visible */
  isButtonGroupVisible: boolean;
  /** Error message, if any */
  error: string | null;
}

/**
 * Chat action types
 */
export enum ChatActionTypes {
  ADD_USER_MESSAGE = 'ADD_USER_MESSAGE',
  ADD_BOT_MESSAGE = 'ADD_BOT_MESSAGE',
  SET_MESSAGE_TYPING_COMPLETE = 'SET_MESSAGE_TYPING_COMPLETE',
  SET_INPUT_DISABLED = 'SET_INPUT_DISABLED',
  SET_BUTTON_GROUP_VISIBLE = 'SET_BUTTON_GROUP_VISIBLE',
  REMOVE_MESSAGE_BUTTONS = 'REMOVE_MESSAGE_BUTTONS',
  SET_ERROR = 'SET_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR',
}

/**
 * Chat action interface
 */
export type ChatAction =
  | { type: ChatActionTypes.ADD_USER_MESSAGE; payload: { text: string } }
  | {
      type: ChatActionTypes.ADD_BOT_MESSAGE;
      payload: { text: string; buttons?: Array<{ text: string; value: string }> };
    }
  | { type: ChatActionTypes.SET_MESSAGE_TYPING_COMPLETE; payload: { messageId: number } }
  | { type: ChatActionTypes.SET_INPUT_DISABLED; payload: { isDisabled: boolean } }
  | { type: ChatActionTypes.SET_BUTTON_GROUP_VISIBLE; payload: { isVisible: boolean } }
  | { type: ChatActionTypes.REMOVE_MESSAGE_BUTTONS; payload: Record<string, never> }
  | { type: ChatActionTypes.SET_ERROR; payload: { error: string } }
  | { type: ChatActionTypes.CLEAR_ERROR; payload: Record<string, never> };

/**
 * Initial welcome message
 */
const welcomeMessage =
  "👋 Hi there! I'm Maria, your AI guide at Safqore. Ready to discover how we can help you grow?";

/**
 * Initial chat state
 */
const initialState: ChatState = {
  messages: [{ text: welcomeMessage, isUser: false, isTyping: true, id: 0 }],
  isInputDisabled: true,
  isButtonGroupVisible: true,
  error: null,
};

/**
 * Chat reducer function
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
        messages: state.messages.filter(msg => !msg.buttons),
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

    default:
      return state;
  }
};

/**
 * Chat context interface
 */
interface ChatContextValue {
  /** Current chat state */
  state: ChatState;
  /** Function to add a user message */
  addUserMessage: (text: string) => void;
  /** Function to add a bot message */
  addBotMessage: (text: string, buttons?: Array<{ text: string; value: string }>) => void;
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
}

/**
 * Chat context
 */
const ChatContext = createContext<ChatContextValue | undefined>(undefined);

/**
 * Chat provider props
 */
interface ChatProviderProps {
  /** Child components */
  children: ReactNode;
  /** Optional FSM to use */
  fsm?: StateMachine;
}

/**
 * Chat context provider component
 */
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const addUserMessage = useCallback((text: string) => {
    dispatch({ type: ChatActionTypes.ADD_USER_MESSAGE, payload: { text } });
  }, []);

  const addBotMessage = useCallback(
    (text: string, buttons?: Array<{ text: string; value: string }>) => {
      dispatch({ type: ChatActionTypes.ADD_BOT_MESSAGE, payload: { text, buttons } });
    },
    []
  );

  const setMessageTypingComplete = useCallback((messageId: number) => {
    dispatch({ type: ChatActionTypes.SET_MESSAGE_TYPING_COMPLETE, payload: { messageId } });
  }, []);

  const setInputDisabled = useCallback((isDisabled: boolean) => {
    dispatch({ type: ChatActionTypes.SET_INPUT_DISABLED, payload: { isDisabled } });
  }, []);

  const setButtonGroupVisible = useCallback((isVisible: boolean) => {
    dispatch({ type: ChatActionTypes.SET_BUTTON_GROUP_VISIBLE, payload: { isVisible } });
  }, []);

  const removeMessageButtons = useCallback(() => {
    dispatch({ type: ChatActionTypes.REMOVE_MESSAGE_BUTTONS, payload: {} });
  }, []);

  const setError = useCallback((error: string) => {
    dispatch({ type: ChatActionTypes.SET_ERROR, payload: { error } });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ChatActionTypes.CLEAR_ERROR, payload: {} });
  }, []);

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
