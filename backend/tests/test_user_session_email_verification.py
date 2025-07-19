"""
Tests for UserSession email verification functionality.
"""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest
from tests.mocks.models import UserSession


class TestUserSessionEmailVerification:
    """Test suite for UserSession email verification functionality."""

    def test_user_session_creation_with_verification_defaults(self):
        """Test creating a UserSession with default verification values."""
        session_uuid = uuid.uuid4()

        user_session = UserSession(
            uuid=session_uuid, name="Test User", email="test@example.com"
        )

        # Check basic fields
        assert str(user_session.uuid) == str(session_uuid)
        assert user_session.name == "Test User"
        assert user_session.email == "test@example.com"

        # Check verification defaults
        assert user_session.verification_code is None
        assert user_session.verification_attempts == 0
        assert user_session.max_verification_attempts == 3
        assert user_session.verification_expires_at is None
        assert user_session.is_email_verified is False
        assert user_session.resend_attempts == 0
        assert user_session.max_resend_attempts == 3
        assert user_session.last_resend_at is None

    def test_user_session_to_dict_includes_verification_fields(self):
        """Test that to_dict includes all verification fields."""
        user_session = UserSession(
            uuid=uuid.uuid4(), name="Test User", email="test@example.com"
        )

        result = user_session.to_dict()

        # Check verification fields are included
        assert "verification_code" in result
        assert "verification_attempts" in result
        assert "max_verification_attempts" in result
        assert "verification_expires_at" in result
        assert "is_email_verified" in result
        assert "resend_attempts" in result
        assert "max_resend_attempts" in result
        assert "last_resend_at" in result

        # Check default values
        assert result["verification_code"] is None
        assert result["verification_attempts"] == 0
        assert result["max_verification_attempts"] == 3
        assert result["verification_expires_at"] is None
        assert result["is_email_verified"] is False
        assert result["resend_attempts"] == 0
        assert result["max_resend_attempts"] == 3
        assert result["last_resend_at"] is None

    def test_start_email_verification(self):
        """Test starting a new email verification process."""
        user_session = UserSession(
            uuid=uuid.uuid4(), name="Test User", email="test@example.com"
        )

        code = "123456"
        user_session.start_email_verification(code)

        assert user_session.verification_code == code
        assert user_session.verification_attempts == 0
        assert user_session.is_email_verified is False
        assert user_session.verification_expires_at is not None

        # Check that expiration is approximately 10 minutes from now
        time_diff = user_session.verification_expires_at - datetime.now(UTC)
        expected_diff = timedelta(minutes=10)
        assert abs(time_diff.total_seconds() - expected_diff.total_seconds()) < 1

    def test_is_verification_expired_property(self):
        """Test is_verification_expired property."""
        user_session = UserSession(
            uuid=uuid.uuid4(), name="Test User", email="test@example.com"
        )

        # Test with no expiration time
        assert user_session.is_verification_expired is False

        # Test non-expired verification
        user_session.start_email_verification("123456")
        assert user_session.is_verification_expired is False

        # Test expired verification
        past_time = datetime.now(UTC) - timedelta(minutes=1)
        user_session.verification_expires_at = past_time
        assert user_session.is_verification_expired is True

    def test_verification_attempts_remaining_property(self):
        """Test verification_attempts_remaining property."""
        user_session = UserSession(
            uuid=uuid.uuid4(), name="Test User", email="test@example.com"
        )

        assert user_session.verification_attempts_remaining == 3

        user_session.verification_attempts = 1
        assert user_session.verification_attempts_remaining == 2

        user_session.verification_attempts = 3
        assert user_session.verification_attempts_remaining == 0

        user_session.verification_attempts = 5  # More than max
        assert user_session.verification_attempts_remaining == 0

    def test_resend_attempts_remaining_property(self):
        """Test resend_attempts_remaining property."""
        user_session = UserSession(
            uuid=uuid.uuid4(), name="Test User", email="test@example.com"
        )

        assert user_session.resend_attempts_remaining == 3

        user_session.resend_attempts = 1
        assert user_session.resend_attempts_remaining == 2

        user_session.resend_attempts = 3
        assert user_session.resend_attempts_remaining == 0

    def test_can_resend_verification_property(self):
        """Test can_resend_verification property with various conditions."""
        user_session = UserSession(
            uuid=uuid.uuid4(), name="Test User", email="test@example.com"
        )

        # Initially should be able to resend
        assert user_session.can_resend_verification is True

        # Test max resend attempts reached
        user_session.resend_attempts = 3
        assert user_session.can_resend_verification is False

        # Reset resend attempts, test cooldown
        user_session.resend_attempts = 0
        user_session.last_resend_at = datetime.now(UTC) - timedelta(
            seconds=20
        )  # 20 seconds ago
        assert user_session.can_resend_verification is False  # Still in cooldown

        # Test after cooldown period
        user_session.last_resend_at = datetime.now(UTC) - timedelta(
            seconds=35
        )  # 35 seconds ago
        assert user_session.can_resend_verification is True

    def test_increment_verification_attempts(self):
        """Test increment_verification_attempts method."""
        user_session = UserSession(
            uuid=uuid.uuid4(), name="Test User", email="test@example.com"
        )

        assert user_session.verification_attempts == 0

        user_session.increment_verification_attempts()
        assert user_session.verification_attempts == 1

        user_session.increment_verification_attempts()
        assert user_session.verification_attempts == 2

    def test_increment_resend_attempts(self):
        """Test increment_resend_attempts method."""
        user_session = UserSession(
            uuid=uuid.uuid4(), name="Test User", email="test@example.com"
        )

        assert user_session.resend_attempts == 0
        assert user_session.last_resend_at is None

        # Mock current time for consistent testing
        with patch("tests.mocks.models.datetime") as mock_datetime:
            mock_now = datetime.now(UTC)
            mock_datetime.now.return_value = mock_now

            user_session.increment_resend_attempts()

            assert user_session.resend_attempts == 1
            assert user_session.last_resend_at == mock_now

    def test_mark_email_verified(self):
        """Test mark_email_verified method."""
        user_session = UserSession(
            uuid=uuid.uuid4(), name="Test User", email="test@example.com"
        )

        # Set up verification first
        user_session.start_email_verification("123456")
        assert user_session.verification_code == "123456"
        assert user_session.is_email_verified is False

        user_session.mark_email_verified()
        assert user_session.is_email_verified is True
        assert user_session.verification_code is None  # Code cleared after verification

    def test_reset_verification(self):
        """Test reset_verification method."""
        user_session = UserSession(
            uuid=uuid.uuid4(), name="Test User", email="test@example.com"
        )

        # Set up some verification state
        user_session.start_email_verification("123456")
        user_session.verification_attempts = 2
        user_session.resend_attempts = 1
        user_session.last_resend_at = datetime.now(UTC)
        user_session.is_email_verified = True

        # Reset verification
        user_session.reset_verification()

        # Check all fields are reset
        assert user_session.verification_code is None
        assert user_session.verification_attempts == 0
        assert user_session.verification_expires_at is None
        assert user_session.is_email_verified is False
        assert user_session.resend_attempts == 0
        assert user_session.last_resend_at is None

    def test_verification_flow_integration(self):
        """Test a complete verification flow."""
        user_session = UserSession(
            uuid=uuid.uuid4(), name="Test User", email="test@example.com"
        )

        # Start verification
        code = "654321"
        user_session.start_email_verification(code)
        assert user_session.verification_code == code
        assert not user_session.is_verification_expired
        assert user_session.can_resend_verification

        # Simulate failed attempt
        user_session.increment_verification_attempts()
        assert user_session.verification_attempts == 1
        assert user_session.verification_attempts_remaining == 2

        # Simulate resend
        with patch("tests.mocks.models.datetime") as mock_datetime:
            mock_now = datetime.now(UTC)
            mock_datetime.now.return_value = mock_now

            user_session.increment_resend_attempts()
            assert user_session.resend_attempts == 1
            assert user_session.last_resend_at == mock_now

        # Simulate successful verification
        user_session.mark_email_verified()
        assert user_session.is_email_verified
        assert user_session.verification_code is None

    def test_session_string_representation(self):
        """Test string representation includes email verification status."""
        user_session = UserSession(
            uuid=uuid.uuid4(), name="Test User", email="test@example.com"
        )

        expected_repr = f"<UserSession(uuid='{user_session.uuid}', name='Test User', email='test@example.com')>"
        assert str(user_session) == expected_repr
