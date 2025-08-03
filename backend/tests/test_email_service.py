"""
Tests for EmailService functionality.
"""

import os
from unittest.mock import Mock, patch

import pytest
from app.services.email_service import EmailService


class TestEmailService:
    """Test suite for EmailService functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        self.email_service = EmailService()

    def test_generate_verification_code(self):
        """Test verification code generation."""
        code = self.email_service.generate_verification_code()

        # Check code format
        assert len(code) == 6
        assert code.isdigit()
        assert all(c in "0123456789" for c in code)

    def test_generate_verification_code_uniqueness(self):
        """Test that generated codes are unique."""
        codes = set()
        for _ in range(100):
            code = self.email_service.generate_verification_code()
            codes.add(code)

        # Should have generated unique codes
        assert len(codes) == 100

    def test_hash_email(self):
        """Test email hashing functionality."""
        email = "test@example.com"
        hashed = self.email_service.hash_email(email)

        # Check that hash is different from original
        assert hashed != email
        assert len(hashed) > len(email)
        assert hashed.startswith("$2b$")

    def test_hash_email_consistency(self):
        """Test that same email produces different hashes (due to salt)."""
        email = "test@example.com"
        hash1 = self.email_service.hash_email(email)
        hash2 = self.email_service.hash_email(email)

        # Should be different due to salt
        assert hash1 != hash2

    def test_validate_email_format_valid(self):
        """Test email format validation with valid emails."""
        valid_emails = [
            "test@example.com",
            "user.name@domain.co.uk",
            "user+tag@example.org",
            "123@numbers.com",
            "user@subdomain.example.com",
        ]

        for email in valid_emails:
            assert self.email_service.validate_email_format(email)

    def test_validate_email_format_invalid(self):
        """Test email format validation with invalid emails."""
        invalid_emails = [
            "invalid-email",
            "@example.com",
            "user@",
            "user@.com",
            "user..name@example.com",
            "user@example..com",
            "user name@example.com",
            "user@example",
            "",
        ]

        for email in invalid_emails:
            assert not self.email_service.validate_email_format(email)

    def test_create_email_template(self):
        """Test email template creation."""
        code = "123456"
        subject, html_content = self.email_service.create_email_template(code)

        # Check subject
        assert "Maria AI Agent" in subject
        assert "Verification Code" in subject

        # Check HTML content
        assert code in html_content
        assert "Maria AI Agent" in html_content
        assert "10 minutes" in html_content
        assert "Security Notice" in html_content

    def test_create_email_template_development_environment(self):
        """Test email template creation with development environment."""
        code = "654321"
        subject, html_content = self.email_service.create_email_template(
            code, "development"
        )

        # Check development prefix
        assert "[DEVELOPMENT]" in subject
        assert code in html_content

    def test_create_email_template_production_environment(self):
        """Test email template creation with production environment."""
        code = "789012"
        subject, html_content = self.email_service.create_email_template(
            code, "production"
        )

        # Check no prefix in production
        assert "[PRODUCTION]" not in subject
        assert code in html_content

    @patch.dict(
        os.environ,
        {
            "SMTP_HOST": "smtp.gmail.com",
            "SMTP_PORT": "587",
            "SMTP_USERNAME": "test@example.com",
            "SMTP_PASSWORD": "test_password",
            "SENDER_EMAIL": "noreply@test.com",
            "SENDER_NAME": "Test Sender",
        },
    )
    def test_email_service_initialization_with_env(self):
        """Test EmailService initialization with environment variables."""
        service = EmailService()

        assert service.smtp_server == "smtp.gmail.com"
        assert service.smtp_port == 587
        assert service.username == "test@example.com"
        assert service.password == "test_password"
        assert service.sender_email == "noreply@test.com"
        assert service.sender_name == "Test Sender"

    def test_email_service_initialization_defaults(self):
        """Test EmailService initialization with default values."""
        # Clear environment variables
        with patch.dict(os.environ, {}, clear=True):
            service = EmailService()

            assert service.smtp_server == "smtp.gmail.com"
            assert service.smtp_port == 587
            assert service.username is None
            assert service.password is None
            assert service.sender_email == "noreply@safqore.com"
            assert service.sender_name == "Maria"

    def test_get_verification_expiry(self):
        """Test verification expiry calculation."""
        from datetime import UTC, datetime, timedelta

        expiry = self.email_service.get_verification_expiry()
        now = datetime.now(UTC)

        # Should be approximately 10 minutes from now
        time_diff = expiry - now

        # Check that expiry is between 9.5 and 10.5 minutes from now
        assert (
            timedelta(minutes=9, seconds=30)
            <= time_diff
            <= timedelta(minutes=10, seconds=30)
        )

    def test_get_verification_expiry_custom_minutes(self):
        """Test verification expiry calculation with custom minutes."""
        from datetime import UTC, datetime, timedelta

        expiry = self.email_service.get_verification_expiry(minutes=5)
        now = datetime.now(UTC)

        # Should be approximately 5 minutes from now
        time_diff = expiry - now

        # Check that expiry is between 4.5 and 5.5 minutes from now
        assert (
            timedelta(minutes=4, seconds=30)
            <= time_diff
            <= timedelta(minutes=5, seconds=30)
        )
