/**
 * Session API Service
 *
 * Handles all API calls related to user sessions, including:
 * - UUID generation
 * - UUID validation
 * - Session persistence
 */
import { API_BASE_URL, DEFAULT_HEADERS, ApiError } from './config';

/**
 * UUID response from the backend API
 */
export interface UUIDResponse {
  status: 'success' | 'collision' | 'invalid' | 'error';
  uuid: string | null;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Session API service object containing methods for session-related operations
 */
export const SessionApi = {
  /**
   * Generate a new UUID from the backend
   * @returns Promise resolving to the UUID response
   */
  generateUUID: async (): Promise<UUIDResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-uuid`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
      });

      if (!response.ok) {
        throw new ApiError(`Failed to generate UUID: ${response.statusText}`, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Failed to generate UUID: ${(error as Error).message}`);
    }
  },

  /**
   * Validate an existing UUID with the backend
   * @param uuid - The UUID to validate
   * @returns Promise resolving to the UUID validation response
   */
  validateUUID: async (uuid: string): Promise<UUIDResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/validate-uuid`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ uuid }),
      });

      if (!response.ok) {
        throw new ApiError(`Failed to validate UUID: ${response.statusText}`, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Failed to validate UUID: ${(error as Error).message}`);
    }
  },

  /**
   * Persist the session with user data consent flags
   * @param uuid - The session UUID to persist
   * @param consentUserData - Whether the user has consented to data storage
   * @returns Promise resolving to the session persistence response
   */
  persistSession: async (uuid: string, consentUserData = false): Promise<UUIDResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/persist-session`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          uuid,
          consent_user_data: consentUserData,
        }),
      });

      if (!response.ok) {
        throw new ApiError(`Failed to persist session: ${response.statusText}`, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Failed to persist session: ${(error as Error).message}`);
    }
  },
};
