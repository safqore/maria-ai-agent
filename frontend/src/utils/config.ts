/**
 * Configuration utilities for the frontend application.
 *
 * This module provides centralized configuration variables that can be imported and used
 * throughout the application, ensuring consistency and making it easy to update values
 * in a single location.
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
