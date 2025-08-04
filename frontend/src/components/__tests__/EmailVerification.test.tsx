/**
 * Email Verification Integration Tests
 *
 * Tests for the email verification components and their integration with the chat interface.
 */

// Mock the email verification API BEFORE importing components
const mockVerifyEmail = jest.fn();
const mockVerifyCode = jest.fn();
const mockResendCode = jest.fn();

jest.mock('../../api/emailVerificationApi', () => ({
  emailVerificationApi: {
    verifyEmail: mockVerifyEmail,
    verifyCode: mockVerifyCode,
    resendCode: mockResendCode,
  },
}));

// Mock the session context
const mockSessionContext = {
  state: {
    sessionUUID: 'test-session-uuid',
  },
  resetSession: jest.fn(),
};

jest.mock('../../contexts/SessionContext', () => ({
  ...jest.requireActual('../../contexts/SessionContext'),
  useSession: () => mockSessionContext,
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import { ChatProvider } from '../../contexts/ChatContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { EmailInput } from '../EmailInput';
import { CodeVerification } from '../CodeVerification';

describe('Email Verification Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyEmail.mockResolvedValue({ status: 'success', nextTransition: 'CODE_INPUT' });
    mockVerifyCode.mockResolvedValue({ status: 'success', nextTransition: 'EMAIL_VERIFIED' });
    mockResendCode.mockResolvedValue({ status: 'success', nextTransition: 'CODE_INPUT' });
  });

  describe('EmailInput Component', () => {
    const mockOnEmailSent = jest.fn();
    const mockOnError = jest.fn();

    beforeEach(() => {
      mockOnEmailSent.mockClear();
      mockOnError.mockClear();
    });

    it('renders email input field and submit button', () => {
      render(
        <SessionProvider>
          <EmailInput onEmailSent={mockOnEmailSent} onError={mockOnError} />
        </SessionProvider>
      );

      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send verification code' })).toBeInTheDocument();
    });

    it('validates email format', async () => {
      render(
        <SessionProvider>
          <EmailInput onEmailSent={mockOnEmailSent} onError={mockOnError} />
        </SessionProvider>
      );

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: 'Send verification code' });

      // Test valid email
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockVerifyEmail).toHaveBeenCalledWith('test-session-uuid', {
          email: 'test@example.com',
        });
        expect(mockOnEmailSent).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('shows validation error for invalid email', () => {
      render(
        <SessionProvider>
          <EmailInput onEmailSent={mockOnEmailSent} onError={mockOnError} />
        </SessionProvider>
      );

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  describe('CodeVerification Component', () => {
    const mockOnCodeVerified = jest.fn();
    const mockOnError = jest.fn();
    const mockOnResendCode = jest.fn();

    beforeEach(() => {
      mockOnCodeVerified.mockClear();
      mockOnError.mockClear();
      mockOnResendCode.mockClear();
    });

    it('renders code input field and verify button', () => {
      render(
        <SessionProvider>
          <CodeVerification
            onCodeVerified={mockOnCodeVerified}
            onError={mockOnError}
            onResendCode={mockOnResendCode}
          />
        </SessionProvider>
      );

      expect(screen.getByPlaceholderText('Enter 6-digit code')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Verify code' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Resend verification code' })).toBeInTheDocument();
    });

    it('validates code format', async () => {
      render(
        <SessionProvider>
          <CodeVerification
            onCodeVerified={mockOnCodeVerified}
            onError={mockOnError}
            onResendCode={mockOnResendCode}
          />
        </SessionProvider>
      );

      const codeInput = screen.getByPlaceholderText('Enter 6-digit code');
      const verifyButton = screen.getByRole('button', { name: 'Verify code' });

      // Test valid code
      fireEvent.change(codeInput, { target: { value: '123456' } });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(mockVerifyCode).toHaveBeenCalledWith('test-session-uuid', { code: '123456' });
        expect(mockOnCodeVerified).toHaveBeenCalled();
      });
    });

    it('disables submit button for invalid code', () => {
      render(
        <SessionProvider>
          <CodeVerification
            onCodeVerified={mockOnCodeVerified}
            onError={mockOnError}
            onResendCode={mockOnResendCode}
          />
        </SessionProvider>
      );

      const codeInput = screen.getByPlaceholderText('Enter 6-digit code');
      fireEvent.change(codeInput, { target: { value: '123' } });

      // The button should be disabled for invalid code (less than 6 digits)
      const verifyButton = screen.getByRole('button', { name: 'Verify code' });
      expect(verifyButton).toBeDisabled();
    });

    it('renders resend code button', () => {
      render(
        <SessionProvider>
          <CodeVerification
            onCodeVerified={mockOnCodeVerified}
            onError={mockOnError}
            onResendCode={mockOnResendCode}
          />
        </SessionProvider>
      );

      const resendButton = screen.getByRole('button', { name: 'Resend verification code' });
      expect(resendButton).toBeInTheDocument();
    });
  });
});
