import { useEffect, useState } from 'react';
import { getOrCreateSessionUUID } from '../utils/sessionUtils';

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
}

/**
 * Custom React hook to manage a persistent session UUID.
 *
 * This hook handles:
 * - Retrieving a UUID from localStorage if available
 * - Validating the UUID with the backend
 * - Creating a new UUID if needed
 * - Managing loading and error states
 *
 * @returns {UseSessionUUIDResult} An object containing the UUID, loading state, and any error
 */
export function useSessionUUID(): UseSessionUUIDResult {
  const [sessionUUID, setSessionUUID] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
          setError(err.message || 'Session error');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { sessionUUID, loading, error };
}
