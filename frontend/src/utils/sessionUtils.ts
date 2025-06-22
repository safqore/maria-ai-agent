import { v4 as uuidv4 } from 'uuid';

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
 * Returns a valid session UUID from localStorage, or generates a new one if missing/invalid.
 * If a new UUID is generated, the app reloads to fully reset the session (as per requirements).
 * Call this before any user action or API call that requires a session.
 * @returns The valid session UUID (string).
 */
export function getOrCreateSessionUUID(): string {
  let uuid = localStorage.getItem('session_uuid');
  if (!isValidUUID(uuid)) {
    uuid = uuidv4();
    localStorage.setItem('session_uuid', uuid);
    window.location.reload();
    // The reload will interrupt further execution, but for type safety:
    return uuid;
  }
  // uuid is guaranteed to be a valid string here
  return uuid as string;
}

/**
 * Resets the session UUID, clearing any existing value and generating a new one, then reloads the app.
 * Use this when the backend signals a tampered/invalid session, or for a manual reset.
 * @returns The new session UUID (string).
 */
export function resetSessionUUID(): string {
  localStorage.removeItem('session_uuid');
  const newUUID = uuidv4();
  localStorage.setItem('session_uuid', newUUID);
  window.location.reload();
  return newUUID;
}

/**
 * Updates the session UUID to a new value (e.g., after backend collision resolution).
 * @param newUUID - The new, unique session UUID to store.
 */
export function updateSessionUUID(newUUID: string): void {
  localStorage.setItem('session_uuid', newUUID);
}
