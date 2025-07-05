"""
Test script for SQLAlchemy ORM implementation.

This script tests the basic functionality of the SQLAlchemy ORM implementation,
including:
- Model creation
- Repository methods
- Database session management

To run this script:
1. Make sure the database is running
2. Set the environment variables for database connection
3. Run 'python -m backend.tests.test_orm' from the project root
"""

import os
import sys
import uuid
from pathlib import Path
import pytest

# Add the project directory to the Python path
# so that imports work as expected
project_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(project_dir))

from app.database_core import Base, get_engine, get_db_session
from app.models import UserSession
from app.repositories.factory import get_user_session_repository


@pytest.mark.sqlite_incompatible
def test_create_session():
    """Test creating a new user session."""
    repo = get_user_session_repository()
    session_uuid = str(uuid.uuid4())

    print(f"Creating session with UUID: {session_uuid}")

    user_session = repo.create_session(
        session_uuid=session_uuid,
        name="Test User",
        email="test@example.com",
        consent_user_data=True,
    )

    assert user_session is not None
    assert user_session.uuid == uuid.UUID(session_uuid)
    assert user_session.name == "Test User"
    assert user_session.email == "test@example.com"
    assert user_session.consent_user_data is True


def test_get_by_uuid(session_uuid):
    """Test retrieving a user session by UUID."""
    repo = get_user_session_repository()

    print(f"Getting session with UUID: {session_uuid}")

    user_session = repo.get_by_uuid(session_uuid)

    assert user_session is not None
    assert user_session.uuid == session_uuid  # session_uuid is now a UUID object
    assert user_session.name == "Test User"
    assert user_session.email == "test@example.com"


def test_update_session(session_uuid):
    """Test updating a user session."""
    repo = get_user_session_repository()

    print(f"Updating session with UUID: {session_uuid}")

    user_session = repo.update_session(
        session_uuid, {"name": "Updated User", "email": "updated@example.com"}
    )

    assert user_session is not None
    assert user_session.name == "Updated User"
    assert user_session.email == "updated@example.com"


def test_delete_session(session_uuid):
    """Test deleting a user session."""
    repo = get_user_session_repository()

    print(f"Deleting session with UUID: {session_uuid}")

    success = repo.delete_session(session_uuid)

    assert success is True
