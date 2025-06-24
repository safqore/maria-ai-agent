/**
 * @deprecated Use SessionApi from '../api/sessionApi' instead.
 * This file is kept for backward compatibility and will be removed in a future update.
 */
import { SessionApi } from '../api';

export type UUIDStatus = 'success' | 'collision' | 'invalid' | 'error';

export interface UUIDResponse {
  status: UUIDStatus;
  uuid: string | null;
  message: string;
  details?: Record<string, unknown>;
}

export async function generateUUID(): Promise<UUIDResponse> {
  return SessionApi.generateUUID();
}

export async function validateUUID(uuid: string): Promise<UUIDResponse> {
  return SessionApi.validateUUID(uuid);
}
