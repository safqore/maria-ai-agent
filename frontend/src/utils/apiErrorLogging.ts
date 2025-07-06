/**
 * API Error Logging
 *
 * Utilities for logging API errors and connecting the API error handling
 * with the centralized logging system.
 */

import { ApiError } from '../api/config';
import { logger } from './logger';

/**
 * Log an API error with appropriate context
 *
 * @param error - The API error to log
 * @param context - Additional context information
 * @param silent - Whether to suppress console output (for expected errors)
 */
export function logApiError(
  error: ApiError | Error | unknown,
  context: Record<string, any> = {},
  silent = false
): void {
  // If it's already an ApiError, log it directly
  if (error instanceof ApiError) {
    if (!silent) {
      logger.error(error, {
        ...context,
        statusCode: error.status,
        errorType: error.type,
        errorDetails: error.details,
      });
    }
    return;
  }

  // Handle unknown error types
  const unknownError = error instanceof Error ? error : new Error(String(error));

  if (!silent) {
    logger.error(unknownError, {
      ...context,
      originalError: error,
    });
  }
}

/**
 * Middleware to wrap API calls with error logging
 *
 * @param apiCall - The API function to call
 * @param context - Context information to include in logs
 * @param silent - Whether to suppress console output
 * @returns The result of the API call
 *
 * @example
 * ```typescript
 * // Wrap a specific API call with logging
 * const result = await withErrorLogging(
 *   () => api.getUser(userId),
 *   { userId, action: 'getUser' }
 * );
 * ```
 */
export async function withErrorLogging<T>(
  apiCall: () => Promise<T>,
  context: Record<string, any> = {},
  silent = false
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    logApiError(error, context, silent);
    throw error;
  }
}

/**
 * Create a wrapped version of an API function with error logging
 *
 * @param apiFunction - The API function to wrap
 * @param defaultContext - Default context to include in all logs
 * @returns A wrapped version of the API function
 *
 * @example
 * ```typescript
 * // Create a wrapped version of the API
 * const safeApiClient = {
 *   getUser: createErrorLoggingWrapper(api.getUser.bind(api), { service: 'UserService' }),
 *   updateUser: createErrorLoggingWrapper(api.updateUser.bind(api), { service: 'UserService' })
 * };
 *
 * // Use the wrapped API
 * const user = await safeApiClient.getUser(userId);
 * ```
 */
export function createErrorLoggingWrapper<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  defaultContext: Record<string, any> = {}
): T {
  return ((...args: Parameters<T>) => {
    return withErrorLogging(() => apiFunction(...args), {
      ...defaultContext,
      functionName: apiFunction.name || 'anonymous',
      arguments: args.map(arg =>
        typeof arg === 'object' ? (arg === null ? null : Object.keys(arg)) : typeof arg
      ),
    });
  }) as T;
}
