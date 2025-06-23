import { useEffect, useState } from 'react';
import { getOrCreateSessionUUID } from '../utils/sessionUtils';

/**
 * Custom React hook to manage a persistent session UUID.
 * - Returns the UUID for use in API calls and uploads.
 * - Handles async backend validation/generation and error state for user messaging.
 */
export function useSessionUUID(): {
  sessionUUID: string;
  loading: boolean;
  error: string | null;
} {
  const [sessionUUID, setSessionUUID] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getOrCreateSessionUUID()
      .then((uuid) => {
        if (isMounted) {
          setSessionUUID(uuid);
          setError(null);
        }
      })
      .catch((err) => {
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
