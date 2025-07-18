/**
 * Email Input Component
 * 
 * Provides email input functionality for the email verification process.
 * Integrates with the chat interface and follows established patterns.
 */

import React, { useState, useCallback, ChangeEvent, KeyboardEvent } from 'react';
import { useEmailVerification } from '../hooks/useEmailVerification';

interface EmailInputProps {
  /** Callback when email is successfully sent */
  onEmailSent: (email: string) => void;
  /** Callback when email verification fails */
  onError: (error: string) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Auto-focus the input */
  autoFocus?: boolean;
}

export const EmailInput: React.FC<EmailInputProps> = ({
  onEmailSent,
  onError,
  disabled = false,
  autoFocus = false,
}) => {
  const [email, setEmail] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const { verifyEmail, isLoading, error, clearError } = useEmailVerification();

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = useCallback((emailValue: string): boolean => {
    return emailRegex.test(emailValue.trim());
  }, []);

  const handleEmailChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const emailValue = event.target.value;
    setEmail(emailValue);
    
    // Clear previous error when user starts typing
    if (error) {
      clearError();
    }
    
    // Validate email format
    setIsValid(emailValue === '' || validateEmail(emailValue));
  }, [error, clearError, validateEmail]);

  const handleSubmit = useCallback(async () => {
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      setIsValid(false);
      onError('Please enter your email address');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setIsValid(false);
      onError('Please enter a valid email address');
      return;
    }

    try {
      const response = await verifyEmail(trimmedEmail);
      
      if (response.status === 'success') {
        onEmailSent(trimmedEmail);
      } else {
        onError(response.error || 'Failed to send verification code');
      }
    } catch (error: any) {
      const errorMessage = error?.error || error?.message || 'Failed to send verification code';
      onError(errorMessage);
    }
  }, [email, validateEmail, verifyEmail, onEmailSent, onError]);

  const handleKeyPress = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !disabled && !isLoading) {
      handleSubmit();
    }
  }, [disabled, isLoading, handleSubmit]);

  return (
    <div className="email-input-container">
      <div className="email-input-wrapper">
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          onKeyPress={handleKeyPress}
          placeholder="Enter your email address"
          disabled={disabled || isLoading}
          autoFocus={autoFocus}
          className={`email-input ${!isValid ? 'email-input-error' : ''}`}
          aria-label="Email address"
          aria-describedby={!isValid ? 'email-error' : undefined}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || isLoading || !email.trim() || !isValid}
          className="email-submit-button"
          aria-label="Send verification code"
        >
          {isLoading ? 'Sending...' : 'Send Code'}
        </button>
      </div>
      {!isValid && email && (
        <div id="email-error" className="email-error-message" role="alert">
          Please enter a valid email address
        </div>
      )}
      {error && (
        <div className="email-error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}; 