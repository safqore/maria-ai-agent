/**
 * Session Manager Hook
 *
 * A custom React hook for managing user sessions, providing:
 * - Session restoration
 * - Session expiration handling
 * - Session header generation for API requests
 */
import { useState, useEffect, useCallback } from 'react';
import { useSessionUUID } from './useSessionUUID';
import { SKIP_SESSION_VALIDATION } from '../utils/config';

/**
 * Interface for the useSessionManager hook return value
 */
interface UseSessionManagerResult {
  /** The current session UUID */
  sessionId: string;
  /** Whether the session is currently being validated/loaded */
  isLoading: boolean;
  /** Any error that occurred during session management */
  error: string | null;
  /** Function to reset the current session */
  resetSession: () => Promise<void>;
  /** Function to get headers that include session information */
  getSessionHeaders: () => Record<string, string>;
  /** Whether the session is valid */
  isSessionValid: boolean;
}

/**
 * Custom hook for centralized session management
 *
 * @returns Session management functions and state
 *
 * @example
 * ```tsx
 * const {
 *   sessionId,
 *   isLoading,
 *   error,
 *   resetSession,
 *   getSessionHeaders
 * } = useSessionManager();
 *
 * // Use in API calls
 * const headers = getSessionHeaders();
 * const response = await fetch('/api/data', { headers });
 * ```
 */
export function useSessionManager(): UseSessionManagerResult {
  // Use the existing session UUID hook
  const { sessionUUID, loading, error, resetSession } = useSessionUUID();
  const [isSessionValid, setIsSessionValid] = useState<boolean>(false);

  // Check if the session is valid
  useEffect(() => {
    if (sessionUUID && !loading) {
      // For now, we'll consider a non-empty UUID as valid
      // In the future, we could add more validation here
      setIsSessionValid(true);
    } else if (!SKIP_SESSION_VALIDATION) {
      setIsSessionValid(false);
    } else {
      // If we're skipping validation, consider the session valid
      setIsSessionValid(true);
    }
  }, [sessionUUID, loading]);

  /**
   * Get headers containing session information for API requests
   */
  const getSessionHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (sessionUUID) {
      headers['X-Session-ID'] = sessionUUID;
    }

    return headers;
  }, [sessionUUID]);

  return {
    sessionId: sessionUUID,
    isLoading: loading,
    error,
    resetSession,
    getSessionHeaders,
    isSessionValid,
  };
}
