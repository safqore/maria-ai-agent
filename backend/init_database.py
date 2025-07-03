#!/usr/bin/env python3
"""
Simple database initialization script to create tables for testing.
This script creates the user_sessions table with all required columns.
"""

import os
import sys
from pathlib import Path

# Add the current directory to Python path to allow imports
sys.path.insert(0, str(Path(__file__).parent))

def create_database_tables():
    """Create database tables using SQLAlchemy models."""
    try:
        # Import database components
        from app.database_core import get_engine, Base
        from app import models  # This ensures models are registered
        
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

def set_sqlite_fallback():
    """Set up SQLite fallback for testing."""
    from app.database_core import set_database_url
    
    # Use SQLite for testing
    sqlite_path = Path(__file__).parent / "maria_ai_test.db"
    sqlite_url = f"sqlite:///{sqlite_path}"
    
    print(f"Setting up SQLite fallback: {sqlite_url}")
    set_database_url(sqlite_url)

if __name__ == "__main__":
    print("🚀 Initializing database tables...")
    
    # Set up SQLite fallback for testing
    set_sqlite_fallback()
    
    # Create tables
    success = create_database_tables()
    
    if success:
        print("✨ Database initialization completed!")
        sys.exit(0)
    else:
        print("💥 Database initialization failed!")
        sys.exit(1) 