import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiWithSession } from './useApiWithSession';
import * as useSessionManagerModule from './useSessionManager';
import * as useFetchModule from './api/useFetch';

// Mock the dependencies
jest.mock('./useSessionManager');
jest.mock('./api/useFetch');

describe('useApiWithSession', () => {
  // Mock the session manager hook
  const mockGetSessionHeaders = jest.fn().mockReturnValue({
    'X-Session-ID': 'test-session-id',
    'Content-Type': 'application/json',
  });

  const mockSessionManager = {
    sessionId: 'test-session-id',
    isLoading: false,
    error: null,
    resetSession: jest.fn(),
    getSessionHeaders: mockGetSessionHeaders,
    isSessionValid: true,
  };

  // Mock the useFetch hook
  const mockFetchExecute = jest.fn();
  const mockFetchCancel = jest.fn();
  const mockFetchResult = {
    data: null,
    isLoading: false,
    error: null,
    execute: mockFetchExecute,
    cancel: mockFetchCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup useSessionManager mock
    (useSessionManagerModule.useSessionManager as jest.Mock).mockReturnValue(mockSessionManager);

    // Setup useFetch mock
    (useFetchModule.useFetch as jest.Mock).mockReturnValue(mockFetchResult);
  });

  it('should forward options to useFetch', () => {
    const apiFunction = jest.fn();
    const options = { immediate: true, initialData: { test: 'data' } };

    renderHook(() => useApiWithSession(apiFunction, options));

    // Check that useFetch was called with the wrapped function and options
    expect(useFetchModule.useFetch).toHaveBeenCalledWith(expect.any(Function), options);
  });

  it('should return isSessionValid from useSessionManager', () => {
    const apiFunction = jest.fn();

    const { result } = renderHook(() => useApiWithSession(apiFunction));

    expect(result.current.isSessionValid).toBe(true);
  });

  it('should add session headers to request options', async () => {
    // Create a mock API function
    const apiFunction = jest.fn().mockResolvedValue({ data: 'test' });

    // Set up useFetch to call the wrapped function when execute is called
    mockFetchExecute.mockImplementation(options => {
      const wrappedFn = (useFetchModule.useFetch as jest.Mock).mock.calls[0][0];
      return wrappedFn(options);
    });

    const { result } = renderHook(() => useApiWithSession(apiFunction));

    // Call execute with some options
    await act(async () => {
      await result.current.execute({ data: 'test-data', headers: { 'Custom-Header': 'value' } });
    });

    // Check that apiFunction was called with the merged headers
    expect(apiFunction).toHaveBeenCalledWith({
      data: 'test-data',
      headers: {
        'Custom-Header': 'value',
        'X-Session-ID': 'test-session-id',
        'Content-Type': 'application/json',
      },
    });
  });
});
