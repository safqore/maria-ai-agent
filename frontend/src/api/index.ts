/**
 * API Services Index
 *
 * Exports all API services and types from a single entry point for simplified imports.
 */

// Config exports
export { ApiError, ApiErrorType } from './config';

// API Client exports
export { 
  get, post, put, patch, del, 
  apiClient,
  createApiUrl,
  extractCorrelationId
} from './apiClient';
export type { ApiRequestConfig, ApiResponse } from './apiClient';

// Session API exports
export { SessionApi } from './sessionApi';
export type { UUIDResponse } from './sessionApi';

// File API exports
export { FileApi } from './fileApi';
export type { FileUploadResponse, FileDeleteResponse, ProgressCallback } from './fileApi';

// Chat API exports
export { ChatApi } from './chatApi';
export type { Message, ChatResponse } from './chatApi';
