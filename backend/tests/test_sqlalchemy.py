"""
Tests for SQLAlchemy ORM integration.
"""

import uuid
from unittest.mock import patch

import pytest
from app.models import UserSession
from app.repositories.user_session_repository import UserSessionRepository
from sqlalchemy.exc import SQLAlchemyError


def test_user_session_model_create():
    """Test creating a UserSession model instance."""
    user_uuid = uuid.uuid4()
    session = UserSession(uuid=user_uuid, name="Test User", email="test@example.com")
    assert str(session.uuid) == str(user_uuid)
    assert session.name == "Test User"
    assert session.email == "test@example.com"
    assert session.created_at is not None
    assert session.updated_at is not None
    assert session.completed_at is None
    assert session.ip_address is None
    assert session.consent_user_data is False


@patch("app.repositories.user_session_repository.get_db_session")
def test_repository_exists(mock_get_db_session):
    """Test the exists method of UserSessionRepository."""
    # Setup mock
    mock_session = mock_get_db_session.return_value.__enter__.return_value
    mock_query = mock_session.query.return_value
    mock_query.filter.return_value.exists.return_value = "exists query"
    mock_session.query.return_value.scalar.return_value = True

    # Test
    result = UserSessionRepository.exists("test-uuid")

    # Verify
    assert result is True
    mock_session.query.assert_called_with("exists query")


@patch("app.repositories.user_session_repository.get_db_session")
def test_repository_create(mock_get_db_session):
    """Test the create method of UserSessionRepository."""
    # Setup mock
    mock_session = mock_get_db_session.return_value.__enter__.return_value

    # Test
    session_uuid = str(uuid.uuid4())
    result = UserSessionRepository.create(session_uuid, "Test User", "test@example.com")

    # Verify
    mock_session.add.assert_called_once()
    mock_session.commit.assert_called_once()
    mock_session.refresh.assert_called_once()


@patch("app.repositories.user_session_repository.get_db_session")
def test_repository_get_by_uuid(mock_get_db_session):
    """Test the get_by_uuid method of UserSessionRepository."""
    # Setup mock
    mock_session = mock_get_db_session.return_value.__enter__.return_value
    mock_session.query.return_value.filter.return_value.first.return_value = (
        UserSession(uuid=uuid.uuid4(), name="Test User", email="test@example.com")
    )

    # Test
    result = UserSessionRepository.get_by_uuid("test-uuid")

    # Verify
    assert isinstance(result, UserSession)
    assert result.name == "Test User"
    assert result.email == "test@example.com"
