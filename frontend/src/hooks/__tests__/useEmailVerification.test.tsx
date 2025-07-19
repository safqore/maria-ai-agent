/**
 * Tests for useEmailVerification hook
 */

import { renderHook, act } from '@testing-library/react';
import { useEmailVerification } from '../useEmailVerification';
import { useSession } from '../../contexts/SessionContext';
import { emailVerificationApi, EmailVerificationResponse } from '../../api/emailVerificationApi';

// Mock dependencies
jest.mock('../../contexts/SessionContext');
jest.mock('../../api/emailVerificationApi');

const mockedUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockedEmailVerificationApi = emailVerificationApi as jest.Mocked<typeof emailVerificationApi>;

describe('useEmailVerification', () => {
  const mockSessionUUID = 'test-session-uuid';
  const mockEmail = 'test@example.com';
  const mockCode = '123456';
  const mockResetSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockedUseSession.mockReturnValue({
      state: {
        sessionUUID: mockSessionUUID,
        isLoading: false,
        error: null,
        isResetModalVisible: false,
        isInitialized: true,
      },
      resetSession: mockResetSession,
      initializeSession: jest.fn(),
      clearError: jest.fn(),
      showResetModal: jest.fn(),
      hideResetModal: jest.fn(),
      confirmResetSession: jest.fn(),
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
        isEmailSent: false,
        isVerified: false,
        verifyEmail: expect.any(Function),
        verifyCode: expect.any(Function),
        resendCode: expect.any(Function),
        clearError: expect.any(Function),
        reset: expect.any(Function),
      });
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email', async () => {
      const mockResponse: EmailVerificationResponse = {
        status: 'success',
        message: 'Verification code sent successfully',
        nextTransition: 'CODE_INPUT',
      };

      mockedEmailVerificationApi.verifyEmail.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        const response = await result.current.verifyEmail(mockEmail);
        expect(response).toEqual(mockResponse);
      });

      expect(mockedEmailVerificationApi.verifyEmail).toHaveBeenCalledWith(mockSessionUUID, {
        email: mockEmail,
      });
      expect(result.current.isEmailSent).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle verification errors', async () => {
      const mockError: EmailVerificationResponse = {
        status: 'error',
        error: 'Invalid email format',
        nextTransition: 'EMAIL_INPUT',
      };

      mockedEmailVerificationApi.verifyEmail.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        try {
          await result.current.verifyEmail(mockEmail);
        } catch (error: any) {
          expect(error).toEqual(mockError);
        }
      });

      expect(result.current.error).toBe('Invalid email format');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle missing session ID', async () => {
      mockedUseSession.mockReturnValue({
        state: {
          sessionUUID: null,
          isLoading: false,
          error: null,
          isResetModalVisible: false,
          isInitialized: true,
        },
        resetSession: mockResetSession,
        initializeSession: jest.fn(),
        clearError: jest.fn(),
        showResetModal: jest.fn(),
        hideResetModal: jest.fn(),
        confirmResetSession: jest.fn(),
      } as any);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        try {
          await result.current.verifyEmail(mockEmail);
        } catch (error: any) {
          expect(error.message).toBe('No active session');
        }
      });
    });
  });

  describe('verifyCode', () => {
    it('should successfully verify code', async () => {
      const mockResponse: EmailVerificationResponse = {
        status: 'success',
        message: 'Email verified successfully',
        nextTransition: 'CHAT_READY',
      };

      mockedEmailVerificationApi.verifyCode.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        const response = await result.current.verifyCode(mockCode);
        expect(response).toEqual(mockResponse);
      });

      expect(mockedEmailVerificationApi.verifyCode).toHaveBeenCalledWith(mockSessionUUID, {
        code: mockCode,
      });
      expect(result.current.isVerified).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle verification errors', async () => {
      const mockError: EmailVerificationResponse = {
        status: 'error',
        error: 'Invalid verification code',
        nextTransition: 'CODE_INPUT',
      };

      mockedEmailVerificationApi.verifyCode.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        try {
          await result.current.verifyCode(mockCode);
        } catch (error: any) {
          expect(error).toEqual(mockError);
        }
      });

      expect(result.current.error).toBe('Invalid verification code');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('resendCode', () => {
    it('should successfully resend code', async () => {
      const mockResponse: EmailVerificationResponse = {
        status: 'success',
        message: 'Verification code resent successfully',
        nextTransition: 'CODE_INPUT',
      };

      mockedEmailVerificationApi.resendCode.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        const response = await result.current.resendCode();
        expect(response).toEqual(mockResponse);
      });

      expect(mockedEmailVerificationApi.resendCode).toHaveBeenCalledWith(mockSessionUUID);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle resend errors', async () => {
      const mockError: EmailVerificationResponse = {
        status: 'error',
        error: 'Too many attempts',
        nextTransition: 'CODE_INPUT',
      };

      mockedEmailVerificationApi.resendCode.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useEmailVerification());

      await act(async () => {
        try {
          await result.current.resendCode();
        } catch (error: any) {
          expect(error).toEqual(mockError);
        }
      });

      expect(result.current.error).toBe('Too many attempts');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('clearError and reset', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useEmailVerification());

      // Set an error first
      act(() => {
        result.current.verifyEmail(mockEmail).catch(() => {
          // Intentionally empty - just catching the error for test setup
        });
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should reset state', () => {
      const { result } = renderHook(() => useEmailVerification());

      // Set some state first
      act(() => {
        result.current.verifyEmail(mockEmail).catch(() => {
          // Intentionally empty - just catching the error for test setup
        });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current).toEqual({
        isLoading: false,
        error: null,
        isEmailSent: false,
        isVerified: false,
        verifyEmail: expect.any(Function),
        verifyCode: expect.any(Function),
        resendCode: expect.any(Function),
        clearError: expect.any(Function),
        reset: expect.any(Function),
      });
    });
  });
});
