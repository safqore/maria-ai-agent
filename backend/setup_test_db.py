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

        # Get engine
        engine = get_engine()

        # Create all tables
        Base.metadata.create_all(engine)

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
