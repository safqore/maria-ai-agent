import { generateUUID, validateUUID, UUIDResponse } from './uuidApi';

// Add request deduplication to prevent multiple simultaneous UUID requests
let pendingUUIDRequest: Promise<string> | null = null;

// Add this configuration option
export const SKIP_UUID_VALIDATION_IN_DEV =
  process.env.NODE_ENV === 'development' && process.env.REACT_APP_SKIP_UUID_VALIDATION === 'true';

/**
 * Checks if a string is a valid UUID v4.
 * @param uuid - The string to validate as a UUID.
 * @returns True if valid UUID v4, false otherwise.
 */
function isValidUUID(uuid: string | null): boolean {
  if (!uuid) return false;
  // Simple v4 regex
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

/**
 * Returns a valid session UUID from localStorage, or generates a new one via backend if missing/invalid.
 * Validates the UUID with the backend. Handles all backend statuses and reloads the app if session is reset.
 * @returns Promise resolving to the valid session UUID (string).
 * @throws Error if unable to obtain a valid session UUID from backend.
 */
export async function getOrCreateSessionUUID(): Promise<string> {
  if (pendingUUIDRequest) {
    return pendingUUIDRequest;
  }

  pendingUUIDRequest = (async () => {
    try {
      const isTest = process.env.NODE_ENV === 'test';
      const uuid = localStorage.getItem('session_uuid');

      if (!isValidUUID(uuid)) {
        // No valid UUID - generate new one
        const genResp: UUIDResponse = await generateUUID();
        if (genResp.status === 'success' && genResp.uuid) {
          localStorage.setItem('session_uuid', genResp.uuid);
          if (!isTest) {
            window.location.reload();
          }
          return genResp.uuid;
        } else {
          throw new Error(genResp.message || 'Failed to generate session UUID');
        }
      }

      if (SKIP_UUID_VALIDATION_IN_DEV) {
        return uuid as string;
      }

      // Validate existing UUID
      const valResp: UUIDResponse = await validateUUID(uuid as string);

      if (valResp.status === 'success') {
        // UUID is valid and session is active - continue
        return uuid as string;
      } else if (valResp.status === 'collision') {
        // Complete session exists - start new session
        localStorage.removeItem('session_uuid');
        const genResp: UUIDResponse = await generateUUID();
        if (genResp.status === 'success' && genResp.uuid) {
          localStorage.setItem('session_uuid', genResp.uuid);
          if (!isTest) {
            window.location.reload();
          }
          return genResp.uuid;
        } else {
          throw new Error(genResp.message || 'Failed to start new session');
        }
      } else {
        // Invalid or expired - start new session
        localStorage.removeItem('session_uuid');
        const genResp: UUIDResponse = await generateUUID();
        if (genResp.status === 'success' && genResp.uuid) {
          localStorage.setItem('session_uuid', genResp.uuid);
          if (!isTest) {
            window.location.reload();
          }
          return genResp.uuid;
        } else {
          throw new Error(genResp.message || 'Failed to start new session');
        }
      }
    } finally {
      pendingUUIDRequest = null;
    }
  })();

  return pendingUUIDRequest;
}

/**
 * Resets the session UUID by requesting a new one from the backend, then reloads the app.
 * Use this when the backend signals a tampered/invalid session, or for a manual reset.
 * @returns Promise resolving to the new session UUID (string).
 * @throws Error if unable to obtain a new session UUID from backend.
 */
export async function resetSessionUUID(): Promise<string> {
  // For tests only: Skip reload for better testability
  const isTest = process.env.NODE_ENV === 'test';

  localStorage.removeItem('session_uuid');
  const genResp: UUIDResponse = await generateUUID();
  if (genResp.status === 'success' && genResp.uuid) {
    localStorage.setItem('session_uuid', genResp.uuid);
    if (!isTest) {
      window.location.reload();
    }
    return genResp.uuid;
  } else {
    throw new Error(genResp.message || 'Failed to reset session UUID');
  }
}

/**
 * Updates the session UUID to a new value (e.g., after backend collision resolution).
 * @param newUUID - The new, unique session UUID to store.
 */
export function updateSessionUUID(newUUID: string): void {
  localStorage.setItem('session_uuid', newUUID);
}
