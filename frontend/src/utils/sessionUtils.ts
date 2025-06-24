import { generateUUID, validateUUID, UUIDResponse } from './uuidApi';

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
  const uuid = localStorage.getItem('session_uuid');
  if (!isValidUUID(uuid)) {
    // No valid UUID, generate via backend
    const genResp: UUIDResponse = await generateUUID();
    if (genResp.status === 'success' && genResp.uuid) {
      localStorage.setItem('session_uuid', genResp.uuid);
      window.location.reload();
      return genResp.uuid;
    } else {
      throw new Error(genResp.message || 'Failed to generate session UUID');
    }
  }
  // Validate with backend
  const valResp: UUIDResponse = await validateUUID(uuid as string);
  if (valResp.status === 'success' && valResp.uuid === uuid) {
    return uuid as string;
  } else if (valResp.status === 'collision' && valResp.uuid) {
    // Backend suggests a new UUID due to collision
    localStorage.setItem('session_uuid', valResp.uuid);
    window.location.reload();
    return valResp.uuid;
  } else if (valResp.status === 'invalid' || valResp.status === 'error') {
    // Tampered or invalid, reset session
    localStorage.removeItem('session_uuid');
    const genResp: UUIDResponse = await generateUUID();
    if (genResp.status === 'success' && genResp.uuid) {
      localStorage.setItem('session_uuid', genResp.uuid);
      window.location.reload();
      return genResp.uuid;
    } else {
      throw new Error(genResp.message || 'Failed to reset session UUID');
    }
  }
  // Defensive fallback
  throw new Error(valResp.message || 'Unknown error validating session UUID');
}

/**
 * Resets the session UUID by requesting a new one from the backend, then reloads the app.
 * Use this when the backend signals a tampered/invalid session, or for a manual reset.
 * @returns Promise resolving to the new session UUID (string).
 * @throws Error if unable to obtain a new session UUID from backend.
 */
export async function resetSessionUUID(): Promise<string> {
  localStorage.removeItem('session_uuid');
  const genResp: UUIDResponse = await generateUUID();
  if (genResp.status === 'success' && genResp.uuid) {
    localStorage.setItem('session_uuid', genResp.uuid);
    window.location.reload();
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
