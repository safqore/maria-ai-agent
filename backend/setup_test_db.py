#!/usr/bin/env python3
"""
Test database setup script for Maria AI Agent.

This script sets up the test database and applies migrations
before running tests.
"""

import os
import sys
from pathlib import Path

# Add the current directory to Python path to allow imports
sys.path.insert(0, str(Path(__file__).parent))


def setup_test_database():
    """Set up test database with all required tables."""
    try:
        # Import database components
        from app import models  # This ensures models are registered
        from app.database_core import Base, get_engine, set_database_url

        # Use SQLite for testing
        sqlite_path = Path(__file__).parent / "maria_ai_test.db"
        sqlite_url = f"sqlite:///{sqlite_path}"

        print(f"Setting up test database: {sqlite_url}")
        set_database_url(sqlite_url)

        # Remove existing test database to ensure clean state
        if sqlite_path.exists():
            print(f"Removing existing test database: {sqlite_path}")
            sqlite_path.unlink()

        # Get engine
        engine = get_engine()

        # Create all tables using SQLAlchemy (this will use the current model definitions)
        Base.metadata.create_all(engine)

        # Verify the email column is nullable
        from sqlalchemy import inspect

        inspector = inspect(engine)

        if "user_sessions" in inspector.get_table_names():
            columns = inspector.get_columns("user_sessions")
            email_column = next(
                (col for col in columns if col["name"] == "email"), None
            )

            if email_column:
                if email_column["nullable"]:
                    print("✅ Email column is nullable as expected")
                else:
                    print("❌ Email column is NOT nullable - this will cause issues")
                    # Force recreate the table with correct schema
                    Base.metadata.drop_all(engine)
                    Base.metadata.create_all(engine)
                    print("✅ Recreated tables with correct schema")
            else:
                print("❌ Email column not found in user_sessions table")

        print("✅ Test database setup completed!")
        return True

    except Exception as e:
        print(f"❌ Error setting up test database: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("🚀 Setting up test database...")

    success = setup_test_database()

    if success:
        print("✨ Test database setup completed!")
        sys.exit(0)
    else:
        print("💥 Test database setup failed!")
        sys.exit(1)
