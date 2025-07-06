import { renderHook } from '@testing-library/react';
import { useSessionManager } from './useSessionManager';
import * as useSessionUUIDModule from './useSessionUUID';

// Mock the useSessionUUID hook
jest.mock('./useSessionUUID', () => ({
  useSessionUUID: jest.fn(),
}));

describe('useSessionManager', () => {
  const mockUseSessionUUID = useSessionUUIDModule.useSessionUUID as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return valid session when session UUID exists', () => {
    // Set up the mock to return a valid session
    mockUseSessionUUID.mockReturnValue({
      sessionUUID: 'test-uuid',
      loading: false,
      error: null,
      resetSession: jest.fn().mockResolvedValue(undefined),
    });

    const { result } = renderHook(() => useSessionManager());

    expect(result.current.sessionId).toBe('test-uuid');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSessionValid).toBe(true);
    expect(typeof result.current.resetSession).toBe('function');

    // Test session headers
    const headers = result.current.getSessionHeaders();
    expect(headers['X-Session-ID']).toBe('test-uuid');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('should return invalid session when session UUID is missing', () => {
    // Set up the mock to return an invalid session
    mockUseSessionUUID.mockReturnValue({
      sessionUUID: '',
      loading: false,
      error: null,
      resetSession: jest.fn().mockResolvedValue(undefined),
    });

    const { result } = renderHook(() => useSessionManager());

    expect(result.current.sessionId).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSessionValid).toBe(false);

    // Test session headers with no UUID
    const headers = result.current.getSessionHeaders();
    expect(headers['X-Session-ID']).toBeUndefined();
  });

  it('should reflect loading state from useSessionUUID', () => {
    // Set up the mock to return a loading state
    mockUseSessionUUID.mockReturnValue({
      sessionUUID: '',
      loading: true,
      error: null,
      resetSession: jest.fn().mockResolvedValue(undefined),
    });

    const { result } = renderHook(() => useSessionManager());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSessionValid).toBe(false);
  });

  it('should reflect error state from useSessionUUID', () => {
    const errorMessage = 'Session error';

    // Set up the mock to return an error state
    mockUseSessionUUID.mockReturnValue({
      sessionUUID: '',
      loading: false,
      error: errorMessage,
      resetSession: jest.fn().mockResolvedValue(undefined),
    });

    const { result } = renderHook(() => useSessionManager());

    expect(result.current.error).toBe(errorMessage);
  });

  it('should call resetSession from useSessionUUID', async () => {
    const mockReset = jest.fn().mockResolvedValue(undefined);

    // Set up the mock to return a resetSession function
    mockUseSessionUUID.mockReturnValue({
      sessionUUID: 'test-uuid',
      loading: false,
      error: null,
      resetSession: mockReset,
    });

    const { result } = renderHook(() => useSessionManager());

    // Call resetSession
    await result.current.resetSession();

    // Verify it was called
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
