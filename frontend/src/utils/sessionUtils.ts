import { v4 as uuidv4 } from 'uuid';

/**
 * Always returns a valid session UUID.
 * If not present in localStorage, generates and stores a new one.
 * Use this function before any action that requires a UUID.
 */
export function getOrCreateSessionUUID(): string {
  let uuid = localStorage.getItem('session_uuid');
  if (!uuid) {
    uuid = uuidv4();
    localStorage.setItem('session_uuid', uuid);
  }
  return uuid;
}

/**
 * Resets the session UUID, clearing any existing value and generating a new one.
 * Use this when the backend signals a tampered/invalid session.
 */
export function resetSessionUUID(): string {
  localStorage.removeItem('session_uuid');
  const newUUID = uuidv4();
  localStorage.setItem('session_uuid', newUUID);
  return newUUID;
}

/**
 * Updates the session UUID to a new value (e.g., after backend collision resolution).
 */
export function updateSessionUUID(newUUID: string): void {
  localStorage.setItem('session_uuid', newUUID);
}
