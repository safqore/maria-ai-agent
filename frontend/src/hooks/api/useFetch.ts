/**
 * useFetch Hook
 *
 * A custom React hook for data fetching that provides:
 * - Type-safe API calls
 * - Loading states
 * - Error handling
 * - Request cancellation
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError, ApiErrorType, createApiError } from '../../api/config';

/**
 * State structure for the useFetch hook
 */
interface UseFetchState<T> {
  /** The data returned from the API call */
  data: T | null;
  /** Whether the request is currently loading */
  isLoading: boolean;
  /** Any error that occurred during the request */
  error: Error | null;
}

/**
 * Options for the useFetch hook
 */
interface UseFetchOptions<D = any> {
  /** Whether to execute the request immediately */
  immediate?: boolean;
  /** Initial data to use before the request completes */
  initialData?: D | null;
  /** Maximum number of retry attempts for failed requests */
  retryCount?: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay?: number;
  /** Types of errors that should trigger a retry */
  retryErrorTypes?: ApiErrorType[];
  /** Custom error handling function */
  customErrorHandler?: (error: Error) => void;
  /** Custom data processor function */
  customDataProcessor?: (data: any) => any;
}

/**
 * A custom hook for data fetching with built-in loading states, error handling, and retry capabilities.
 *
 * @template T - The type of data returned from the API call
 * @template P - The parameters for the API function
 * @param apiFunction - The API function to call
 * @param options - Options for the hook
 * @param options.immediate - Whether to execute the request immediately
 * @param options.initialData - Initial data to use before the request completes
 * @param options.retryCount - Maximum number of retry attempts for failed requests (default: 3)
 * @param options.retryDelay - Delay between retry attempts in milliseconds (default: 1000)
 * @param options.retryErrorTypes - Types of errors that should trigger a retry (default: NETWORK and TIMEOUT)
 * @returns An object containing the data, loading state, error, execute function, cancel function, and retry function
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data, isLoading, error, execute } = useFetch(
 *   UserApi.getProfile,
 *   { immediate: true }
 * );
 *
 * // With retry configuration
 * const { data, isLoading, error, execute, retry } = useFetch(
 *   UserApi.getProfile,
 *   {
 *     immediate: true,
 *     retryCount: 5,
 *     retryDelay: 500,
 *     retryErrorTypes: [ApiErrorType.NETWORK, ApiErrorType.TIMEOUT, ApiErrorType.SERVER]
 *   }
 * );
 *
 * // To manually retry a failed request
 * const handleRetry = () => {
 *   retry();
 * };
 *
 * // To cancel an in-flight request
 * const handleCancel = () => {
 *   cancel();
 * };
 * ```
 */
export function useFetch<T, P extends any[] = []>(
  apiFunction: (...args: P) => Promise<T>,
  options: UseFetchOptions<T> = {}
) {
  const {
    immediate = false,
    initialData = null,
    retryCount = 3,
    retryDelay = 1000,
    retryErrorTypes = [ApiErrorType.NETWORK, ApiErrorType.TIMEOUT],
    customErrorHandler,
    customDataProcessor,
  } = options;

  const [state, setState] = useState<UseFetchState<T>>({
    data: initialData,
    isLoading: false, // Always start with false to avoid React warnings
    error: null,
  });

  // Use AbortController for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Execute the API function with the provided arguments
   */
  // Retry counter ref to track current retry attempt
  const retryAttemptsRef = useRef<number>(0);

  /**
   * Sleep function for retry delays
   */
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Checks if an error should trigger a retry
   */
  const shouldRetry = useCallback(
    (error: ApiError): boolean => {
      return retryErrorTypes.includes(error.type);
    },
    [retryErrorTypes]
  );

  const execute = useCallback(
    async (...args: P): Promise<T | null> => {
      // Reset retry counter on new execution
      retryAttemptsRef.current = 0;

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create a new AbortController for this request
      abortControllerRef.current = new AbortController();

      // For immediate execution, we already set isLoading in the initial state
      if (!immediate || didExecuteRef.current) {
        // Update state to indicate loading
        setState(prevState => ({ ...prevState, isLoading: true, error: null }));
      }

      const executeWithRetry = async (retryAttempt: number): Promise<T | null> => {
        try {
          // Add signal to the last argument if it's an object (fetch options)
          const lastArg = args.length > 0 ? args[args.length - 1] : undefined;
          if (
            lastArg &&
            typeof lastArg === 'object' &&
            !Array.isArray(lastArg) &&
            abortControllerRef.current
          ) {
            (args[args.length - 1] as any).signal = abortControllerRef.current.signal;
          }

          // Execute the API function
          const result = await apiFunction(...args);

          // Update state with the result
          setState({
            data: result,
            isLoading: false,
            error: null,
          });

          return result;
        } catch (error: unknown) {
          // Don't update state if the request was aborted
          if (error instanceof DOMException && error.name === 'AbortError') {
            return null;
          }

          // Handle other errors using the createApiError utility
          const apiError = createApiError(error);

          // Check if we should retry
          if (retryAttempt < retryCount && shouldRetry(apiError)) {
            // Wait before retrying (with exponential backoff)
            const delayTime = retryDelay * Math.pow(2, retryAttempt);
            await sleep(delayTime);

            // Retry the request
            return executeWithRetry(retryAttempt + 1);
          }

          // Max retries reached or not a retryable error
          setState({
            data: null,
            isLoading: false,
            error: apiError,
          });

          return null;
        }
      };

      return executeWithRetry(0);
    },
    [apiFunction, retryCount, retryDelay, shouldRetry]
  );

  /**
   * Cancel the current request
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Execute the request immediately if specified, but only once
  const didExecuteRef = useRef(false);

  useEffect(() => {
    // Only run this effect once
    if (immediate && !didExecuteRef.current) {
      // Mark that we've executed to prevent infinite loops
      didExecuteRef.current = true;

      // Set loading state first, synchronously
      setState(prevState => ({ ...prevState, isLoading: true }));

      // Execute the fetch without setTimeout - simpler approach
      // React act() should handle this but there are edge cases especially with async operations
      // For testing, we silence act warnings in the specific test rather than making the code more complex
      void execute(...([] as any as P));
    }

    // Clean up on unmount
    return () => {
      cancel();
    };
  }, [immediate, cancel, execute]);

  /**
   * Manually retry the last failed request
   */
  const retry = useCallback(() => {
    if (state.error && !state.isLoading) {
      return execute(...([] as unknown as P));
    }
    return Promise.resolve(null);
  }, [state.error, state.isLoading, execute]);

  return {
    ...state,
    execute,
    cancel,
    retry,
  };
}
