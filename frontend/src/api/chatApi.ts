/**
 * Chat API Service
 *
 * Handles all API calls related to chat functionality, including:
 * - Sending user messages
 * - Receiving bot responses
 */
import { ApiError } from './config';
import { post } from './apiClient';

/**
 * Message object representing a single chat message
 */
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  nextState?: string; // State to transition to after processing this message
  nextTransition?: string; // Transition to trigger after processing this message
}

/**
 * Chat response from the backend API
 */
export interface ChatResponse {
  status: 'success' | 'error';
  message?: Message;
  error?: string;
  correlationId?: string;
}

/**
 * Chat API service object containing methods for chat-related operations
 */
export const ChatApi = {
  /**
   * Send a message to the backend and get a response
   * @param text - The text message to send
   * @param sessionUUID - The session UUID to associate with the message
   * @returns Promise resolving to the chat response
   */
  sendMessage: async (text: string, sessionUUID: string): Promise<ChatResponse> => {
    try {
      const response = await post<ChatResponse>('chat', {
        text,
        session_uuid: sessionUUID,
      });

      // Add correlation ID to the response
      return {
        ...response.data,
        correlationId: response.correlationId,
      };
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new ApiError(`Failed to send message: ${(error as Error).message}`);
    }
  },
};
