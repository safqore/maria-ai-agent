import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatApi } from '../useChatApi';
import { ChatApi, ChatResponse } from '../../../api/chatApi';

// Mock the API
jest.mock('../../../api/chatApi', () => ({
  ChatApi: {
    sendMessage: jest.fn(),
  },
}));

describe('useChatApi', () => {
  const mockSessionUUID = '12345-67890';
  const mockSuccessResponse: ChatResponse = {
    status: 'success',
    message: {
      id: '1',
      text: 'Hello from the API',
      sender: 'bot',
      timestamp: Date.now(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useChatApi(mockSessionUUID));

    expect(result.current.messageResponse).toBeNull();
    expect(result.current.messageError).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('sends message and handles success', async () => {
    (ChatApi.sendMessage as jest.Mock).mockResolvedValue(mockSuccessResponse);

    const { result } = renderHook(() => useChatApi(mockSessionUUID));

    let response: ChatResponse | null = null;
    await act(async () => {
      response = await result.current.sendMessage('Hello');
    });

    await waitFor(() => {
      expect(result.current.messageResponse).toEqual(mockSuccessResponse);
    });

    expect(ChatApi.sendMessage).toHaveBeenCalledWith('Hello', mockSessionUUID);
    expect(response).toEqual(mockSuccessResponse);
    expect(result.current.messageError).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('handles errors when sending message', async () => {
    const mockError = new Error('API error');
    (ChatApi.sendMessage as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useChatApi(mockSessionUUID));

    let response: ChatResponse | null = null;
    await act(async () => {
      try {
        response = await result.current.sendMessage('Hello');
      } catch (error) {
        // Error expected
      }
    });

    await waitFor(() => {
      expect(result.current.messageError).not.toBeNull();
    });

    expect(ChatApi.sendMessage).toHaveBeenCalledWith('Hello', mockSessionUUID);
    expect(response).toBeNull();
    expect(result.current.messageResponse).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('throws error when sessionUUID is missing', async () => {
    const { result } = renderHook(() => useChatApi(''));

    await act(async () => {
      try {
        await result.current.sendMessage('Hello');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toEqual(new Error('Session UUID is required to send messages'));
      }
    });

    expect(ChatApi.sendMessage).not.toHaveBeenCalled();
  });
});
