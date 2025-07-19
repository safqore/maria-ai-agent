"""
Tests for SQLAlchemy ORM integration.
"""

import uuid
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest
from tests.mocks.models import UserSession


def test_user_session_model_create():
    """Test creating a UserSession model instance."""
    user_uuid = uuid.uuid4()
    session = UserSession(uuid=user_uuid, name="Test User", email="test@example.com")

    # Manually set required fields for the mock model
    session.created_at = datetime.now(UTC)
    session.updated_at = datetime.now(UTC)
    session.consent_user_data = False

    assert str(session.uuid) == str(user_uuid)
    assert session.name == "Test User"
    assert session.email == "test@example.com"
    assert session.created_at is not None
    assert session.updated_at is not None
    assert session.completed_at is None
    assert session.ip_address is None
    assert session.consent_user_data is False


def test_user_session_model_properties():
    """Test UserSession model property methods."""
    user_uuid = uuid.uuid4()
    session = UserSession(uuid=user_uuid, name="Test User", email="test@example.com")

    # Set up verification fields
    session.verification_attempts = 1
    session.max_verification_attempts = 3
    session.resend_attempts = 0
    session.max_resend_attempts = 3
    session.is_email_verified = False

    # Test properties
    assert session.verification_attempts_remaining == 2
    assert session.resend_attempts_remaining == 3
    assert session.can_resend_verification is True

    # Test verification methods
    session.start_email_verification("123456")
    assert session.verification_code == "123456"
    assert session.verification_attempts == 0
    assert session.is_email_verified is False

    session.mark_email_verified()
    assert session.is_email_verified is True
    assert session.verification_code is None


def test_user_session_to_dict():
    """Test UserSession to_dict method."""
    user_uuid = uuid.uuid4()
    session = UserSession(uuid=user_uuid, name="Test User", email="test@example.com")

    session.created_at = datetime.now(UTC)
    session.updated_at = datetime.now(UTC)
    session.consent_user_data = False

    result = session.to_dict()

    assert result["uuid"] == str(user_uuid)
    assert result["name"] == "Test User"
    assert result["email"] == "test@example.com"
    assert result["consent_user_data"] is False
    assert "created_at" in result
    assert "updated_at" in result
