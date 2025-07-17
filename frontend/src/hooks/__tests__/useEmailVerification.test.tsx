/**
 * Tests for useEmailVerification hook
 */

import { renderHook, act } from '@testing-library/react';
import { useEmailVerification } from '../useEmailVerification';
import { useSession } from '../../contexts/SessionContext';
import { emailVerificationApi } from '../../api/emailVerificationApi';

// Mock dependencies
jest.mock('../../contexts/SessionContext');
jest.mock('../../api/emailVerificationApi');

const mockedUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockedEmailVerificationApi = emailVerificationApi as jest.Mocked<typeof emailVerificationApi>;

describe('useEmailVerification', () => {
  const mockSessionId = 'test-session-id';
  const mockEmail = 'test@example.com';
  const mockCode = '123456';
  const mockResetSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockedUseSession.mockReturnValue({
      sessionId: mockSessionId,
      resetSession: mockResetSession,
      // Add other required properties
    } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useEmailVerification());

      expect(result.current).toEqual({
        isLoading: false,
        error: null,
        message: null,
        nextTransition: null,
        canResend: true,
        resendCooldown: 0,
        verifyEmail: expect.any(Function),
        verifyCode: expect.any(Function),
        resendCode: expect.any(Function),
        clearError: expect.any(Function),
        clearMessage: expect.any(Function)
      });
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email', async () => {
      const mockResponse = {
        status: 'success',
        message: 'Verification code sent successfully',
        nextTransition: 'CODE_INPUT'
      };

      mockedEmailVerificationApi.verifyEmail.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        await result.current.verifyEmail(mockEmail);
      });

      expect(mockedEmailVerificationApi.verifyEmail).toHaveBeenCalledWith(mockSessionId, { email: mockEmail });
      expect(result.current.message).toBe('Verification code sent successfully');
      expect(result.current.nextTransition).toBe('CODE_INPUT');
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle verification errors', async () => {
      const mockError = {
        status: 'error',
        error: 'Invalid email format',
        nextTransition: 'EMAIL_INPUT'
      };

      mockedEmailVerificationApi.verifyEmail.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        await result.current.verifyEmail(mockEmail);
      });

      expect(result.current.error).toBe('Invalid email format');
      expect(result.current.nextTransition).toBe('EMAIL_INPUT');
      expect(result.current.message).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle session reset transition', async () => {
      const mockResponse = {
        status: 'error',
        error: 'Maximum attempts reached',
        nextTransition: 'SESSION_RESET'
      };

      mockedEmailVerificationApi.verifyEmail.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        await result.current.verifyEmail(mockEmail);
      });

      expect(mockResetSession).toHaveBeenCalledWith(true);
    });

    it('should handle missing session ID', async () => {
      mockedUseSession.mockReturnValue({
        sessionId: null,
        resetSession: mockResetSession,
      } as any);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        await result.current.verifyEmail(mockEmail);
      });

      expect(result.current.error).toBe('No active session found');
      expect(result.current.nextTransition).toBe('SESSION_ERROR');
    });
  });

  describe('verifyCode', () => {
    it('should successfully verify code', async () => {
      const mockResponse = {
        status: 'success',
        message: 'Email verified successfully',
        nextTransition: 'CHAT_READY'
      };

      mockedEmailVerificationApi.verifyCode.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        await result.current.verifyCode(mockCode);
      });

      expect(mockedEmailVerificationApi.verifyCode).toHaveBeenCalledWith(mockSessionId, { code: mockCode });
      expect(result.current.message).toBe('Email verified successfully');
      expect(result.current.nextTransition).toBe('CHAT_READY');
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle verification errors', async () => {
      const mockError = {
        status: 'error',
        error: 'Invalid verification code',
        nextTransition: 'CODE_INPUT'
      };

      mockedEmailVerificationApi.verifyCode.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        await result.current.verifyCode(mockCode);
      });

      expect(result.current.error).toBe('Invalid verification code');
      expect(result.current.nextTransition).toBe('CODE_INPUT');
      expect(result.current.message).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('resendCode', () => {
    it('should successfully resend code', async () => {
      const mockResponse = {
        status: 'success',
        message: 'Verification code resent successfully',
        nextTransition: 'CODE_INPUT'
      };

      mockedEmailVerificationApi.resendCode.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        await result.current.resendCode();
      });

      expect(mockedEmailVerificationApi.resendCode).toHaveBeenCalledWith(mockSessionId);
      expect(result.current.message).toBe('Verification code resent successfully');
      expect(result.current.nextTransition).toBe('CODE_INPUT');
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.canResend).toBe(false);
      expect(result.current.resendCooldown).toBe(30);
    });

    it('should handle resend errors', async () => {
      const mockError = {
        status: 'error',
        error: 'Please wait before requesting another code',
        nextTransition: 'CODE_INPUT'
      };

      mockedEmailVerificationApi.resendCode.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        await result.current.resendCode();
      });

      expect(result.current.error).toBe('Please wait before requesting another code');
      expect(result.current.nextTransition).toBe('CODE_INPUT');
      expect(result.current.message).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.canResend).toBe(true);
    });

    it('should handle cooldown timer', async () => {
      const mockResponse = {
        status: 'success',
        message: 'Verification code resent successfully',
        nextTransition: 'CODE_INPUT'
      };

      mockedEmailVerificationApi.resendCode.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        await result.current.resendCode();
      });

      expect(result.current.resendCooldown).toBe(30);
      expect(result.current.canResend).toBe(false);

      // Advance timer by 15 seconds
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      expect(result.current.resendCooldown).toBe(15);
      expect(result.current.canResend).toBe(false);

      // Advance timer to complete cooldown
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      expect(result.current.resendCooldown).toBe(0);
      expect(result.current.canResend).toBe(true);
    });
  });

  describe('clearError and clearMessage', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useEmailVerification());

      // Set error first
      act(() => {
        result.current.verifyEmail(mockEmail);
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear message', () => {
      const { result } = renderHook(() => useEmailVerification());

      // Set message first
      act(() => {
        result.current.verifyEmail(mockEmail);
      });

      act(() => {
        result.current.clearMessage();
      });

      expect(result.current.message).toBeNull();
    });
  });
}); 