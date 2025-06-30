/**
 * Base API Client
 *
 * Provides a foundation for all API requests with:
 * - API versioning
 * - Correlation ID tracking
 * - Request retry with linear backoff
 * - Enhanced error handling and logging
 * - Request/response performance tracking
 */
import { API_BASE_URL, API_TIMEOUT, VERBOSE_LOGGING } from '../utils/config';
import { ApiError, ApiErrorType } from './config';

// Constants
const API_VERSION = 'v1';
const API_PREFIX = `/api/${API_VERSION}`;
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY = 500; // ms
const DEFAULT_RETRY_INCREMENT = 500; // ms

// Types
export interface ApiRequestConfig extends RequestInit {
  retryCount?: number;
  timeout?: number;
  skipRetryFor?: number[];
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  correlationId?: string;
  requestTime?: number;
}

/**
 * Creates a full URL by combining the base URL, API prefix, and endpoint path
 */
export const createApiUrl = (endpoint: string): string => {
  // Remove any leading slash from endpoint
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Determine if endpoint already includes API versioning
  const hasApiPrefix = cleanEndpoint.startsWith('api/');
  
  // Build the URL
  if (hasApiPrefix) {
    return `${API_BASE_URL}/${cleanEndpoint}`;
  }
  return `${API_BASE_URL}${API_PREFIX}/${cleanEndpoint}`;
};

/**
 * Extracts the correlation ID from response headers
 */
export const extractCorrelationId = (headers: Headers): string | undefined => {
  return headers.get('X-Correlation-ID') || undefined;
};

/**
 * Determines if a request should be retried based on error status
 */
export const shouldRetry = (status: number, skipRetryFor: number[] = []): boolean => {
  // Skip retry for specific status codes (default: all 4xx except 429)
  if (skipRetryFor.includes(status)) {
    return false;
  }
  
  // Always retry on network errors (status 0)
  if (status === 0) {
    return true;
  }
  
  // Retry on server errors and rate limits
  return status >= 500 || status === 429;
};

/**
 * Performs a fetch with timeout capability
 */
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408, { type: ApiErrorType.TIMEOUT });
    }
    throw error;
  }
};

/**
 * Base API client function that handles requests with retries and correlation ID tracking
 */
export const apiClient = async <T>(
  endpoint: string,
  options: ApiRequestConfig = {}
): Promise<ApiResponse<T>> => {
  const { 
    retryCount = DEFAULT_RETRY_COUNT,
    timeout = API_TIMEOUT,
    skipRetryFor = [400, 401, 403, 404, 422],
    ...fetchOptions 
  } = options;
  
  // Ensure headers object exists
  const headers = new Headers(fetchOptions.headers);
  
  // Default content-type if not specified and method is not GET
  if (fetchOptions.method && fetchOptions.method !== 'GET' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Accept header for versioning
  headers.set('Accept', `application/json; version=${API_VERSION}`);
  
  const url = createApiUrl(endpoint);
  let attempts = 0;
  const startTime = Date.now();
  
  // Begin retry loop
  while (attempts <= retryCount) {
    try {
      attempts++;
      
      if (VERBOSE_LOGGING && attempts > 1) {
        console.log(`API retry attempt ${attempts} for ${url}`);
      }
      
      // Perform the fetch with timeout
      const response = await fetchWithTimeout(url, { ...fetchOptions, headers }, timeout);
      
      // Extract correlation ID from response
      const correlationId = extractCorrelationId(response.headers);
      
      // Calculate request time
      const requestTime = Date.now() - startTime;
      
      // Log performance for slow requests
      if (VERBOSE_LOGGING && requestTime > 1000) {
        console.warn(`Slow API request (${requestTime}ms): ${fetchOptions.method || 'GET'} ${url}`);
      }
      
      // Handle successful response
      if (response.ok) {
        let data: T;
        const contentType = response.headers.get('content-type');
        
        // Parse response based on content type
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          // For non-JSON responses (rare but possible)
          data = await response.text() as unknown as T;
        }
        
        return { 
          data, 
          status: response.status, 
          headers: response.headers,
          correlationId,
          requestTime
        };
      }
      
      // Check if we should retry
      if (attempts <= retryCount && shouldRetry(response.status, skipRetryFor)) {
        // Linear backoff delay
        const delay = DEFAULT_RETRY_DELAY + (attempts - 1) * DEFAULT_RETRY_INCREMENT;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If we get here, the request failed and we're out of retries
      // Try to parse error response
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }
      
      throw new ApiError(
        errorData.message || `API Error: ${response.status} ${response.statusText}`,
        response.status,
        {
          url,
          correlationId,
          ...errorData
        }
      );
    } catch (error) {
      // Handle network errors and aborts
      if (!(error instanceof ApiError)) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          // Network error
          if (attempts <= retryCount) {
            // Linear backoff delay
            const delay = DEFAULT_RETRY_DELAY + (attempts - 1) * DEFAULT_RETRY_INCREMENT;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new ApiError('Network error: Could not connect to the server', 0, {
            url,
            type: ApiErrorType.NETWORK,
            originalError: error
          });
        } else if (error instanceof DOMException && error.name === 'AbortError') {
          // Timeout error (already converted to ApiError in fetchWithTimeout)
          throw new ApiError('Request timeout', 408, {
            url,
            type: ApiErrorType.TIMEOUT,
            originalError: error
          });
        }
        // Other unknown error
        throw new ApiError(`Unknown API error: ${(error as Error).message}`, 0, {
          url,
          type: ApiErrorType.UNKNOWN,
          originalError: error
        });
      }
      throw error;
    }
  }
  
  // This should never be reached due to the throw in the loop, but TypeScript needs it
  throw new ApiError('Unexpected error in API client', 0);
};

// Convenience methods for common HTTP verbs
export const get = <T>(endpoint: string, options?: ApiRequestConfig): Promise<ApiResponse<T>> => {
  return apiClient<T>(endpoint, { ...options, method: 'GET' });
};

export const post = <T>(endpoint: string, data?: any, options?: ApiRequestConfig): Promise<ApiResponse<T>> => {
  return apiClient<T>(endpoint, { 
    ...options, 
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
  });
};

export const put = <T>(endpoint: string, data?: any, options?: ApiRequestConfig): Promise<ApiResponse<T>> => {
  return apiClient<T>(endpoint, { 
    ...options, 
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined
  });
};

export const patch = <T>(endpoint: string, data?: any, options?: ApiRequestConfig): Promise<ApiResponse<T>> => {
  return apiClient<T>(endpoint, { 
    ...options, 
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined
  });
};

export const del = <T>(endpoint: string, options?: ApiRequestConfig): Promise<ApiResponse<T>> => {
  return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
};
