#!/usr/bin/env python3
"""
Test script for the repository pattern with TransactionContext.

This script tests the BaseRepository and TransactionContext to ensure
they work correctly together.
"""
import sys
import uuid
from pathlib import Path

# Add the project directory to the Python path
project_dir = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(project_dir))

# Import models and repositories
try:
    print("Starting repository test...")

    # Import models and repositories
    from app.database.transaction import TransactionContext
    from app.database_core import get_db_session
    from app.models import UserSession
    from app.repositories.factory import get_user_session_repository

    print("Imports successful!")
except ImportError as e:
    print(f"Import error: {e}")
    import traceback

    traceback.print_exc()
    sys.exit(1)


def test_repository_pattern():
    """Test the repository pattern implementation."""
    try:
        print("Testing repository pattern with TransactionContext...")
        print("Python version:", sys.version)
        print("Project path:", project_dir)

        # Create a repository
        repo = get_user_session_repository()
        print("  - Repository created successfully.")

        # Generate a test UUID
        session_uuid = str(uuid.uuid4())
        print(f"  - Testing with UUID: {session_uuid}")

        # Create a user session
        user_session = repo.create_session(
            session_uuid=session_uuid, name="Test User", email="test@example.com"
        )
        print("  - User session created successfully:")
        print(f"    UUID: {user_session.uuid}")
        print(f"    Name: {user_session.name}")
        print(f"    Email: {user_session.email}")

        # Retrieve the user session
        retrieved = repo.get_by_uuid(session_uuid)
        if retrieved:
            print("  - User session retrieved successfully.")
        else:
            print("  - Error: Failed to retrieve user session!")
            return 1

        # Update the user session
        updated = repo.update(user_session.uuid, {"name": "Updated Name"})
        print(f"  - User session updated successfully: {updated.name}")

        print("All repository tests passed!")
        return 0

    except Exception as e:
        print(f"Error testing repository pattern: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(test_repository_pattern())
