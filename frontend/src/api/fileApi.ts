/**
 * File API Service
 *
 * Handles all API calls related to file operations, including:
 * - File uploads
 * - File deletions
 * - Progress tracking
 */
import { ApiError } from './config';
import { del, createApiUrl } from './apiClient';

/**
 * File upload response from the backend API
 */
export interface FileUploadResponse {
  // Backend response format
  filename?: string;
  url?: string;
  // Legacy format (for backward compatibility)
  status?: 'success' | 'error';
  message?: string;
  correlationId?: string;
  files?: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  // Error format
  error?: string;
}

/**
 * File deletion response from the backend API
 */
export interface FileDeleteResponse {
  status: 'success' | 'error';
  message: string;
  correlationId?: string;
}

/**
 * Progress callback function type for tracking upload progress
 */
export type ProgressCallback = (percent: number) => void;

/**
 * File API service object containing methods for file-related operations
 */
export const FileApi = {
  /**
   * Upload a file to the backend
   * @param file - The file to upload
   * @param sessionUUID - The session UUID to associate with the upload
   * @param onProgress - Optional callback for tracking upload progress
   * @returns Promise resolving to the file upload response
   */
  uploadFile: async (
    file: File,
    sessionUUID: string,
    onProgress?: ProgressCallback
  ): Promise<FileUploadResponse> => {
    return new Promise((resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('session_uuid', sessionUUID);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', createApiUrl('upload'));
        
        // Add API version header
        xhr.setRequestHeader('Accept', 'application/json; version=v1');
        
        // Set up progress tracking if callback provided
        if (onProgress) {
          xhr.upload.onprogress = e => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.response) as FileUploadResponse;
              
              // Extract correlation ID from response headers
              const correlationId = xhr.getResponseHeader('X-Correlation-ID');
              if (correlationId) {
                response.correlationId = correlationId;
              }
              
              resolve(response);
            } catch (error) {
              reject(new ApiError(`Invalid response format: ${(error as Error).message}`));
            }
          } else {
            reject(new ApiError(`Upload failed with status: ${xhr.status}`, xhr.status));
          }
        };

        xhr.onerror = () => {
          reject(new ApiError('Network error occurred during upload'));
        };

        xhr.ontimeout = () => {
          reject(new ApiError('Upload timeout'));
        };

        xhr.send(formData);
      } catch (error) {
        reject(new ApiError(`Failed to initiate upload: ${(error as Error).message}`));
      }
    });
  },

  /**
   * Delete a file from the backend
   * @param filename - The name of the file to delete
   * @param sessionUUID - The session UUID associated with the file
   * @returns Promise resolving to the file deletion response
   */
  deleteFile: async (filename: string, sessionUUID: string): Promise<FileDeleteResponse> => {
    try {
      const response = await del<FileDeleteResponse>('delete', {
        body: JSON.stringify({
          filename,
          session_uuid: sessionUUID,
        }),
      });
      
      // Add correlation ID to the response
      return {
        ...response.data,
        correlationId: response.correlationId
      };
    } catch (error) {
      throw error instanceof ApiError 
        ? error 
        : new ApiError(`Failed to delete file: ${(error as Error).message}`);
    }
  },
};
