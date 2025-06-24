import { FileApi } from '../fileApi';
import { API_BASE_URL } from '../config';

// Mock XMLHttpRequest
class MockXMLHttpRequest {
  open = jest.fn();
  send = jest.fn();
  setRequestHeader = jest.fn();
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
      expect(mockXhr.open).toHaveBeenCalledWith('POST', `${API_BASE_URL}/upload`);
      expect(mockXhr.send).toHaveBeenCalled();

      // Wait for "response"
      const result = await uploadPromise;
      expect(result).toEqual(mockResponse);
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
    it('should make a POST request with the correct payload', async () => {
      // Setup mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          status: 'success',
          message: 'File deleted successfully',
        }),
      });

      // Call the API method
      const response = await FileApi.deleteFile('test.pdf', 'test-uuid');

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: 'test.pdf',
          session_uuid: 'test-uuid',
        }),
      });

      expect(response).toEqual({
        status: 'success',
        message: 'File deleted successfully',
      });
    });

    it('should throw ApiError when response is not ok', async () => {
      // Setup mock fetch response for error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      // Call the API method and expect it to throw
      await expect(FileApi.deleteFile('test.pdf', 'test-uuid')).rejects.toThrow(
        'Failed to delete file: Not Found'
      );
    });
  });
});
