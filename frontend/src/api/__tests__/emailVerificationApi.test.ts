/**
 * Tests for emailVerificationApi
 */

import { emailVerificationApi } from '../emailVerificationApi';
import { post } from '../apiClient';

// Mock the apiClient module
jest.mock('../apiClient', () => ({
  post: jest.fn(),
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
    it('should handle API errors', async () => {
      const mockError = {
        response: {
          data: {
            status: 'error',
            error: 'Invalid email format',
            nextTransition: 'EMAIL_INPUT',
          },
        },
      };
      mockedPost.mockRejectedValueOnce(mockError);

      await expect(
        emailVerificationApi.verifyEmail(mockSessionId, { email: mockEmail })
      ).rejects.toEqual({
        status: 'error',
        error: 'Invalid email format',
        nextTransition: 'EMAIL_INPUT',
      });
    });

    it('should handle network errors', async () => {
      mockedPost.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        emailVerificationApi.verifyEmail(mockSessionId, { email: mockEmail })
      ).rejects.toEqual({
        status: 'error',
        error: 'Failed to send verification code',
        nextTransition: 'EMAIL_INPUT',
      });
    });
  });

  describe('verifyCode', () => {
    it('should handle API errors', async () => {
      const mockError = {
        response: {
          data: {
            status: 'error',
            error: 'Invalid verification code',
            nextTransition: 'CODE_INPUT',
          },
        },
      };
      mockedPost.mockRejectedValueOnce(mockError);

      await expect(
        emailVerificationApi.verifyCode(mockSessionId, { code: mockCode })
      ).rejects.toEqual({
        status: 'error',
        error: 'Invalid verification code',
        nextTransition: 'CODE_INPUT',
      });
    });

    it('should handle network errors', async () => {
      mockedPost.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        emailVerificationApi.verifyCode(mockSessionId, { code: mockCode })
      ).rejects.toEqual({
        status: 'error',
        error: 'Failed to verify code',
        nextTransition: 'CODE_INPUT',
      });
    });
  });

  describe('resendCode', () => {
    it('should handle API errors', async () => {
      const mockError = {
        response: {
          data: {
            status: 'error',
            error: 'Too many attempts',
            nextTransition: 'CODE_INPUT',
          },
        },
      };
      mockedPost.mockRejectedValueOnce(mockError);

      await expect(emailVerificationApi.resendCode(mockSessionId)).rejects.toEqual({
        status: 'error',
        error: 'Too many attempts',
        nextTransition: 'CODE_INPUT',
      });
    });

    it('should handle network errors', async () => {
      mockedPost.mockRejectedValueOnce(new Error('Network error'));

      await expect(emailVerificationApi.resendCode(mockSessionId)).rejects.toEqual({
        status: 'error',
        error: 'Failed to resend verification code',
        nextTransition: 'CODE_INPUT',
      });
    });
  });
});
