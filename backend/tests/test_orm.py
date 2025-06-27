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

# Add the project directory to the Python path
# so that imports work as expected
project_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(project_dir))

from backend.app.models import UserSession
from backend.app.repositories.factory import get_user_session_repository
from backend.app.database import Base, engine, get_db_session


def test_create_session():
    """Test creating a new user session."""
    repo = get_user_session_repository()
    session_uuid = str(uuid.uuid4())
    
    print(f"Creating session with UUID: {session_uuid}")
    
    user_session = repo.create_session(
        session_uuid=session_uuid,
        name="Test User",
        email="test@example.com",
        consent_user_data=True
    )
    
    print(f"Created session: {user_session}")
    print(f"Session dict: {user_session.to_dict()}")
    
    return session_uuid


def test_get_by_uuid(session_uuid):
    """Test retrieving a user session by UUID."""
    repo = get_user_session_repository()
    
    print(f"Getting session with UUID: {session_uuid}")
    
    user_session = repo.get_by_uuid(session_uuid)
    
    if user_session:
        print(f"Retrieved session: {user_session}")
        print(f"Session dict: {user_session.to_dict()}")
    else:
        print(f"No session found with UUID: {session_uuid}")


def test_update_session(session_uuid):
    """Test updating a user session."""
    repo = get_user_session_repository()
    
    print(f"Updating session with UUID: {session_uuid}")
    
    user_session = repo.update_session(
        session_uuid,
        {"name": "Updated User", "email": "updated@example.com"}
    )
    
    if user_session:
        print(f"Updated session: {user_session}")
        print(f"Session dict: {user_session.to_dict()}")
    else:
        print(f"No session found with UUID: {session_uuid}")


def test_delete_session(session_uuid):
    """Test deleting a user session."""
    repo = get_user_session_repository()
    
    print(f"Deleting session with UUID: {session_uuid}")
    
    success = repo.delete_session(session_uuid)
    
    if success:
        print(f"Successfully deleted session with UUID: {session_uuid}")
    else:
        print(f"Failed to delete session with UUID: {session_uuid}")


def clean_up(session_uuid):
    """Clean up any test data."""
    repo = get_user_session_repository()
    repo.delete_session(session_uuid)


def run_tests():
    """Run all tests."""
    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        # Run tests
        session_uuid = test_create_session()
        test_get_by_uuid(session_uuid)
        test_update_session(session_uuid)
        
        # Delete the test session
        test_delete_session(session_uuid)
        
        print("\nAll tests completed successfully!")
    except Exception as e:
        print(f"\nError during tests: {str(e)}")
        # Attempt to clean up even if tests fail
        try:
            clean_up(session_uuid)
        except Exception:
            pass


if __name__ == "__main__":
    run_tests()
