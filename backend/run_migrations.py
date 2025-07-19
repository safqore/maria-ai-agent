#!/usr/bin/env python3
"""
Database migration runner for Maria AI Agent.

This script runs database migrations in the correct order and verifies
the database setup. It can be used both in CI environments and locally.

Usage:
    python run_migrations.py [--verify-only] [--reset]

Options:
    --verify-only    Only verify the database setup, don't run migrations
    --reset          Drop all tables before running migrations
"""

import argparse
import os
import sys
from pathlib import Path
from typing import Any, Dict, List

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

import app.models  # Import to register models
from app.database_core import Base, get_database_url, get_engine, init_database
from sqlalchemy import inspect, text


def get_migration_files() -> List[Path]:
    """Get all migration files in the correct order."""
    migrations_dir = backend_dir / "migrations"

    # Define migration files in the correct order
    migration_files = [
        "001_create_user_sessions.sql",
        "002_create_email_verification.sql",
        "003_add_performance_indexes.sql",
    ]

    # Check if all migration files exist
    existing_files = []
    for filename in migration_files:
        file_path = migrations_dir / filename
        if file_path.exists():
            existing_files.append(file_path)
        else:
            print(f"Warning: Migration file {filename} not found")

    return existing_files


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
                    conn.execute(text(statement))
                    conn.commit()

        print(f"✅ Migration {migration_file.name} completed successfully")
        return True

    except Exception as e:
        print(f"❌ Migration {migration_file.name} failed: {e}")
        return False


def verify_database_setup(engine) -> Dict[str, Any]:
    """Verify the database setup and return status information."""
    print("Verifying database setup...")

    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        # Required tables
        required_tables = ["user_sessions"]
        missing_tables = [t for t in required_tables if t not in tables]

        # Check if tables have the expected columns
        table_info = {}
        for table in tables:
            columns = inspector.get_columns(table)
            table_info[table] = [col["name"] for col in columns]

        result = {
            "success": len(missing_tables) == 0,
            "tables": tables,
            "missing_tables": missing_tables,
            "table_info": table_info,
            "database_url": get_database_url(),
        }

        if result["success"]:
            print("✅ Database setup verification passed")
            print(f"Found tables: {', '.join(tables)}")
        else:
            print("❌ Database setup verification failed")
            print(f"Missing tables: {', '.join(missing_tables)}")

        return result

    except Exception as e:
        print(f"❌ Database verification failed: {e}")
        return {"success": False, "error": str(e)}


def reset_database(engine):
    """Drop all tables to reset the database."""
    print("Resetting database (dropping all tables)...")

    try:
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        print("✅ Database reset completed")

    except Exception as e:
        print(f"❌ Database reset failed: {e}")
        raise


def main():
    parser = argparse.ArgumentParser(description="Run database migrations")
    parser.add_argument(
        "--verify-only", action="store_true", help="Only verify database setup"
    )
    parser.add_argument(
        "--reset", action="store_true", help="Reset database before running migrations"
    )

    args = parser.parse_args()

    print("=== Database Migration Runner ===")
    print(f"Database URL: {get_database_url()}")

    # Initialize database connection
    try:
        init_database()
        engine = get_engine()
        print("✅ Database connection established")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        sys.exit(1)

    # Reset database if requested
    if args.reset:
        reset_database(engine)

    # Verify-only mode
    if args.verify_only:
        result = verify_database_setup(engine)
        sys.exit(0 if result["success"] else 1)

    # Check if we're using PostgreSQL (migrations are SQL files)
    # or SQLite (we'll use ORM)
    db_url = get_database_url()
    is_postgres = db_url.startswith("postgresql://")
    is_sqlite = db_url.startswith("sqlite://")

    if is_postgres:
        print("Using PostgreSQL - running SQL migrations...")

        # Get migration files
        migration_files = get_migration_files()

        if not migration_files:
            print("No migration files found!")
            sys.exit(1)

        # Run migrations
        success = True
        for migration_file in migration_files:
            if not run_sql_migration(engine, migration_file):
                success = False
                break

        if not success:
            print("❌ Migration failed")
            sys.exit(1)

    elif is_sqlite:
        print("Using SQLite - running ORM migrations...")

        # For SQLite, use ORM to create tables
        try:
            Base.metadata.create_all(bind=engine)
            print("✅ SQLite tables created with ORM")
        except Exception as e:
            print(f"❌ SQLite table creation failed: {e}")
            sys.exit(1)

    else:
        print(f"❌ Unsupported database type: {db_url}")
        sys.exit(1)

    # Verify the final setup
    result = verify_database_setup(engine)

    if result["success"]:
        print("\n🎉 Database migration completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Database migration verification failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
