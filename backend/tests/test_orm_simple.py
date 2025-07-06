"""
Simple ORM test script for Maria AI Agent.

This script provides a straightforward test of the SQLAlchemy ORM
implementation without relying on Flask or other dependencies.

Run this script with: python -m backend.tests.test_orm_simple
"""

import os
import sys
import uuid
from pathlib import Path

# Add project root to path to make imports work
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(project_root))

# Load environment variables
from dotenv import load_dotenv

load_dotenv()

from app.database_core import Base, get_engine, init_database

# Import the repository components
from app.models import UserSession
from app.repositories.factory import get_user_session_repository


def test_repository():
    """Test basic repository operations."""
    print("Starting repository test...")

    # Initialize database first
    print("Initializing database...")
    init_database()
    # Get engine lazily to allow test fixtures to override database URL
    engine = get_engine()

    # Create database tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    # Get repository
    repo = get_user_session_repository()

    # Generate test UUID
    session_uuid_obj = uuid.uuid4()  # Keep as UUID object
    session_uuid_str = str(session_uuid_obj)  # String for create_session
    print(f"Generated UUID: {session_uuid_str}")

    # Test create
    print("\nTesting create operation...")
    try:
        user_session = repo.create_session(
            session_uuid=session_uuid_str,  # create_session still expects string
            name="Test User",
            email="test@example.com",
            consent_user_data=True,
        )
        print(f"Created session: {user_session}")
        print(f"Session data: {user_session.to_dict()}")
    except Exception as e:
        print(f"Error creating session: {str(e)}")
        raise

    # Test get
    print("\nTesting get operation...")
    try:
        retrieved = repo.get_by_uuid(session_uuid_obj)  # Pass UUID object
        if retrieved:
            print(f"Retrieved session: {retrieved}")
            print(f"Session data: {retrieved.to_dict()}")
        else:
            print("Error: Session not found")
            raise ValueError("Session not found")
    except Exception as e:
        print(f"Error retrieving session: {str(e)}")
        raise

    # Test update
    print("\nTesting update operation...")
    try:
        updated = repo.update_session(
            session_uuid_obj,
            {
                "name": "Updated User",
                "email": "updated@example.com",
            },  # Pass UUID object
        )
        if updated:
            print(f"Updated session: {updated}")
            print(f"Session data: {updated.to_dict()}")
        else:
            print("Error: Session not found for update")
            raise ValueError("Session not found for update")
    except Exception as e:
        print(f"Error updating session: {str(e)}")
        raise

    # Test delete
    print("\nTesting delete operation...")
    try:
        success = repo.delete_session(session_uuid_obj)  # Pass UUID object
        if success:
            print(f"Successfully deleted session with UUID: {session_uuid_str}")
        else:
            print(f"Error: Failed to delete session with UUID: {session_uuid_str}")
            raise ValueError("Failed to delete session")
    except Exception as e:
        print(f"Error deleting session: {str(e)}")
        raise

    print("\nAll tests completed successfully!")


if __name__ == "__main__":
    try:
        test_repository()
    except Exception as e:
        print(f"\nTest failed: {str(e)}")
