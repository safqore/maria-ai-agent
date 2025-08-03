/**
 * Email Verification Hook
 *
 * Provides email verification functionality with SessionContext integration,
 * including sending verification codes, verifying codes, and resending codes.
 */

import { useState, useCallback } from 'react';
import { useSession } from '../contexts/SessionContext';
import { emailVerificationApi, ApiResponse } from '../api/emailVerificationApi';

export interface EmailVerificationState {
  isLoading: boolean;
  error: string | null;
  isEmailSent: boolean;
  isVerified: boolean;
}

export interface EmailVerificationActions {
  verifyEmail: (email: string) => Promise<ApiResponse>;
  verifyCode: (code: string) => Promise<ApiResponse>;
  resendCode: () => Promise<ApiResponse>;
  clearError: () => void;
  reset: () => void;
}

export const useEmailVerification = (): EmailVerificationState & EmailVerificationActions => {
  const {
    state: { sessionUUID },
    resetSession,
  } = useSession();
  const [state, setState] = useState<EmailVerificationState>({
    isLoading: false,
    error: null,
    isEmailSent: false,
    isVerified: false,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      isEmailSent: false,
      isVerified: false,
    });
  }, []);

  const verifyEmail = useCallback(
    async (email: string): Promise<ApiResponse> => {
      if (!sessionUUID) {
        throw new Error('No active session');
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await emailVerificationApi.verifyEmail(sessionUUID, { email });

        if (response.status === 'success') {
          setState(prev => ({
            ...prev,
            isLoading: false,
            isEmailSent: true,
            error: null,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: response.error || 'Failed to send verification code',
          }));
        }

        return response;
      } catch (error: any) {
        const errorMessage = error?.error || error?.message || 'Failed to send verification code';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [sessionUUID]
  );

  const verifyCode = useCallback(
    async (code: string): Promise<ApiResponse> => {
      if (!sessionUUID) {
        throw new Error('No active session');
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await emailVerificationApi.verifyCode(sessionUUID, { code });

        if (response.status === 'success') {
          setState(prev => ({
            ...prev,
            isLoading: false,
            isVerified: true,
            error: null,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: response.error || 'Failed to verify code',
          }));
        }

        return response;
      } catch (error: any) {
        const errorMessage = error?.error || error?.message || 'Failed to verify code';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [sessionUUID]
  );

  const resendCode = useCallback(async (): Promise<ApiResponse> => {
    if (!sessionUUID) {
      throw new Error('No active session');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await emailVerificationApi.resendCode(sessionUUID);

      if (response.status === 'success') {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to resend verification code',
        }));
      }

      return response;
    } catch (error: any) {
      const errorMessage = error?.error || error?.message || 'Failed to resend verification code';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [sessionUUID]);

  return {
    ...state,
    verifyEmail,
    verifyCode,
    resendCode,
    clearError,
    reset,
  };
};
