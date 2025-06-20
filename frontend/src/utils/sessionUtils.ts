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
