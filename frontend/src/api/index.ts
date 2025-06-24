/**
 * API Services Index
 *
 * Exports all API services and types from a single entry point for simplified imports.
 */

// Config exports
export { API_BASE_URL, ApiError } from './config';

// Session API exports
export { SessionApi } from './sessionApi';
export type { UUIDResponse } from './sessionApi';

// File API exports
export { FileApi } from './fileApi';
export type { FileUploadResponse, FileDeleteResponse, ProgressCallback } from './fileApi';

// Chat API exports
export { ChatApi } from './chatApi';
export type { Message, ChatResponse } from './chatApi';
