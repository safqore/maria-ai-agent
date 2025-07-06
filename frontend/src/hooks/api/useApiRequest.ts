import { useState, useCallback } from 'react';
import { ApiError } from '../../api/config';

/**
 * States for an API request
 */
export enum RequestStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * State returned by the useApiRequest hook
 */
export interface UseApiRequestState<T> {
  /** The data returned by the API call, if successful */
  data: T | null;
  /** Any error that occurred during the API call */
  error: Error | null;
  /** The current status of the API request */
  status: RequestStatus;
}

/**
 * Custom hook for making API requests with standardized error handling and loading states.
 *
 * @template T - The type of the data returned by the API
 * @template P - The types of parameters to pass to the API function
 * @param apiFunction - The API function to call
 * @returns An object containing the request state and an execute function
 *
 * @example
 * const { data, error, status, execute } = useApiRequest(SessionApi.generateUUID);
 *
 * // Later, in a button click handler or useEffect:
 * useEffect(() => {
 *   execute();
 * }, [execute]);
 */
export function useApiRequest<T, P extends unknown[]>(apiFunction: (...args: P) => Promise<T>) {
  const [state, setState] = useState<UseApiRequestState<T>>({
    data: null,
    error: null,
    status: RequestStatus.IDLE,
  });

  /**
   * Execute the API request with the provided arguments
   */
  const execute = useCallback(
    async (...args: P): Promise<T | null> => {
      setState(prevState => ({
        ...prevState,
        status: RequestStatus.LOADING,
        error: null,
      }));

      try {
        const data = await apiFunction(...args);
        setState({
          data,
          error: null,
          status: RequestStatus.SUCCESS,
        });
        return data;
      } catch (error) {
        // Ensure we preserve the ApiError instance if it already is one
        let apiError: ApiError;

        if (error instanceof ApiError) {
          apiError = error;
        } else {
          apiError = new ApiError(
            error instanceof Error ? error.message : 'Unknown error occurred',
            500
          );
          // Preserve the stack trace
          if (error instanceof Error) {
            apiError.stack = error.stack;
          }
        }

        setState({
          data: null,
          error: apiError,
          status: RequestStatus.ERROR,
        });
        return null;
      }
    },
    [apiFunction]
  );

  return { ...state, execute };
}

export default useApiRequest;
