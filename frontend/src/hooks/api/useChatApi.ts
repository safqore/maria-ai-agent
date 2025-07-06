import { useCallback } from 'react';
import { useApiRequest, RequestStatus } from './useApiRequest';
import { ChatApi, ChatResponse } from '../../api/chatApi';

/**
 * Hook for managing chat API operations
 */
export const useChatApi = (sessionUUID: string) => {
  // Create API request hook for the sendMessage function
  const {
    data: messageResponse,
    error: messageError,
    status: messageStatus,
    execute: executeSendMessage,
  } = useApiRequest<ChatResponse, [string, string]>(ChatApi.sendMessage);

  /**
   * Send a message to the chat API
   * @param text - The message text to send
   * @returns A promise resolving to the chat response, or null if an error occurred
   */
  const sendMessage = useCallback(
    async (text: string): Promise<ChatResponse | null> => {
      if (!sessionUUID) {
        throw new Error('Session UUID is required to send messages');
      }

      return executeSendMessage(text, sessionUUID);
    },
    [sessionUUID, executeSendMessage]
  );

  return {
    messageResponse,
    messageError,
    isLoading: messageStatus === RequestStatus.LOADING,
    sendMessage,
  };
};

export default useChatApi;
