"""
Simple ORM test script.

This script tests the basic functionality of the SQLAlchemy ORM implementation.
"""

import os
import sys
import uuid
from pathlib import Path

# Add the project directory to the Python path
project_dir = Path(__file__).resolve().parent
sys.path.append(str(project_dir))

from dotenv import load_dotenv

load_dotenv()


def main():
    """Main test function."""
    print("Starting ORM test...")

    # Import models and repository after sys.path is set
    from backend.app.database_core import Base, get_engine
    from backend.app.models import UserSession
    from backend.app.repositories.user_session_repository import UserSessionRepository

    # Create tables
    print("Creating tables...")
    Base.metadata.create_all(bind=get_engine())

    # Create repository
    print("Creating repository...")
    repo = UserSessionRepository()

    # Create session
    session_uuid = str(uuid.uuid4())
    print(f"Creating session with UUID: {session_uuid}")

    try:
        user_session = repo.create_session(
            session_uuid=session_uuid,
            name="Test User",
            email="test@example.com",
            consent_user_data=True,
        )

        print(f"Created session: {user_session}")
        print(f"Session dict: {user_session.to_dict()}")

        # Get session
        print(f"Getting session with UUID: {session_uuid}")
        retrieved = repo.get_by_uuid(session_uuid)
        print(f"Retrieved session: {retrieved}")

        # Update session
        print(f"Updating session with UUID: {session_uuid}")
        updated = repo.update_session(
            session_uuid, {"name": "Updated User", "email": "updated@example.com"}
        )
        print(f"Updated session: {updated.to_dict() if updated else None}")

        # Delete session
        print(f"Deleting session with UUID: {session_uuid}")
        deleted = repo.delete_session(session_uuid)
        print(f"Deleted session: {deleted}")

        print("All tests completed successfully!")
    except Exception as e:
        print(f"Error during test: {str(e)}")
        print(f"Type: {type(e)}")

        # Try to clean up
        try:
            print("Attempting to clean up...")
            repo.delete_session(session_uuid)
        except Exception:
            pass


if __name__ == "__main__":
    main()
