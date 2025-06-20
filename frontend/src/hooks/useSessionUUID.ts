import { useEffect, useState } from 'react';
import { getOrCreateSessionUUID } from '../utils/sessionUtils';

/**
 * Custom React hook to manage a persistent session UUID.
 * - Returns the UUID for use in API calls and uploads.
 * - If the UUID is deleted from localStorage during a session, will always return a valid one.
 */
export function useSessionUUID(): string {
  const [sessionUUID, setSessionUUID] = useState<string>('');

  useEffect(() => {
    setSessionUUID(getOrCreateSessionUUID());
  }, []);

  return sessionUUID;
}
