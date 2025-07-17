/**
 * Tests for emailVerificationApi
 */

import { emailVerificationApi } from '../emailVerificationApi';
import { post } from '../apiClient';

// Mock the apiClient module
jest.mock('../apiClient', () => ({
  post: jest.fn()
}));

const mockedPost = post as jest.MockedFunction<typeof post>;

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
        data: {
          status: 'success',
          message: 'Verification code sent successfully',
          nextTransition: 'CODE_INPUT'
        }
      };

      mockedPost.mockResolvedValueOnce(mockResponse);

      const result = await emailVerificationApi.verifyEmail(mockSessionId, { email: mockEmail });

      expect(mockedPost).toHaveBeenCalledWith('/email-verification/verify-email', { email: mockEmail }, {
        headers: {
          'X-Session-ID': mockSessionId
        }
      });
      expect(result).toEqual(mockResponse.data);
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

      mockedPost.mockRejectedValueOnce(mockError);

      await expect(emailVerificationApi.verifyEmail(mockSessionId, { email: mockEmail }))
        .rejects.toEqual(mockError.response.data);
    });

    it('should handle network errors', async () => {
      mockedPost.mockRejectedValueOnce(new Error('Network error'));

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
        data: {
          status: 'success',
          message: 'Email verified successfully',
          nextTransition: 'CHAT_READY'
        }
      };

      mockedPost.mockResolvedValueOnce(mockResponse);

      const result = await emailVerificationApi.verifyCode(mockSessionId, { code: mockCode });

      expect(mockedPost).toHaveBeenCalledWith('/email-verification/verify-code', { code: mockCode }, {
        headers: {
          'X-Session-ID': mockSessionId
        }
      });
      expect(result).toEqual(mockResponse.data);
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

      mockedPost.mockRejectedValueOnce(mockError);

      await expect(emailVerificationApi.verifyCode(mockSessionId, { code: mockCode }))
        .rejects.toEqual(mockError.response.data);
    });

    it('should handle network errors', async () => {
      mockedPost.mockRejectedValueOnce(new Error('Network error'));

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
        data: {
          status: 'success',
          message: 'Verification code resent successfully',
          nextTransition: 'CODE_INPUT'
        }
      };

      mockedPost.mockResolvedValueOnce(mockResponse);

      const result = await emailVerificationApi.resendCode(mockSessionId);

      expect(mockedPost).toHaveBeenCalledWith('/email-verification/resend-code', {}, {
        headers: {
          'X-Session-ID': mockSessionId
        }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const mockError = {
        response: {
          data: {
            status: 'error',
            error: 'Too many attempts',
            nextTransition: 'CODE_INPUT'
          }
        }
      };

      mockedPost.mockRejectedValueOnce(mockError);

      await expect(emailVerificationApi.resendCode(mockSessionId))
        .rejects.toEqual(mockError.response.data);
    });

    it('should handle network errors', async () => {
      mockedPost.mockRejectedValueOnce(new Error('Network error'));

      await expect(emailVerificationApi.resendCode(mockSessionId))
        .rejects.toEqual({
          status: 'error',
          error: 'Failed to resend verification code',
          nextTransition: 'CODE_INPUT'
        });
    });
  });
}); 