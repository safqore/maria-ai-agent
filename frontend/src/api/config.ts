/**
 * API Configuration
 *
 * Centralized configuration for API endpoints and settings.
 * Re-exports the base URL from the main config to maintain consistency.
 */
import { API_BASE_URL } from '../utils/config';

export { API_BASE_URL };

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

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
