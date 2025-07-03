import { FileApi } from '../fileApi';
import { API_BASE_URL } from '../config';
import { ApiResponse } from '../apiClient';

// Mock the API client module for deleteFile tests
jest.mock('../apiClient', () => ({
  del: jest.fn(),
  createApiUrl: (endpoint: string) => `http://localhost:5000/api/v1/${endpoint}`,
}));

// Import the mocked functions
import { del } from '../apiClient';

// Mock XMLHttpRequest
class MockXMLHttpRequest {
  open = jest.fn();
  send = jest.fn();
  setRequestHeader = jest.fn();
  getResponseHeader = jest.fn(() => 'test-correlation-id');
  upload = {
    onprogress: null as any,
    addEventListener: jest.fn(),
  };
  onload = null as any;
  onerror = null as any;
  status = 200;
  response = '';
}

// Mock fetch
global.fetch = jest.fn();

describe('FileApi', () => {
  let originalXHR: typeof global.XMLHttpRequest;

  beforeEach(() => {
    originalXHR = global.XMLHttpRequest;
    // Cast through unknown to avoid TypeScript errors when mocking
    global.XMLHttpRequest = jest.fn(
      () => new MockXMLHttpRequest()
    ) as unknown as typeof XMLHttpRequest;
    jest.resetAllMocks();
  });

  afterEach(() => {
    global.XMLHttpRequest = originalXHR;
  });

  describe('uploadFile', () => {
    it('should create FormData with file and session UUID', async () => {
      // Arrange
      const file = new File(['file content'], 'test.pdf', { type: 'application/pdf' });
      const sessionUUID = 'test-uuid';
      const mockXhr = new MockXMLHttpRequest();
      (global.XMLHttpRequest as unknown as jest.Mock).mockReturnValue(mockXhr);

      // Setup mock response
      const mockResponse = {
        status: 'success',
        message: 'File uploaded successfully',
        files: [{ name: 'test.pdf', url: 'https://s3.com/test.pdf', size: 123 }],
      };

      // Simulate successful response
      mockXhr.send = jest.fn().mockImplementation(function (this: any) {
        setTimeout(() => {
          this.status = 200;
          this.response = JSON.stringify(mockResponse);
          if (this.onload) this.onload();
        }, 0);
      });

      // Act
      const uploadPromise = FileApi.uploadFile(file, sessionUUID);

      // Assert FormData creation
      expect(mockXhr.open).toHaveBeenCalledWith('POST', `${API_BASE_URL}/api/v1/upload`);
      expect(mockXhr.send).toHaveBeenCalled();

      // Wait for "response"
      const result = await uploadPromise;
      expect(result).toEqual({
        ...mockResponse,
        correlationId: 'test-correlation-id'
      });
    });

    it('should call progress callback when provided', async () => {
      // Arrange
      const file = new File(['file content'], 'test.pdf', { type: 'application/pdf' });
      const sessionUUID = 'test-uuid';
      const progressCallback = jest.fn();
      const mockXhr = new MockXMLHttpRequest();
      (global.XMLHttpRequest as unknown as jest.Mock).mockReturnValue(mockXhr);

      // Setup mock response
      mockXhr.send = jest.fn().mockImplementation(function (this: any) {
        // Simulate progress event
        if (this.upload.onprogress) {
          this.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
        }

        // Simulate successful completion
        setTimeout(() => {
          this.status = 200;
          this.response = JSON.stringify({ status: 'success' });
          if (this.onload) this.onload();
        }, 0);
      });

      // Act
      const uploadPromise = FileApi.uploadFile(file, sessionUUID, progressCallback);

      // Wait for "response"
      await uploadPromise;

      // Assert progress callback was called
      expect(progressCallback).toHaveBeenCalledWith(50);
    });

    it('should reject with ApiError when upload fails', async () => {
      // Arrange
      const file = new File(['file content'], 'test.pdf', { type: 'application/pdf' });
      const sessionUUID = 'test-uuid';
      const mockXhr = new MockXMLHttpRequest();
      (global.XMLHttpRequest as unknown as jest.Mock).mockReturnValue(mockXhr);

      // Setup mock error response
      mockXhr.send = jest.fn().mockImplementation(function (this: any) {
        setTimeout(() => {
          this.status = 400;
          if (this.onload) this.onload();
        }, 0);
      });

      // Act & Assert
      await expect(FileApi.uploadFile(file, sessionUUID)).rejects.toThrow(
        'Upload failed with status: 400'
      );
    });

    it('should reject with ApiError when network error occurs', async () => {
      // Arrange
      const file = new File(['file content'], 'test.pdf', { type: 'application/pdf' });
      const sessionUUID = 'test-uuid';
      const mockXhr = new MockXMLHttpRequest();
      (global.XMLHttpRequest as unknown as jest.Mock).mockReturnValue(mockXhr);

      // Setup mock network error
      mockXhr.send = jest.fn().mockImplementation(function (this: any) {
        setTimeout(() => {
          if (this.onerror) this.onerror();
        }, 0);
      });

      // Act & Assert
      await expect(FileApi.uploadFile(file, sessionUUID)).rejects.toThrow(
        'Network error occurred during upload'
      );
    });
  });

  describe('deleteFile', () => {
    it('should make a DELETE request with the correct payload', async () => {
      // Mock response data
      const mockDeleteResponse = {
        status: 'success' as const,
        message: 'File deleted successfully',
      };

      // Mock API response wrapper
      const mockApiResponse: ApiResponse<typeof mockDeleteResponse> = {
        data: mockDeleteResponse,
        status: 200,
        headers: new Headers(),
        correlationId: 'test-correlation-id',
        requestTime: 100,
      };

      // Setup mock API client response
      (del as jest.Mock).mockResolvedValueOnce(mockApiResponse);

      // Call the API method
      const response = await FileApi.deleteFile('test.pdf', 'test-uuid');

      // Assertions
      expect(del).toHaveBeenCalledWith('delete', {
        body: JSON.stringify({
          filename: 'test.pdf',
          session_uuid: 'test-uuid',
        }),
      });

      expect(response).toEqual({
        ...mockDeleteResponse,
        correlationId: 'test-correlation-id',
      });
    });

    it('should throw ApiError when API client throws', async () => {
      // Setup mock API client to throw an error
      const mockError = new Error('Not Found');
      (del as jest.Mock).mockRejectedValueOnce(mockError);

      // Call the API method and expect it to throw
      await expect(FileApi.deleteFile('test.pdf', 'test-uuid')).rejects.toThrow(
        'Failed to delete file: Not Found'
      );
    });
  });
});
