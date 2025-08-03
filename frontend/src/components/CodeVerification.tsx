/**
 * Code Verification Component
 *
 * Provides verification code input functionality for the email verification process.
 * Integrates with the chat interface and follows established patterns.
 */

import React, { useState, useCallback, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import { useEmailVerification } from '../hooks/useEmailVerification';

interface CodeVerificationProps {
  /** Callback when code is successfully verified */
  onCodeVerified: () => void;
  /** Callback when code verification fails */
  onError: (error: string) => void;
  /** Callback when resend code is requested */
  onResendCode: () => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Auto-focus the input */
  autoFocus?: boolean;
}

export const CodeVerification: React.FC<CodeVerificationProps> = ({
  onCodeVerified,
  onError,
  onResendCode,
  disabled = false,
  autoFocus = false,
}) => {
  const [code, setCode] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const { verifyCode, resendCode, isLoading, error, clearError } = useEmailVerification();

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateCode = useCallback((codeValue: string): boolean => {
    // 6-digit code validation
    const codeRegex = /^\d{6}$/;
    return codeRegex.test(codeValue);
  }, []);

  const handleCodeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const codeValue = event.target.value.replace(/\D/g, '').slice(0, 6); // Only allow digits, max 6
      setCode(codeValue);

      // Clear previous error when user starts typing
      if (error) {
        clearError();
      }
    },
    [error, clearError]
  );

  const handleSubmit = useCallback(async () => {
    if (!code) {
      onError('Please enter the verification code');
      return;
    }

    if (!validateCode(code)) {
      onError('Please enter a valid 6-digit code');
      return;
    }

    try {
      const response = await verifyCode(code);

      if (response.status === 'success') {
        onCodeVerified();
      } else {
        onError(response.error || 'Failed to verify code');
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'error' in error
          ? String(error.error)
          : error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Failed to verify code';
      onError(errorMessage);
    }
  }, [code, validateCode, verifyCode, onCodeVerified, onError]);

  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0) {
      return;
    }

    try {
      const response = await resendCode();

      if (response.status === 'success') {
        setResendCooldown(30); // 30-second cooldown
        onResendCode();
      } else {
        onError(response.error || 'Failed to resend code');
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'error' in error
          ? String(error.error)
          : error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Failed to resend code';
      onError(errorMessage);
    }
  }, [resendCode, resendCooldown, onResendCode, onError]);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !disabled && !isLoading) {
        handleSubmit();
      }
    },
    [disabled, isLoading, handleSubmit]
  );

  const canResend = resendCooldown === 0 && !isLoading;

  return (
    <div className="code-verification-container">
      <div className="code-input-wrapper">
        <input
          type="text"
          value={code}
          onChange={handleCodeChange}
          onKeyPress={handleKeyPress}
          placeholder="Enter 6-digit code"
          disabled={disabled || isLoading}
          autoFocus={autoFocus}
          className="code-input"
          aria-label="Verification code"
          maxLength={6}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || isLoading || !code || code.length !== 6}
          className="code-submit-button"
          aria-label="Verify code"
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </button>
      </div>

      <div className="code-actions">
        <button
          onClick={handleResendCode}
          disabled={!canResend}
          className="resend-code-button"
          aria-label="Resend verification code"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
        </button>
      </div>

      {error && (
        <div className="code-error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};
