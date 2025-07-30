/**
 * Email Verification API client
 *
 * Provides methods for interacting with the email verification endpoints
 * including sending verification codes, verifying codes, and resending codes.
 */

import { post } from './apiClient';

// Replace 'any' types with more specific types
export type ApiResponse = {
  status: string;
  message?: string;
  error?: string;
  data?: Record<string, unknown>;
  nextTransition?: string;
};

type VerifyEmailRequest = {
  email: string;
};

type VerifyCodeRequest = {
  code: string;
};

export const emailVerificationApi = {
  /**
   * Send verification code to the provided email address
   */
  verifyEmail: async (sessionId: string, data: VerifyEmailRequest): Promise<ApiResponse> => {
    try {
      const response = await post<ApiResponse>('/email-verification/verify-email', data, {
        headers: {
          'X-Session-ID': sessionId,
        },
      });
      return response.data;
    } catch (error: any) {
      // Preserve original error message from API if available
      if (error.response?.data) {
        throw {
          status: 'error',
          error: error.response.data.error || 'Failed to send verification code',
          nextTransition: 'EMAIL_INPUT',
        };
      }

      // Fallback to generic error message for network errors
      throw {
        status: 'error',
        error: 'Failed to send verification code',
        nextTransition: 'EMAIL_INPUT',
      };
    }
  },

  /**
   * Verify the provided verification code
   */
  verifyCode: async (sessionId: string, data: VerifyCodeRequest): Promise<ApiResponse> => {
    try {
      const response = await post<ApiResponse>('/email-verification/verify-code', data, {
        headers: {
          'X-Session-ID': sessionId,
        },
      });
      return response.data;
    } catch (error: any) {
      // Preserve original error message from API if available
      if (error.response?.data) {
        throw {
          status: 'error',
          error: error.response.data.error || 'Failed to verify code',
          nextTransition: 'CODE_INPUT',
        };
      }

      // Fallback to generic error message for network errors
      throw {
        status: 'error',
        error: 'Failed to verify code',
        nextTransition: 'CODE_INPUT',
      };
    }
  },

  /**
   * Resend verification code for the current session
   */
  resendCode: async (sessionId: string): Promise<ApiResponse> => {
    try {
      const response = await post<ApiResponse>(
        '/email-verification/resend-code',
        {},
        {
          headers: {
            'X-Session-ID': sessionId,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      // Preserve original error message from API if available
      if (error.response?.data) {
        throw {
          status: 'error',
          error: error.response.data.error || 'Failed to resend verification code',
          nextTransition: 'CODE_INPUT',
        };
      }

      // Fallback to generic error message for network errors
      throw {
        status: 'error',
        error: 'Failed to resend verification code',
        nextTransition: 'CODE_INPUT',
      };
    }
  },
};
