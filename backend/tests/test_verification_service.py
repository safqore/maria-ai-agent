"""
Tests for VerificationService functionality.
"""

from unittest.mock import Mock, patch

import pytest

from app.services.verification_service import VerificationService


class TestVerificationService:
    """Test suite for VerificationService functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        self.service = VerificationService()

    @patch('app.services.verification_service.EmailService')
    @patch('app.services.verification_service.EmailVerificationRepository')
    def test_verification_service_initialization(self, mock_repo, mock_email_service):
        """Test VerificationService initialization."""
        service = VerificationService()
        
        # Check that dependencies are initialized
        assert service.email_service is not None
        assert service.email_verification_repository is not None

    @patch.object(VerificationService, 'email_verification_repository')
    @patch.object(VerificationService, 'email_service')
    def test_send_verification_code_success(self, mock_email_service, mock_repo):
        """Test successful verification code sending."""
        # Mock repository response
        mock_user_session = Mock()
        mock_user_session.can_resend_verification = True
        mock_repo.get_by_session_id.return_value = mock_user_session
        mock_repo.update_verification_code.return_value = True
        mock_repo.increment_resend_attempts.return_value = True
        
        # Mock email service response
        mock_email_service.validate_email_format.return_value = True
        mock_email_service.generate_verification_code.return_value = "123456"
        mock_email_service.get_verification_expiry.return_value = "2024-01-01T00:10:00Z"
        mock_email_service.send_verification_email.return_value = True
        mock_email_service.hash_email.return_value = "hashed_email"

        result = self.service.send_verification_code("test-session-id", "test@example.com")

        assert result['status'] == 'success'
        assert result['nextTransition'] == 'CODE_INPUT'
        assert 'message' in result

    @patch.object(VerificationService, 'email_verification_repository')
    @patch.object(VerificationService, 'email_service')
    def test_send_verification_code_invalid_email(self, mock_email_service, mock_repo):
        """Test verification code sending with invalid email."""
        # Mock repository response
        mock_user_session = Mock()
        mock_user_session.can_resend_verification = True
        mock_repo.get_by_session_id.return_value = mock_user_session
        
        # Mock email service response
        mock_email_service.validate_email_format.return_value = False

        result = self.service.send_verification_code("test-session-id", "invalid-email")

        assert result['status'] == 'error'
        assert result['nextTransition'] == 'EMAIL_INPUT'
        assert 'Please enter a valid email address' in result['error']

    @patch.object(VerificationService, 'email_verification_repository')
    def test_send_verification_code_session_not_found(self, mock_repo):
        """Test verification code sending with non-existent session."""
        mock_repo.get_by_session_id.return_value = None

        result = self.service.send_verification_code("test-session-id", "test@example.com")

        assert result['status'] == 'error'
        assert result['nextTransition'] == 'SESSION_ERROR'
        assert 'Session not found' in result['error']

    @patch.object(VerificationService, 'email_verification_repository')
    @patch.object(VerificationService, 'email_service')
    def test_verify_code_success(self, mock_email_service, mock_repo):
        """Test successful code verification."""
        # Mock repository response
        mock_user_session = Mock()
        mock_user_session.is_email_verified = False
        mock_user_session.verification_code = "123456"
        mock_user_session.is_verification_expired = False
        mock_user_session.verification_attempts = 0
        mock_user_session.max_verification_attempts = 3
        mock_user_session.verification_attempts_remaining = 2
        mock_repo.get_by_session_id.return_value = mock_user_session
        mock_repo.increment_verification_attempts.return_value = True
        mock_repo.mark_email_verified.return_value = True

        result = self.service.verify_code("test-session-id", "123456")

        assert result['status'] == 'success'
        assert result['nextTransition'] == 'CHAT_READY'
        assert 'Email verified successfully' in result['message']

    @patch.object(VerificationService, 'email_verification_repository')
    def test_verify_code_session_not_found(self, mock_repo):
        """Test code verification with non-existent session."""
        mock_repo.get_by_session_id.return_value = None

        result = self.service.verify_code("test-session-id", "123456")

        assert result['status'] == 'error'
        assert result['nextTransition'] == 'SESSION_ERROR'
        assert 'Session not found' in result['error']

    @patch.object(VerificationService, 'email_verification_repository')
    def test_verify_code_already_verified(self, mock_repo):
        """Test code verification when email is already verified."""
        mock_user_session = Mock()
        mock_user_session.is_email_verified = True
        mock_repo.get_by_session_id.return_value = mock_user_session

        result = self.service.verify_code("test-session-id", "123456")

        assert result['status'] == 'success'
        assert result['nextTransition'] == 'CHAT_READY'
        assert 'Email already verified' in result['message']

    @patch.object(VerificationService, 'email_verification_repository')
    def test_verify_code_no_verification_code(self, mock_repo):
        """Test code verification when no verification code exists."""
        mock_user_session = Mock()
        mock_user_session.is_email_verified = False
        mock_user_session.verification_code = None
        mock_repo.get_by_session_id.return_value = mock_user_session

        result = self.service.verify_code("test-session-id", "123456")

        assert result['status'] == 'error'
        assert result['nextTransition'] == 'EMAIL_INPUT'
        assert 'No verification code found' in result['error']

    @patch.object(VerificationService, 'email_verification_repository')
    def test_verify_code_expired(self, mock_repo):
        """Test code verification with expired code."""
        mock_user_session = Mock()
        mock_user_session.is_email_verified = False
        mock_user_session.verification_code = "123456"
        mock_user_session.is_verification_expired = True
        mock_repo.get_by_session_id.return_value = mock_user_session

        result = self.service.verify_code("test-session-id", "123456")

        assert result['status'] == 'error'
        assert result['nextTransition'] == 'EMAIL_INPUT'
        assert 'Verification code has expired' in result['error']

    @patch.object(VerificationService, 'email_verification_repository')
    def test_verify_code_max_attempts_reached(self, mock_repo):
        """Test code verification when max attempts reached."""
        mock_user_session = Mock()
        mock_user_session.is_email_verified = False
        mock_user_session.verification_code = "123456"
        mock_user_session.is_verification_expired = False
        mock_user_session.verification_attempts = 3
        mock_user_session.max_verification_attempts = 3
        mock_repo.get_by_session_id.return_value = mock_user_session

        result = self.service.verify_code("test-session-id", "123456")

        assert result['status'] == 'error'
        assert result['nextTransition'] == 'SESSION_RESET'
        assert 'Maximum verification attempts reached' in result['error']

    @patch.object(VerificationService, 'email_verification_repository')
    @patch.object(VerificationService, 'email_service')
    def test_resend_code_success(self, mock_email_service, mock_repo):
        """Test successful code resending."""
        # Mock repository response
        mock_user_session = Mock()
        mock_user_session.is_email_verified = False
        mock_user_session.can_resend_verification = True
        mock_user_session.email = "test@example.com"
        mock_repo.get_by_session_id.return_value = mock_user_session
        mock_repo.update_verification_code.return_value = True
        mock_repo.increment_resend_attempts.return_value = True
        
        # Mock email service response
        mock_email_service.generate_verification_code.return_value = "654321"
        mock_email_service.get_verification_expiry.return_value = "2024-01-01T00:10:00Z"
        mock_email_service.send_verification_email.return_value = True
        mock_email_service.hash_email.return_value = "hashed_email"

        result = self.service.resend_code("test-session-id")

        assert result['status'] == 'success'
        assert result['nextTransition'] == 'CODE_INPUT'
        assert 'Verification code resent successfully' in result['message']

    @patch.object(VerificationService, 'email_verification_repository')
    def test_resend_code_session_not_found(self, mock_repo):
        """Test code resending with non-existent session."""
        mock_repo.get_by_session_id.return_value = None

        result = self.service.resend_code("test-session-id")

        assert result['status'] == 'error'
        assert result['nextTransition'] == 'SESSION_ERROR'
        assert 'Session not found' in result['error']

    @patch.object(VerificationService, 'email_verification_repository')
    def test_cleanup_expired_verifications(self, mock_repo):
        """Test cleanup of expired verification records."""
        mock_repo.cleanup_expired_verifications.return_value = 5

        result = self.service.cleanup_expired_verifications()

        assert result == 5
        mock_repo.cleanup_expired_verifications.assert_called_once_with(24) 