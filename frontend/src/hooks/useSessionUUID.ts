import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * Custom React hook to manage a persistent session UUID.
 * - Checks localStorage for an existing UUID on mount.
 * - Generates and stores a new UUID if not present.
 * - Returns the UUID for use in API calls and uploads.
 */
export function useSessionUUID(): string {
  const [sessionUUID, setSessionUUID] = useState<string>('');

  useEffect(() => {
    let uuid = localStorage.getItem('session_uuid');
    if (!uuid) {
      uuid = uuidv4();
      localStorage.setItem('session_uuid', uuid);
    }
    setSessionUUID(uuid);
  }, []);

  return sessionUUID;
}
