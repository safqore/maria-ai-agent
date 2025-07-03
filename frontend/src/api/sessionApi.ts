/**
 * Session API Service
 *
 * Handles all API calls related to user sessions, including:
 * - UUID generation
 * - UUID validation
 * - Session persistence
 */
import { ApiError } from './config';
import { post, get } from './apiClient';

/**
 * UUID response from the backend API
 */
export interface UUIDResponse {
  status: 'success' | 'collision' | 'invalid' | 'error';
  uuid: string | null;
  message: string;
  details?: Record<string, unknown>;
  correlationId?: string;
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
      const response = await post<UUIDResponse>('generate-uuid');
      
      // Add correlation ID to the response
      return {
        ...response.data,
        correlationId: response.correlationId
      };
    } catch (error) {
      throw error instanceof ApiError 
        ? error 
        : new ApiError(`Failed to generate UUID: ${(error as Error).message}`);
    }
  },

  /**
   * Validate an existing UUID with the backend
   * @param uuid - The UUID to validate
   * @returns Promise resolving to the UUID validation response
   */
  validateUUID: async (uuid: string): Promise<UUIDResponse> => {
    try {
      const response = await post<UUIDResponse>('validate-uuid', { uuid });
      
      // Add correlation ID to the response
      return {
        ...response.data,
        correlationId: response.correlationId
      };
    } catch (error) {
      throw error instanceof ApiError 
        ? error 
        : new ApiError(`Failed to validate UUID: ${(error as Error).message}`);
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
      const response = await post<UUIDResponse>('persist_session', {
        uuid,
        consent_user_data: consentUserData,
      });
      
      // Add correlation ID to the response
      return {
        ...response.data,
        correlationId: response.correlationId
      };
    } catch (error) {
      throw error instanceof ApiError 
        ? error 
        : new ApiError(`Failed to persist session: ${(error as Error).message}`);
    }
  },
};
