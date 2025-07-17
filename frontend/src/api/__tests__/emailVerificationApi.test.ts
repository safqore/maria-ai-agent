/**
 * Tests for emailVerificationApi
 */

import { emailVerificationApi } from '../emailVerificationApi';
import { apiClient } from '../apiClient';

// Mock the apiClient
jest.mock('../apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('emailVerificationApi', () => {
  const mockSessionId = 'test-session-id';
  const mockEmail = 'test@example.com';
  const mockCode = '123456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyEmail', () => {
    it('should successfully send verification email', async () => {
      const mockResponse = {
        status: 'success',
        message: 'Verification code sent successfully',
        nextTransition: 'CODE_INPUT'
      };

      mockedApiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await emailVerificationApi.verifyEmail(mockSessionId, { email: mockEmail });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/api/v1/email-verification/verify-email',
        { email: mockEmail },
        {
          headers: {
            'X-Session-ID': mockSessionId
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const mockError = {
        response: {
          data: {
            status: 'error',
            error: 'Invalid email format',
            nextTransition: 'EMAIL_INPUT'
          }
        }
      };

      mockedApiClient.post.mockRejectedValueOnce(mockError);

      await expect(emailVerificationApi.verifyEmail(mockSessionId, { email: mockEmail }))
        .rejects.toEqual(mockError.response.data);
    });

    it('should handle network errors', async () => {
      mockedApiClient.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(emailVerificationApi.verifyEmail(mockSessionId, { email: mockEmail }))
        .rejects.toEqual({
          status: 'error',
          error: 'Failed to send verification code',
          nextTransition: 'EMAIL_INPUT'
        });
    });
  });

  describe('verifyCode', () => {
    it('should successfully verify code', async () => {
      const mockResponse = {
        status: 'success',
        message: 'Email verified successfully',
        nextTransition: 'CHAT_READY'
      };

      mockedApiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await emailVerificationApi.verifyCode(mockSessionId, { code: mockCode });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/api/v1/email-verification/verify-code',
        { code: mockCode },
        {
          headers: {
            'X-Session-ID': mockSessionId
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const mockError = {
        response: {
          data: {
            status: 'error',
            error: 'Invalid verification code',
            nextTransition: 'CODE_INPUT'
          }
        }
      };

      mockedApiClient.post.mockRejectedValueOnce(mockError);

      await expect(emailVerificationApi.verifyCode(mockSessionId, { code: mockCode }))
        .rejects.toEqual(mockError.response.data);
    });

    it('should handle network errors', async () => {
      mockedApiClient.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(emailVerificationApi.verifyCode(mockSessionId, { code: mockCode }))
        .rejects.toEqual({
          status: 'error',
          error: 'Failed to verify code',
          nextTransition: 'CODE_INPUT'
        });
    });
  });

  describe('resendCode', () => {
    it('should successfully resend verification code', async () => {
      const mockResponse = {
        status: 'success',
        message: 'Verification code resent successfully',
        nextTransition: 'CODE_INPUT'
      };

      mockedApiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await emailVerificationApi.resendCode(mockSessionId);

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/api/v1/email-verification/resend-code',
        {},
        {
          headers: {
            'X-Session-ID': mockSessionId
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const mockError = {
        response: {
          data: {
            status: 'error',
            error: 'Please wait before requesting another code',
            nextTransition: 'CODE_INPUT'
          }
        }
      };

      mockedApiClient.post.mockRejectedValueOnce(mockError);

      await expect(emailVerificationApi.resendCode(mockSessionId))
        .rejects.toEqual(mockError.response.data);
    });

    it('should handle network errors', async () => {
      mockedApiClient.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(emailVerificationApi.resendCode(mockSessionId))
        .rejects.toEqual({
          status: 'error',
          error: 'Failed to resend verification code',
          nextTransition: 'CODE_INPUT'
        });
    });
  });
}); 