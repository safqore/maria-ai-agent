/**
 * File API Service
 *
 * Handles all API calls related to file operations, including:
 * - File uploads
 * - File deletions
 * - Progress tracking
 */
import { API_BASE_URL, ApiError } from './config';

/**
 * File upload response from the backend API
 */
export interface FileUploadResponse {
  status: 'success' | 'error';
  message: string;
  files?: Array<{
    name: string;
    url: string;
    size: number;
  }>;
}

/**
 * File deletion response from the backend API
 */
export interface FileDeleteResponse {
  status: 'success' | 'error';
  message: string;
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
        xhr.open('POST', `${API_BASE_URL}/upload`);

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
      const response = await fetch(`${API_BASE_URL}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          session_uuid: sessionUUID,
        }),
      });

      if (!response.ok) {
        throw new ApiError(`Failed to delete file: ${response.statusText}`, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Failed to delete file: ${(error as Error).message}`);
    }
  },
};
