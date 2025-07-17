/**
 * Email Verification Hook
 * 
 * Provides email verification functionality with SessionContext integration,
 * including sending verification codes, verifying codes, and resending codes.
 */

import { useCallback, useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import { emailVerificationApi, EmailVerificationResponse } from '../api/emailVerificationApi';

export interface EmailVerificationState {
  isLoading: boolean;
  error: string | null;
  message: string | null;
  nextTransition: string | null;
  canResend: boolean;
  resendCooldown: number;
}

export interface EmailVerificationActions {
  verifyEmail: (email: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  resendCode: () => Promise<void>;
  clearError: () => void;
  clearMessage: () => void;
}

export const useEmailVerification = (): EmailVerificationState & EmailVerificationActions => {
  const { sessionId, resetSession } = useSession();
  const [state, setState] = useState<EmailVerificationState>({
    isLoading: false,
    error: null,
    message: null,
    nextTransition: null,
    canResend: true,
    resendCooldown: 0
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearMessage = useCallback(() => {
    setState(prev => ({ ...prev, message: null }));
  }, []);

  const handleResponse = useCallback((response: EmailVerificationResponse) => {
    setState(prev => ({
      ...prev,
      error: response.error || null,
      message: response.message || null,
      nextTransition: response.nextTransition || null
    }));

    // Handle session reset if needed
    if (response.nextTransition === 'SESSION_RESET') {
      resetSession(true);
    }
  }, [resetSession]);

  const verifyEmail = useCallback(async (email: string) => {
    if (!sessionId) {
      setState(prev => ({ 
        ...prev, 
        error: 'No active session found',
        nextTransition: 'SESSION_ERROR'
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, message: null }));

    try {
      const response = await emailVerificationApi.verifyEmail(sessionId, { email });
      handleResponse(response);
    } catch (error: any) {
      handleResponse(error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [sessionId, handleResponse]);

  const verifyCode = useCallback(async (code: string) => {
    if (!sessionId) {
      setState(prev => ({ 
        ...prev, 
        error: 'No active session found',
        nextTransition: 'SESSION_ERROR'
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, message: null }));

    try {
      const response = await emailVerificationApi.verifyCode(sessionId, { code });
      handleResponse(response);
    } catch (error: any) {
      handleResponse(error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [sessionId, handleResponse]);

  const resendCode = useCallback(async () => {
    if (!sessionId) {
      setState(prev => ({ 
        ...prev, 
        error: 'No active session found',
        nextTransition: 'SESSION_ERROR'
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, message: null, canResend: false }));

    try {
      const response = await emailVerificationApi.resendCode(sessionId);
      handleResponse(response);
      
      // Start cooldown timer
      setState(prev => ({ ...prev, resendCooldown: 30 }));
      const cooldownInterval = setInterval(() => {
        setState(prev => {
          const newCooldown = Math.max(0, prev.resendCooldown - 1);
          return {
            ...prev,
            resendCooldown: newCooldown,
            canResend: newCooldown === 0
          };
        });
      }, 1000);

      // Clear interval after 30 seconds
      setTimeout(() => {
        clearInterval(cooldownInterval);
      }, 30000);

    } catch (error: any) {
      handleResponse(error);
      setState(prev => ({ ...prev, canResend: true }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [sessionId, handleResponse]);

  return {
    ...state,
    verifyEmail,
    verifyCode,
    resendCode,
    clearError,
    clearMessage
  };
}; 