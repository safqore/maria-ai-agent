import { renderHook, act, waitFor } from '@testing-library/react';
import { useFetch } from '../useFetch';

// Mock the API config module
jest.mock('../../../api/config', () => {
  // Simple mock of ApiErrorType enum
  const ApiErrorType = {
    NETWORK: 'network',
    TIMEOUT: 'timeout',
    SERVER: 'server',
    VALIDATION: 'validation',
    UNAUTHORIZED: 'unauthorized',
    NOT_FOUND: 'not_found',
    UNKNOWN: 'unknown',
  };
  
  // Simple mock of ApiError class
  class MockApiError extends Error {
    status: number;
    type: string;
    
    constructor(message: string, status = 500) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      
      // Set type based on status
      if (status >= 500) this.type = ApiErrorType.SERVER;
      else if (status === 0) this.type = ApiErrorType.NETWORK;
      else this.type = ApiErrorType.UNKNOWN;
    }
  }
  
  return {
    ApiErrorType,
    ApiError: MockApiError,
    createApiError: (error: unknown) => {
      if (error instanceof MockApiError) return error;
      if (error instanceof Error) return new MockApiError(error.message);
      return new MockApiError('Unknown error');
    }
  };
});

// Mock API functions for testing
const mockApiSuccess = jest.fn().mockResolvedValue({ data: 'test result' });
const mockApiError = jest.fn().mockRejectedValue(new Error('Test error'));

describe('useFetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFetch(mockApiSuccess));
    
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBeFalsy();
    expect(result.current.error).toBeNull();
  });
  
  it('should start loading when execute is called', async () => {
    const { result } = renderHook(() => useFetch(mockApiSuccess));
    
    let promise: Promise<any> | null = null;
    act(() => {
      promise = result.current.execute();
    });
    
    // We need to check immediately after state update
    expect(result.current.isLoading).toBeTruthy();
    
    // Wait for the promise to resolve to clean up
    if (promise) await promise;
  });
  
  it('should successfully load data', async () => {
    const { result } = renderHook(() => useFetch(mockApiSuccess));
    
    await act(async () => {
      result.current.execute();
    });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBeFalsy();
    });
    
    expect(result.current.data).toEqual({ data: 'test result' });
    expect(result.current.error).toBeNull();
  });
  
  it('should handle errors', async () => {
    const { result } = renderHook(() => useFetch(mockApiError));
    
    await act(async () => {
      result.current.execute();
    });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBeFalsy();
    });
    
    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
  });
  
  it('should execute immediately when immediate=true', async () => {
    // The issue is related to how renderHook and act work together with immediate execution
    let result: any;
    
    act(() => {
      result = renderHook(() => useFetch(mockApiSuccess, { immediate: true }));
    });
    
    // Should start in loading state
    expect(result.result.current.isLoading).toBeTruthy();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(result.result.current.isLoading).toBeFalsy();
    });
    
    expect(mockApiSuccess).toHaveBeenCalledTimes(1);  // Should only be called once
  });
  
  it('should use initialData when provided', () => {
    const initialData = { test: 'initialValue' };
    const { result } = renderHook(() => useFetch(mockApiSuccess, { initialData }));
    
    expect(result.current.data).toEqual(initialData);
  });
});
