/**
 * Configuration utilities for the frontend application.
 *
 * This module provides centralized configuration variables that can be imported and used
 * throughout the application, ensuring consistency and making it easy to update values
 * in a single location.
 */

/**
 * API Configuration
 */

/**
 * Base URL for backend API requests.
 *
 * This value is read from the REACT_APP_API_BASE_URL environment variable,
 * with a fallback to localhost:5000 if the environment variable is not set.
 *
 * @example
 * // Import and use in API calls
 * import { API_BASE_URL } from './config';
 *
 * fetch(`${API_BASE_URL}/api/endpoint`);
 */
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

/**
 * Default request timeout in milliseconds
 */
export const API_TIMEOUT = 30000; // 30 seconds

/**
 * Feature flags
 */

/**
 * Whether to use mock API responses
 */
export const MOCK_API = process.env.REACT_APP_MOCK_API === 'true';

/**
 * Whether to skip session validation
 * Used primarily for development or testing environments
 */
export const SKIP_SESSION_VALIDATION = process.env.REACT_APP_SKIP_SESSION_VALIDATION === 'true';

/**
 * Whether to enable verbose logging
 */
export const VERBOSE_LOGGING = process.env.REACT_APP_VERBOSE_LOGGING === 'true';

/**
 * Whether to use development fallbacks when services are unavailable
 */
export const USE_DEV_FALLBACKS = process.env.REACT_APP_USE_DEV_FALLBACKS === 'true';
