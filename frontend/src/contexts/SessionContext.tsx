import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import toast from 'react-hot-toast';
import { getOrCreateSessionUUID, resetSessionUUID } from '../utils/sessionUtils';
import { ApiError } from '../api';

/**
 * Session state interface defining the data structure for session state
 */
export interface SessionState {
  /** Current session UUID */
  sessionUUID: string;
  /** Whether session operations are in progress */
  isLoading: boolean;
  /** Error message, if any */
  error: string | null;
  /** Whether session reset modal is visible */
  isResetModalVisible: boolean;
  /** Whether the session has been initialized */
  isInitialized: boolean;
}

/**
 * Session action types enum
 */
export enum SessionActionTypes {
  /** Start session operation */
  SET_LOADING = 'SET_LOADING',
  /** Set session UUID */
  SET_SESSION_UUID = 'SET_SESSION_UUID',
  /** Set error state */
  SET_ERROR = 'SET_ERROR',
  /** Clear error state */
  CLEAR_ERROR = 'CLEAR_ERROR',
  /** Show reset modal */
  SHOW_RESET_MODAL = 'SHOW_RESET_MODAL',
  /** Hide reset modal */
  HIDE_RESET_MODAL = 'HIDE_RESET_MODAL',
  /** Mark session as initialized */
  SET_INITIALIZED = 'SET_INITIALIZED',
  /** Reset session state */
  RESET_SESSION = 'RESET_SESSION',
}

/**
 * Session action interface with discriminated union for type safety
 */
export type SessionAction =
  | { type: SessionActionTypes.SET_LOADING; payload: boolean }
  | { type: SessionActionTypes.SET_SESSION_UUID; payload: string }
  | { type: SessionActionTypes.SET_ERROR; payload: string }
  | { type: SessionActionTypes.SET_INITIALIZED; payload: boolean }
  | { type: SessionActionTypes.CLEAR_ERROR }
  | { type: SessionActionTypes.SHOW_RESET_MODAL }
  | { type: SessionActionTypes.HIDE_RESET_MODAL }
  | { type: SessionActionTypes.RESET_SESSION };

/**
 * Session context interface
 */
export interface SessionContextType {
  /** Current session state */
  state: SessionState;
  /** Initialize or refresh session UUID */
  initializeSession: () => Promise<void>;
  /** Reset session with optional confirmation */
  resetSession: (showConfirmation?: boolean) => Promise<void>;
  /** Clear any current error */
  clearError: () => void;
  /** Show reset confirmation modal */
  showResetModal: () => void;
  /** Hide reset confirmation modal */
  hideResetModal: () => void;
  /** Confirm session reset from modal */
  confirmResetSession: () => Promise<void>;
}

/**
 * Initial session state
 */
const initialState: SessionState = {
  sessionUUID: '',
  isLoading: false,
  error: null,
  isResetModalVisible: false,
  isInitialized: false,
};

/**
 * Session reducer to manage state transitions
 */
function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case SessionActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error, // Clear error when starting new operation
      };

    case SessionActionTypes.SET_SESSION_UUID:
      return {
        ...state,
        sessionUUID: action.payload,
        isLoading: false,
        error: null,
      };

    case SessionActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case SessionActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case SessionActionTypes.SHOW_RESET_MODAL:
      return {
        ...state,
        isResetModalVisible: true,
      };

    case SessionActionTypes.HIDE_RESET_MODAL:
      return {
        ...state,
        isResetModalVisible: false,
      };

    case SessionActionTypes.SET_INITIALIZED:
      return {
        ...state,
        isInitialized: action.payload,
      };

    case SessionActionTypes.RESET_SESSION:
      return {
        ...initialState,
        isInitialized: true, // Keep initialized true to prevent re-initialization
      };

    default:
      return state;
  }
}

/**
 * Session error handling utility
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message || 'Session operation failed';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Session context instance
 */
const SessionContext = createContext<SessionContextType | undefined>(undefined);

/**
 * Session provider component props
 */
interface SessionProviderProps {
  children: ReactNode;
  /** Whether to show toast notifications for session events */
  enableNotifications?: boolean;
}

/**
 * Session provider component that manages session state and operations
 */
export function SessionProvider({ children, enableNotifications = true }: SessionProviderProps) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  /**
   * Initialize or refresh session UUID
   */
  const initializeSession = useCallback(async () => {
    if (state.isLoading) return;

    dispatch({ type: SessionActionTypes.SET_LOADING, payload: true });

    if (enableNotifications) {
      console.log('SessionContext: Initializing session...');
    }

    try {
      const sessionUUID = await getOrCreateSessionUUID();

      dispatch({
        type: SessionActionTypes.SET_SESSION_UUID,
        payload: sessionUUID,
      });
      dispatch({ type: SessionActionTypes.SET_INITIALIZED, payload: true });

      if (enableNotifications) {
        console.log('SessionContext: Session initialized successfully');
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({
        type: SessionActionTypes.SET_ERROR,
        payload: errorMessage,
      });

      if (enableNotifications) {
        console.error('SessionContext: Error initializing session:', errorMessage);
        toast.error(`Session error: ${errorMessage}`);
      }
    } finally {
      dispatch({ type: SessionActionTypes.SET_LOADING, payload: false });
    }
  }, [enableNotifications]);

  /**
   * Reset session with optional confirmation
   */
  const resetSession = useCallback(
    async (showConfirmation = true) => {
      if (showConfirmation) {
        dispatch({ type: SessionActionTypes.SHOW_RESET_MODAL });
        return;
      }

      dispatch({ type: SessionActionTypes.SET_LOADING, payload: true });

      try {
        await resetSessionUUID();
        const newSessionUUID = await getOrCreateSessionUUID();

        dispatch({ type: SessionActionTypes.RESET_SESSION });
        dispatch({ type: SessionActionTypes.SET_SESSION_UUID, payload: newSessionUUID });

        if (enableNotifications) {
          toast.success('Session reset successfully');
        }
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        dispatch({ type: SessionActionTypes.SET_ERROR, payload: errorMessage });

        if (enableNotifications) {
          toast.error(`Session reset failed: ${errorMessage}`);
        }
      }
    },
    [enableNotifications]
  );

  /**
   * Clear any current error
   */
  const clearError = useCallback(() => {
    dispatch({ type: SessionActionTypes.CLEAR_ERROR });
  }, []);

  /**
   * Show reset confirmation modal
   */
  const showResetModal = useCallback(() => {
    dispatch({ type: SessionActionTypes.SHOW_RESET_MODAL });
  }, []);

  /**
   * Hide reset confirmation modal
   */
  const hideResetModal = useCallback(() => {
    dispatch({ type: SessionActionTypes.HIDE_RESET_MODAL });
  }, []);

  /**
   * Confirm session reset from modal
   */
  const confirmResetSession = useCallback(async () => {
    dispatch({ type: SessionActionTypes.HIDE_RESET_MODAL });
    await resetSession(false);
  }, [resetSession]);

  /**
   * Initialize session on mount
   */
  useEffect(() => {
    let isMounted = true;
    let isInitializing = false;

    const initializeSessionSafely = async () => {
      // Prevent multiple simultaneous initialization attempts
      if (isInitializing) return;

      isInitializing = true;

      try {
        dispatch({ type: SessionActionTypes.SET_LOADING, payload: true });

        if (enableNotifications) {
          console.log('SessionContext: Initializing session...');
        }

        const sessionUUID = await getOrCreateSessionUUID();

        if (isMounted) {
          dispatch({
            type: SessionActionTypes.SET_SESSION_UUID,
            payload: sessionUUID,
          });
          dispatch({ type: SessionActionTypes.SET_INITIALIZED, payload: true });

          if (enableNotifications) {
            console.log('SessionContext: Session initialized successfully');
          }
        }
      } catch (error) {
        if (isMounted) {
          const errorMessage = getErrorMessage(error);
          dispatch({
            type: SessionActionTypes.SET_ERROR,
            payload: errorMessage,
          });

          if (enableNotifications) {
            console.error('SessionContext: Error initializing session:', errorMessage);
            toast.error(`Session error: ${errorMessage}`);
          }
        }
      } finally {
        if (isMounted) {
          dispatch({ type: SessionActionTypes.SET_LOADING, payload: false });
        }
        isInitializing = false;
      }
    };

    // Only initialize if not already initialized
    if (!state.isInitialized && !state.sessionUUID) {
      initializeSessionSafely();
    }

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once

  const contextValue: SessionContextType = {
    state,
    initializeSession,
    resetSession,
    clearError,
    showResetModal,
    hideResetModal,
    confirmResetSession,
  };

  return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
}

/**
 * Custom hook to use session context
 * @throws {Error} If used outside of SessionProvider
 */
export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

/**
 * Custom hook to get current session UUID
 * Convenience hook for components that only need the UUID
 */
export function useSessionUUID(): string {
  const { state } = useSession();
  return state.sessionUUID;
}

/**
 * Custom hook to check if session is loading
 * Convenience hook for loading states
 */
export function useSessionLoading(): boolean {
  const { state } = useSession();
  return state.isLoading;
}

/**
 * Custom hook to get session error
 * Convenience hook for error handling
 */
export function useSessionError(): string | null {
  const { state } = useSession();
  return state.error;
}
