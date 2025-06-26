/**
 * useApiWithSession Hook
 * 
 * A custom React hook that combines useFetch with session management,
 * automatically including session headers in API requests.
 */
import { useCallback } from 'react';
import { useFetch } from './api/useFetch';
import { useSessionManager } from './useSessionManager';

/**
 * Options for the useApiWithSession hook
 */
interface UseApiWithSessionOptions<D = any> {
  /** Whether to execute the request immediately */
  immediate?: boolean;
  /** Initial data to use before the request completes */
  initialData?: D | null;
}

/**
 * A custom hook that combines data fetching with session management
 * 
 * @template T - The type of data returned from the API call
 * @template P - The parameters for the API function
 * @param apiFunction - The API function to call
 * @param options - Options for the hook
 * @returns The same interface as useFetch, but with session headers automatically included
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, execute } = useApiWithSession(
 *   ChatApi.sendMessage,
 *   { immediate: false }
 * );
 * 
 * // Later, to send a message:
 * const handleSend = (message) => {
 *   execute(message);
 * };
 * ```
 */
export function useApiWithSession<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>,
  options: UseApiWithSessionOptions<T> = {}
) {
  const { getSessionHeaders, isSessionValid } = useSessionManager();
  
  // Create a wrapped API function that includes session headers
  const apiWithSession = useCallback(
    async (...args: P): Promise<T> => {
      // Find options object if it exists (typically the last argument for fetch)
      const lastArg = args.length > 0 ? args[args.length - 1] : undefined;
      
      if (lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg)) {
        // If the last argument is an options object, add headers to it
        const sessionHeaders = getSessionHeaders();
        const existingHeaders = (lastArg as any).headers || {};
        
        // Create a modified version of the last argument
        const modifiedLastArg = {
          ...lastArg,
          headers: {
            ...existingHeaders,
            ...sessionHeaders,
          },
        };
        
        // Replace the last argument with the modified version
        args[args.length - 1] = modifiedLastArg as any;
      }
      
      return apiFunction(...args);
    },
    [apiFunction, getSessionHeaders]
  );
  
  // Use the wrapped API function with useFetch
  const result = useFetch<T, P>(apiWithSession, options);
  
  return {
    ...result,
    isSessionValid,
  };
}
