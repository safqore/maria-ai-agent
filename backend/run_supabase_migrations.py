#!/usr/bin/env python3
"""
Run migrations on Supabase database using DATABASE_URL.
"""

import os
import sys
from pathlib import Path
from sqlalchemy import create_engine, text

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from config import Config

def run_sql_migration(engine, migration_file: Path) -> bool:
    """Run a single SQL migration file."""
    print(f"Running migration: {migration_file.name}")

    try:
        with open(migration_file, "r") as f:
            sql_content = f.read()

        # Split SQL content by semicolon and execute each statement
        statements = [stmt.strip() for stmt in sql_content.split(";") if stmt.strip()]

        with engine.connect() as conn:
            for statement in statements:
                if statement:
                    print(f"Executing: {statement[:50]}...")
                    conn.execute(text(statement))
                    conn.commit()

        print(f"✅ Migration {migration_file.name} completed successfully")
        return True

    except Exception as e:
        print(f"❌ Migration {migration_file.name} failed: {e}")
        return False

def main():
    print("=== Supabase Migration Runner ===")
    
    # Get the database URL from config
    db_url = Config.get_database_url()
    print(f"Database URL: {db_url}")
    
    if not db_url.startswith("postgresql://"):
        print("❌ Not a PostgreSQL database URL")
        sys.exit(1)
    
    # Create engine
    engine = create_engine(db_url)
    
    # Test connection
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)
    
    # Define migration files for PostgreSQL
    migration_files = [
        "001_create_user_sessions_postgresql.sql",
        "002_create_email_verification.sql",
        "003_add_performance_indexes.sql",
        "004_allow_null_email_postgresql.sql",
    ]
    
    # Run migrations
    success = True
    for filename in migration_files:
        file_path = backend_dir / "migrations" / filename
        if file_path.exists():
            if not run_sql_migration(engine, file_path):
                success = False
                break
        else:
            print(f"Warning: Migration file {filename} not found")
    
    if success:
        print("\n🎉 All migrations completed successfully!")
        
        # Verify tables exist
        with engine.connect() as conn:
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result]
            print(f"Tables in database: {tables}")
    else:
        print("\n❌ Migration failed")
        sys.exit(1)

if __name__ == "__main__":
    main() 