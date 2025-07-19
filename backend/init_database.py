#!/usr/bin/env python3
"""
Database initialization script for Maria AI Agent.

This script sets up the database using Alembic migrations and creates
tables for testing and development environments.
"""

import os
import sys
from pathlib import Path

# Add the current directory to Python path to allow imports
sys.path.insert(0, str(Path(__file__).parent))


def setup_sqlite_test_db():
    """Set up SQLite test database with proper configuration."""
    try:
        # Import database components
        from app import models  # This ensures models are registered
        from app.database_core import Base, get_engine, set_database_url

        # Use SQLite for testing
        sqlite_path = Path(__file__).parent / "maria_ai_test.db"
        sqlite_url = f"sqlite:///{sqlite_path}"

        print(f"Setting up SQLite test database: {sqlite_url}")
        set_database_url(sqlite_url)

        # Get engine
        engine = get_engine()

        print(f"Creating tables using database URL: {engine.url}")

        # Create all tables
        Base.metadata.create_all(engine)

        print("✅ Database tables created successfully!")
        return True

    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback

        traceback.print_exc()
        return False


def run_alembic_migrations():
    """Run Alembic migrations to ensure database schema is up to date."""
    try:
        import subprocess

        print("Running Alembic migrations...")

        # Run alembic upgrade head
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True,
        )

        if result.returncode == 0:
            print("✅ Alembic migrations completed successfully!")
            return True
        else:
            print(f"❌ Alembic migrations failed: {result.stderr}")
            return False

    except FileNotFoundError:
        print("⚠️  Alembic not found, skipping migrations")
        return True
    except Exception as e:
        print(f"❌ Error running Alembic migrations: {e}")
        return False


def create_database_tables():
    """Create database tables using SQLAlchemy models."""
    try:
        # Import database components
        from app import models  # This ensures models are registered
        from app.database_core import Base, get_engine

        # Get engine
        engine = get_engine()

        print(f"Creating tables using database URL: {engine.url}")

        # Create all tables
        Base.metadata.create_all(engine)

        print("✅ Database tables created successfully!")
        return True

    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("🚀 Initializing database...")

    # Set up SQLite test database
    success = setup_sqlite_test_db()

    if success:
        # Try to run Alembic migrations
        migration_success = run_alembic_migrations()

        if migration_success:
            print("✨ Database initialization completed!")
            sys.exit(0)
        else:
            print("⚠️  Database initialized but migrations failed")
            sys.exit(1)
    else:
        print("💥 Database initialization failed!")
        sys.exit(1)
