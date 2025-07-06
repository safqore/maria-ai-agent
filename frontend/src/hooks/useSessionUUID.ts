import { useEffect, useState, useCallback } from 'react';
import { getOrCreateSessionUUID, resetSessionUUID } from '../utils/sessionUtils';
import { ApiError } from '../api';

/**
 * Interface defining the return type of the useSessionUUID hook
 */
interface UseSessionUUIDResult {
  /** The validated or newly created session UUID */
  sessionUUID: string;
  /** Indicates whether the UUID is being validated/generated */
  loading: boolean;
  /** Error message if UUID validation/generation fails, null otherwise */
  error: string | null;
  /** Function to reset the session UUID */
  resetSession: () => Promise<void>;
}

/**
 * Error types for session management
 */
enum SessionErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  SERVER = 'server',
}

/**
 * Extended error interface with type information
 */
interface SessionError {
  message: string;
  type: SessionErrorType;
}

/**
 * Custom React hook to manage a persistent session UUID.
 *
 * This hook handles:
 * - Retrieving a UUID from localStorage if available
 * - Validating the UUID with the backend
 * - Creating a new UUID if needed
 * - Managing loading and error states
 * - Providing a function to reset the session UUID
 *
 * @returns {UseSessionUUIDResult} An object containing the UUID, loading state, error, and reset function
 */
export function useSessionUUID(): UseSessionUUIDResult {
  const [sessionUUID, setSessionUUID] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to handle and categorize errors
  const handleError = (err: unknown): void => {
    let sessionError: SessionError;

    if (err instanceof ApiError) {
      sessionError = {
        message: err.message,
        type: err.status >= 500 ? SessionErrorType.SERVER : SessionErrorType.VALIDATION,
      };
    } else if (err instanceof Error) {
      sessionError = {
        message: err.message,
        type: err.name === 'TypeError' ? SessionErrorType.NETWORK : SessionErrorType.SERVER,
      };
    } else {
      sessionError = {
        message: 'Unknown session error',
        type: SessionErrorType.SERVER,
      };
    }

    setError(sessionError.message);
    // We could use the error type for more specific handling if needed
  };

  // Initialize session
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getOrCreateSessionUUID()
      .then(uuid => {
        if (isMounted) {
          setSessionUUID(uuid);
          setError(null);
        }
      })
      .catch(err => {
        if (isMounted) {
          handleError(err);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Reset session function
  const resetSession = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const newUUID = await resetSessionUUID();
      setSessionUUID(newUUID);
      setError(null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { sessionUUID, loading, error, resetSession };
}
