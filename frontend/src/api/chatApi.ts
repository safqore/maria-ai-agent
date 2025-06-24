/**
 * Chat API Service
 *
 * Handles all API calls related to chat functionality, including:
 * - Sending user messages
 * - Receiving bot responses
 */
import { API_BASE_URL, DEFAULT_HEADERS, ApiError } from './config';

/**
 * Message object representing a single chat message
 */
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

/**
 * Chat response from the backend API
 */
export interface ChatResponse {
  status: 'success' | 'error';
  message?: Message;
  error?: string;
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
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          text,
          session_uuid: sessionUUID,
        }),
      });

      if (!response.ok) {
        throw new ApiError(`Failed to send message: ${response.statusText}`, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Failed to send message: ${(error as Error).message}`);
    }
  },
};
