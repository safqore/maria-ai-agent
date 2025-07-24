/**
 * Session API Service
 *
 * Handles all API calls related to user sessions, including:
 * - UUID generation
 * - UUID validation
 * - Session persistence
 */
import { ApiError } from './config';
import { post } from './apiClient';

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
        correlationId: response.correlationId,
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
        correlationId: response.correlationId,
      };
    } catch (error) {
      // Handle 409 (UUID collision) as a valid business response, not an error
      if (error instanceof ApiError && error.status === 409) {
        // Extract the response data from the error details
        const errorDetails = error.details as any;
        return {
          status: errorDetails?.status || 'collision',
          uuid: errorDetails?.uuid || uuid,
          message: errorDetails?.message || 'UUID already exists',
          correlationId: errorDetails?.correlationId,
        };
      }

      throw error instanceof ApiError
        ? error
        : new ApiError(`Failed to validate UUID: ${(error as Error).message}`);
    }
  },

  /**
   * Persist the session with user data
   * @param sessionUuid - The session UUID to persist
   * @param name - The user's name (optional)
   * @param email - The user's email (optional)
   * @returns Promise resolving to the session persistence response
   */
  persistSession: async (
    sessionUuid: string,
    name?: string,
    email?: string
  ): Promise<UUIDResponse> => {
    try {
      console.log('SessionApi.persistSession called with:', { sessionUuid, name, email });

      const payload = {
        session_uuid: sessionUuid,
        name: name || '',
        email: email || '',
      };

      console.log('Sending payload:', payload);

      const response = await post<UUIDResponse>('persist_session', payload);

      console.log('SessionApi.persistSession response:', response);

      // Add correlation ID to the response
      return {
        ...response.data,
        correlationId: response.correlationId,
      };
    } catch (error) {
      console.error('SessionApi.persistSession error:', error);

      if (error instanceof ApiError) {
        // Log additional details for debugging
        console.error('ApiError details:', {
          message: error.message,
          status: error.status,
          details: error.details,
        });
      }

      throw error instanceof ApiError
        ? error
        : new ApiError(`Failed to persist session: ${(error as Error).message}`);
    }
  },
};
