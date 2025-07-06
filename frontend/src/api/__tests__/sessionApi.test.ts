import { SessionApi, UUIDResponse } from '../sessionApi';
import { ApiResponse } from '../apiClient';

// Mock the API client module
jest.mock('../apiClient', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

// Import the mocked functions
import { post } from '../apiClient';

describe('SessionApi', () => {
  // Mock response data
  const mockUUIDResponse: UUIDResponse = {
    status: 'success',
    uuid: 'test-uuid',
    message: 'UUID generated successfully',
  };

  // Mock API response wrapper
  const mockApiResponse: ApiResponse<UUIDResponse> = {
    data: mockUUIDResponse,
    status: 200,
    headers: new Headers(),
    correlationId: 'test-correlation-id',
    requestTime: 100,
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('generateUUID', () => {
    it('should make a POST request to the correct endpoint', async () => {
      // Setup mock API client response
      (post as jest.Mock).mockResolvedValueOnce(mockApiResponse);

      // Call the API method
      const response = await SessionApi.generateUUID();

      // Assertions
      expect(post).toHaveBeenCalledWith('generate-uuid');
      expect(response).toEqual({
        ...mockUUIDResponse,
        correlationId: 'test-correlation-id',
      });
    });

    it('should throw ApiError when API client throws', async () => {
      // Setup mock API client to throw an error
      const mockError = new Error('Server Error');
      (post as jest.Mock).mockRejectedValueOnce(mockError);

      // Call the API method and expect it to throw
      await expect(SessionApi.generateUUID()).rejects.toThrow(
        'Failed to generate UUID: Server Error'
      );
    });

    it('should throw ApiError when network fails', async () => {
      // Setup mock API client to throw network error
      (post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Call the API method and expect it to throw
      await expect(SessionApi.generateUUID()).rejects.toThrow(
        'Failed to generate UUID: Network error'
      );
    });
  });

  describe('validateUUID', () => {
    it('should make a POST request with the correct payload', async () => {
      // Setup mock API client response
      (post as jest.Mock).mockResolvedValueOnce(mockApiResponse);

      // Call the API method
      const response = await SessionApi.validateUUID('test-uuid');

      // Assertions
      expect(post).toHaveBeenCalledWith('validate-uuid', { uuid: 'test-uuid' });
      expect(response).toEqual({
        ...mockUUIDResponse,
        correlationId: 'test-correlation-id',
      });
    });

    it('should throw ApiError when API client throws', async () => {
      // Setup mock API client to throw an error
      const mockError = new Error('Bad Request');
      (post as jest.Mock).mockRejectedValueOnce(mockError);

      // Call the API method and expect it to throw
      await expect(SessionApi.validateUUID('test-uuid')).rejects.toThrow(
        'Failed to validate UUID: Bad Request'
      );
    });
  });

  describe('persistSession', () => {
    it('should make a POST request with the correct payload', async () => {
      // Setup mock API client response
      (post as jest.Mock).mockResolvedValueOnce(mockApiResponse);

      // Call the API method
      const response = await SessionApi.persistSession('test-uuid', true);

      // Assertions
      expect(post).toHaveBeenCalledWith('persist_session', {
        uuid: 'test-uuid',
        consent_user_data: true,
      });
      expect(response).toEqual({
        ...mockUUIDResponse,
        correlationId: 'test-correlation-id',
      });
    });

    it('should use default consentUserData value when not provided', async () => {
      // Setup mock API client response
      (post as jest.Mock).mockResolvedValueOnce(mockApiResponse);

      // Call the API method without the consentUserData parameter
      await SessionApi.persistSession('test-uuid');

      // Assertions
      expect(post).toHaveBeenCalledWith('persist_session', {
        uuid: 'test-uuid',
        consent_user_data: false, // Default value should be false
      });
    });
  });
});
