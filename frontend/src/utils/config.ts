// Utility to get backend API URL from environment variables
// Usage: import { API_BASE_URL } from './config';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
