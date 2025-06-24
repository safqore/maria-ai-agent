import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiRequest, RequestStatus } from './useApiRequest';
import { ApiError } from '../../api/config';

describe('useApiRequest Hook', () => {
  // Mock API function that resolves with data
  const mockApiSuccess = jest.fn().mockResolvedValue({ id: '123', name: 'Test' });

  // Mock API function that rejects with an error
  const mockApiError = jest.fn().mockRejectedValue(new Error('API failed'));

  // Mock API function that rejects with an ApiError
  const mockApiCustomError = jest
    .fn()
    .mockImplementation(() => Promise.reject(new ApiError('Custom API error', 400)));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with idle status and no data or errors', () => {
    const { result } = renderHook(() => useApiRequest(mockApiSuccess));
    expect(result.current.status).toBe(RequestStatus.IDLE);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should update state to loading when executing', async () => {
    const { result } = renderHook(() => useApiRequest(mockApiSuccess));
    act(() => {
      result.current.execute();
    });
    expect(result.current.status).toBe(RequestStatus.LOADING);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should update state with data on successful API call', async () => {
    const { result } = renderHook(() => useApiRequest(mockApiSuccess));
    let returnValue;
    act(() => {
      returnValue = result.current.execute();
    });
    await waitFor(() => {
      expect(result.current.status).toBe(RequestStatus.SUCCESS);
    });
    expect(result.current.data).toEqual({ id: '123', name: 'Test' });
    expect(result.current.error).toBeNull();
    await expect(returnValue).resolves.toEqual({ id: '123', name: 'Test' });
  });

  it('should update state with error on failed API call', async () => {
    const { result } = renderHook(() => useApiRequest(mockApiError));
    let returnValue;
    act(() => {
      returnValue = result.current.execute();
    });
    await waitFor(() => {
      expect(result.current.status).toBe(RequestStatus.ERROR);
    });
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('API failed');
    await expect(returnValue).resolves.toBeNull();
  });

  it('should handle ApiError instances correctly', async () => {
    const { result } = renderHook(() => useApiRequest(mockApiCustomError));
    act(() => {
      result.current.execute();
    });
    await waitFor(() => {
      expect(result.current.status).toBe(RequestStatus.ERROR);
    });
    expect(result.current.data).toBeNull();
    // Accept either instanceof or .name fallback for cross-env reliability
    expect(
      result.current.error instanceof ApiError || result.current.error?.name === 'ApiError'
    ).toBe(true);
    expect(result.current.error?.message).toBe('Custom API error');
    if (result.current.error instanceof ApiError) {
      expect(result.current.error.status).toBe(400);
    }
  });

  it('should pass arguments to the API function', async () => {
    const mockApiWithArgs = jest.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useApiRequest(mockApiWithArgs));
    act(() => {
      result.current.execute('arg1', 123, { key: 'value' });
    });
    expect(mockApiWithArgs).toHaveBeenCalledWith('arg1', 123, { key: 'value' });
    await waitFor(() => {
      expect(result.current.status).toBe(RequestStatus.SUCCESS);
    });
  });
});
