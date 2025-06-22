import { v4 as uuidv4 } from 'uuid';

/**
 * Checks if a string is a valid UUID v4.
 */
function isValidUUID(uuid: string | null): boolean {
  if (!uuid) return false;
  // Simple v4 regex
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

/**
 * Always returns a valid session UUID.
 * If not present or invalid in localStorage, generates and stores a new one and reloads the page.
 * Use this function before any action that requires a UUID.
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
 * Use this when the backend signals a tampered/invalid session.
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
 */
export function updateSessionUUID(newUUID: string): void {
  localStorage.setItem('session_uuid', newUUID);
}
