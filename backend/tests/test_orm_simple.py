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

# Import the repository components
from backend.app.models import UserSession
from backend.app.repositories.factory import get_user_session_repository
from backend.app.database import Base, engine


def test_repository():
    """Test basic repository operations."""
    print("Starting repository test...")
    
    # Create database tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Get repository
    repo = get_user_session_repository()
    
    # Generate test UUID
    session_uuid = str(uuid.uuid4())
    print(f"Generated UUID: {session_uuid}")
    
    # Test create
    print("\nTesting create operation...")
    try:
        user_session = repo.create_session(
            session_uuid=session_uuid,
            name="Test User",
            email="test@example.com",
            consent_user_data=True
        )
        print(f"Created session: {user_session}")
        print(f"Session data: {user_session.to_dict()}")
    except Exception as e:
        print(f"Error creating session: {str(e)}")
        raise
    
    # Test get
    print("\nTesting get operation...")
    try:
        retrieved = repo.get_by_uuid(session_uuid)
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
            session_uuid,
            {"name": "Updated User", "email": "updated@example.com"}
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
        success = repo.delete_session(session_uuid)
        if success:
            print(f"Successfully deleted session with UUID: {session_uuid}")
        else:
            print(f"Error: Failed to delete session with UUID: {session_uuid}")
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
