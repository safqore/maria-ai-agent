"""
Tests for VerificationService functionality.
"""

from unittest.mock import Mock, patch
from datetime import datetime

import pytest
from app.services.verification_service import VerificationService
from app.app_factory import create_app


class TestVerificationService:
    """Test suite for VerificationService functionality."""

    @patch("app.services.verification_service.EmailService")
    @patch("app.services.verification_service.EmailVerificationRepository")
    def test_verification_service_initialization(self, mock_repo, mock_email_service):
        """Test VerificationService initialization."""
        service = VerificationService()

        # Check that dependencies are initialized
        assert service.email_service is not None
        assert service.email_verification_repository is not None

    @patch("app.services.verification_service.EmailVerificationRepository")
    @patch("app.services.verification_service.EmailService")
    @patch("app.services.verification_service.log_audit_event")
    def test_send_verification_code_success(
        self, mock_audit, mock_email_service, mock_repo
    ):
        """Test successful verification code sending."""
        service = VerificationService()

        # Mock repository response
        mock_user_session = Mock()
        mock_user_session.can_resend_verification = True
        mock_repo.return_value.get_by_session_id.return_value = mock_user_session
        mock_repo.return_value.update_verification_code.return_value = True
        mock_repo.return_value.increment_resend_attempts.return_value = True

        # Mock email service response
        mock_email_service.return_value.validate_email_format.return_value = True
        mock_email_service.return_value.generate_verification_code.return_value = (
            "123456"
        )
        mock_email_service.return_value.get_verification_expiry.return_value = datetime(
            2024, 1, 1, 0, 10, 0
        )
        mock_email_service.return_value.send_verification_email.return_value = True
        mock_email_service.return_value.hash_email.return_value = "hashed_email"

        # Create Flask app context for the test
        app = create_app()
        with app.app_context():
            result = service.send_verification_code(
                "test-session-id", "test@example.com"
            )

        assert result["status"] == "success"
        assert result["nextTransition"] == "CODE_INPUT"
        assert "message" in result

    @patch("app.services.verification_service.EmailVerificationRepository")
    @patch("app.services.verification_service.EmailService")
    def test_send_verification_code_invalid_email(self, mock_email_service, mock_repo):
        """Test verification code sending with invalid email."""
        service = VerificationService()

        # Mock repository response
        mock_user_session = Mock()
        mock_user_session.can_resend_verification = True
        mock_repo.return_value.get_by_session_id.return_value = mock_user_session

        # Mock email service response
        mock_email_service.return_value.validate_email_format.return_value = False

        result = service.send_verification_code("test-session-id", "invalid-email")

        assert result["status"] == "error"
        assert result["nextTransition"] == "EMAIL_INPUT"
        assert "Please enter a valid email address" in result["error"]

    @patch("app.services.verification_service.EmailVerificationRepository")
    def test_send_verification_code_session_not_found(self, mock_repo):
        """Test verification code sending with non-existent session."""
        service = VerificationService()
        mock_repo.return_value.get_by_session_id.return_value = None

        result = service.send_verification_code("test-session-id", "test@example.com")

        assert result["status"] == "error"
        assert result["nextTransition"] == "SESSION_ERROR"
        assert "Session not found" in result["error"]

    @patch("app.services.verification_service.EmailVerificationRepository")
    @patch("app.services.verification_service.EmailService")
    @patch("app.services.verification_service.log_audit_event")
    def test_verify_code_success(self, mock_audit, mock_email_service, mock_repo):
        """Test successful code verification."""
        service = VerificationService()

        # Mock repository response
        mock_user_session = Mock()
        mock_user_session.is_email_verified = False
        mock_user_session.verification_code = "123456"
        mock_user_session.is_verification_expired = False
        mock_user_session.verification_attempts = 0
        mock_user_session.max_verification_attempts = 3
        mock_user_session.verification_attempts_remaining = 2
        mock_repo.return_value.get_by_session_id.return_value = mock_user_session
        mock_repo.return_value.increment_verification_attempts.return_value = True
        mock_repo.return_value.mark_email_verified.return_value = True

        # Create Flask app context for the test
        app = create_app()
        with app.app_context():
            result = service.verify_code("test-session-id", "123456")

        assert result["status"] == "success"
        assert result["nextTransition"] == "CHAT_READY"
        assert "Email verified successfully" in result["message"]

    @patch("app.services.verification_service.EmailVerificationRepository")
    def test_verify_code_session_not_found(self, mock_repo):
        """Test code verification with non-existent session."""
        service = VerificationService()
        mock_repo.return_value.get_by_session_id.return_value = None

        result = service.verify_code("test-session-id", "123456")

        assert result["status"] == "error"
        assert result["nextTransition"] == "SESSION_ERROR"
        assert "Session not found" in result["error"]

    @patch("app.services.verification_service.EmailVerificationRepository")
    def test_verify_code_already_verified(self, mock_repo):
        """Test code verification when email is already verified."""
        service = VerificationService()
        mock_user_session = Mock()
        mock_user_session.is_email_verified = True
        mock_repo.return_value.get_by_session_id.return_value = mock_user_session

        result = service.verify_code("test-session-id", "123456")

        assert result["status"] == "success"
        assert result["nextTransition"] == "CHAT_READY"
        assert "Email already verified" in result["message"]

    @patch("app.services.verification_service.EmailVerificationRepository")
    def test_verify_code_no_verification_code(self, mock_repo):
        """Test code verification when no verification code exists."""
        service = VerificationService()
        mock_user_session = Mock()
        mock_user_session.is_email_verified = False
        mock_user_session.verification_code = None
        mock_repo.return_value.get_by_session_id.return_value = mock_user_session

        result = service.verify_code("test-session-id", "123456")

        assert result["status"] == "error"
        assert result["nextTransition"] == "EMAIL_INPUT"
        assert "No verification code found" in result["error"]

    @patch("app.services.verification_service.EmailVerificationRepository")
    def test_verify_code_expired(self, mock_repo):
        """Test code verification with expired code."""
        service = VerificationService()
        mock_user_session = Mock()
        mock_user_session.is_email_verified = False
        mock_user_session.verification_code = "123456"
        mock_user_session.is_verification_expired = True
        mock_repo.return_value.get_by_session_id.return_value = mock_user_session

        result = service.verify_code("test-session-id", "123456")

        assert result["status"] == "error"
        assert result["nextTransition"] == "EMAIL_INPUT"
        assert "Verification code has expired" in result["error"]

    @patch("app.services.verification_service.EmailVerificationRepository")
    def test_verify_code_max_attempts_reached(self, mock_repo):
        """Test code verification when max attempts reached."""
        service = VerificationService()
        mock_user_session = Mock()
        mock_user_session.is_email_verified = False
        mock_user_session.verification_code = "123456"
        mock_user_session.is_verification_expired = False
        mock_user_session.verification_attempts = 3
        mock_user_session.max_verification_attempts = 3
        mock_repo.return_value.get_by_session_id.return_value = mock_user_session

        result = service.verify_code("test-session-id", "123456")

        assert result["status"] == "error"
        assert result["nextTransition"] == "SESSION_RESET"
        assert "Maximum verification attempts reached" in result["error"]

    @patch("app.services.verification_service.EmailVerificationRepository")
    @patch("app.services.verification_service.EmailService")
    @patch("app.services.verification_service.log_audit_event")
    def test_resend_code_success(self, mock_audit, mock_email_service, mock_repo):
        """Test successful code resending."""
        service = VerificationService()

        # Mock repository response
        mock_user_session = Mock()
        mock_user_session.is_email_verified = False
        mock_user_session.can_resend_verification = True
        mock_user_session.email = "test@example.com"
        mock_repo.return_value.get_by_session_id.return_value = mock_user_session
        mock_repo.return_value.update_verification_code.return_value = True
        mock_repo.return_value.increment_resend_attempts.return_value = True

        # Mock email service response
        mock_email_service.return_value.generate_verification_code.return_value = (
            "654321"
        )
        mock_email_service.return_value.get_verification_expiry.return_value = datetime(
            2024, 1, 1, 0, 10, 0
        )
        mock_email_service.return_value.send_verification_email.return_value = True
        mock_email_service.return_value.hash_email.return_value = "hashed_email"

        # Create Flask app context for the test
        app = create_app()
        with app.app_context():
            result = service.resend_code("test-session-id")

        assert result["status"] == "success"
        assert result["nextTransition"] == "CODE_INPUT"
        assert "Verification code resent successfully" in result["message"]

    @patch("app.services.verification_service.EmailVerificationRepository")
    def test_resend_code_session_not_found(self, mock_repo):
        """Test code resending with non-existent session."""
        service = VerificationService()
        mock_repo.return_value.get_by_session_id.return_value = None

        result = service.resend_code("test-session-id")

        assert result["status"] == "error"
        assert result["nextTransition"] == "SESSION_ERROR"
        assert "Session not found" in result["error"]

    @patch("app.services.verification_service.EmailVerificationRepository")
    def test_cleanup_expired_verifications(self, mock_repo):
        """Test cleanup of expired verifications."""
        service = VerificationService()
        mock_repo.return_value.cleanup_expired_verifications.return_value = 5

        # Create Flask app context for the test
        app = create_app()
        with app.app_context():
            result = service.cleanup_expired_verifications(hours=24)

        assert result == 5
        mock_repo.return_value.cleanup_expired_verifications.assert_called_once_with(24)
