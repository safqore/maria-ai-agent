#!/usr/bin/env python3
"""Simple database setup script."""

import importlib.util
import os
import sys
from pathlib import Path

# Add current directory and parent directory to path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))
sys.path.insert(0, str(current_dir.parent))


def setup_database():
    """Setup database tables."""
    try:
        # Import the specific database.py file
        database_py_path = current_dir / "app" / "database.py"
        spec = importlib.util.spec_from_file_location("database", database_py_path)
        db_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(db_module)

        # Set up SQLite for testing
        sqlite_path = Path(__file__).parent / "test_maria.db"
        db_module.set_database_url(f"sqlite:///{sqlite_path}")

        # Import and create tables
        from app import models

        engine = db_module.get_engine()
        print(f"Creating tables in: {engine.url}")

        # Create all tables
        db_module.Base.metadata.create_all(engine)
        print("✅ Tables created successfully!")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    setup_database()
