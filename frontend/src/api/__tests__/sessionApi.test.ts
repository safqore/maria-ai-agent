import { SessionApi, UUIDResponse } from '../sessionApi';
import { API_BASE_URL } from '../config';

// Mock the fetch function
global.fetch = jest.fn();

describe('SessionApi', () => {
  // Mock response data
  const mockUUIDResponse: UUIDResponse = {
    status: 'success',
    uuid: 'test-uuid',
    message: 'UUID generated successfully',
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('generateUUID', () => {
    it('should make a POST request to the correct endpoint', async () => {
      // Setup mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockUUIDResponse),
      });

      // Call the API method
      const response = await SessionApi.generateUUID();

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/generate-uuid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response).toEqual(mockUUIDResponse);
    });

    it('should throw ApiError when response is not ok', async () => {
      // Setup mock fetch response for error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      });

      // Call the API method and expect it to throw
      await expect(SessionApi.generateUUID()).rejects.toThrow(
        'Failed to generate UUID: Server Error'
      );
    });

    it('should throw ApiError when fetch fails', async () => {
      // Setup mock fetch to throw an error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Call the API method and expect it to throw
      await expect(SessionApi.generateUUID()).rejects.toThrow(
        'Failed to generate UUID: Network error'
      );
    });
  });

  describe('validateUUID', () => {
    it('should make a POST request with the correct payload', async () => {
      // Setup mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockUUIDResponse),
      });

      // Call the API method
      const response = await SessionApi.validateUUID('test-uuid');

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/validate-uuid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid: 'test-uuid' }),
      });
      expect(response).toEqual(mockUUIDResponse);
    });

    it('should throw ApiError when response is not ok', async () => {
      // Setup mock fetch response for error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      // Call the API method and expect it to throw
      await expect(SessionApi.validateUUID('test-uuid')).rejects.toThrow(
        'Failed to validate UUID: Bad Request'
      );
    });
  });

  describe('persistSession', () => {
    it('should make a POST request with the correct payload', async () => {
      // Setup mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockUUIDResponse),
      });

      // Call the API method
      const response = await SessionApi.persistSession('test-uuid', true);

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/persist-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: 'test-uuid',
          consent_user_data: true,
        }),
      });
      expect(response).toEqual(mockUUIDResponse);
    });

    it('should use default consentUserData value when not provided', async () => {
      // Setup mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockUUIDResponse),
      });

      // Call the API method without the consentUserData parameter
      await SessionApi.persistSession('test-uuid');

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/persist-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: 'test-uuid',
          consent_user_data: false, // Default value should be false
        }),
      });
    });
  });
});
