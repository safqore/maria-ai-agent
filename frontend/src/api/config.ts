/**
 * API Configuration
 *
 * Centralized configuration for API endpoints and settings.
 * Re-exports variables from the main config to maintain consistency.
 */
import { 
  API_BASE_URL, 
  API_TIMEOUT,
  MOCK_API, 
  SKIP_SESSION_VALIDATION 
} from '../utils/config';

export { 
  API_BASE_URL, 
  API_TIMEOUT,
  MOCK_API, 
  SKIP_SESSION_VALIDATION
};

/**
 * Error types for API requests
 */
export enum ApiErrorType {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  SERVER = 'server',
  VALIDATION = 'validation',
  UNAUTHORIZED = 'unauthorized',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown',
}

/**
 * Default request headers for API calls
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * Common API response interface that all API responses should follow
 */
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

/**
 * Generic API error for handling failed requests
 */
export class ApiError extends Error {
  status: number;
  type: ApiErrorType;
  details?: any;

  constructor(message: string, status = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.type = this.determineErrorType(status);
  }

  /**
   * Determines the error type based on the status code
   */
  private determineErrorType(status: number): ApiErrorType {
    if (status >= 500) return ApiErrorType.SERVER;
    if (status === 401 || status === 403) return ApiErrorType.UNAUTHORIZED;
    if (status === 404) return ApiErrorType.NOT_FOUND;
    if (status >= 400 && status < 500) return ApiErrorType.VALIDATION;
    return ApiErrorType.UNKNOWN;
  }
}

/**
 * Creates an API error from various types of error objects
 */
export function createApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new ApiError('Network error: Could not connect to the server', 0);
  }
  
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return new ApiError('Request timeout: The server took too long to respond', 408);
    }
    return new ApiError(error.message);
  }
  
  return new ApiError('An unknown error occurred');
}
