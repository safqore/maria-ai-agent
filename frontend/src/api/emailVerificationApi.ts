/**
 * Email Verification API client
 *
 * Provides methods for interacting with the email verification endpoints
 * including sending verification codes, verifying codes, and resending codes.
 */

import { post } from './apiClient';

export interface EmailVerificationResponse {
  status: 'success' | 'error';
  message?: string;
  error?: string;
  nextTransition: string;
}

export interface VerifyEmailRequest {
  email: string;
  [key: string]: unknown;
}

export interface VerifyCodeRequest {
  code: string;
  [key: string]: unknown;
}

export const emailVerificationApi = {
  /**
   * Send verification code to the provided email address
   */
  verifyEmail: async (
    sessionId: string,
    data: VerifyEmailRequest
  ): Promise<EmailVerificationResponse> => {
    try {
      const response = await post<EmailVerificationResponse>(
        '/email-verification/verify-email',
        data,
        {
          headers: {
            'X-Session-ID': sessionId,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      // Handle and re-throw with consistent error format
      if (error.response?.data) {
        throw error.response.data;
      }
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
  verifyCode: async (
    sessionId: string,
    data: VerifyCodeRequest
  ): Promise<EmailVerificationResponse> => {
    try {
      const response = await post<EmailVerificationResponse>(
        '/email-verification/verify-code',
        data,
        {
          headers: {
            'X-Session-ID': sessionId,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      // Handle and re-throw with consistent error format
      if (error.response?.data) {
        throw error.response.data;
      }
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
  resendCode: async (sessionId: string): Promise<EmailVerificationResponse> => {
    try {
      const response = await post<EmailVerificationResponse>(
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
      // Handle and re-throw with consistent error format
      if (error.response?.data) {
        throw error.response.data;
      }
      throw {
        status: 'error',
        error: 'Failed to resend verification code',
        nextTransition: 'CODE_INPUT',
      };
    }
  },
};
