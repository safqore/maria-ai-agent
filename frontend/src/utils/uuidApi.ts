import { API_BASE_URL } from './config';

export type UUIDStatus = 'success' | 'collision' | 'invalid' | 'error';

export interface UUIDResponse {
  status: UUIDStatus;
  uuid: string | null;
  message: string;
  details?: Record<string, unknown>;
}

export async function generateUUID(): Promise<UUIDResponse> {
  const response = await fetch(`${API_BASE_URL}/generate-uuid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return response.json();
}

export async function validateUUID(uuid: string): Promise<UUIDResponse> {
  const response = await fetch(`${API_BASE_URL}/validate-uuid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uuid }),
  });
  return response.json();
}
