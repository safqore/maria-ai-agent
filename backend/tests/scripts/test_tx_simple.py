#!/usr/bin/env python3
"""
Simple test for the TransactionContext.

This script tests the TransactionContext class without relying on
the rest of the application structure.
"""
import sys
from pathlib import Path

# Add the project root to the Python path
project_dir = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(project_dir))

print("Starting simple transaction test...")

try:
    print("Importing directly from transaction.py...")

    # Import the dependencies explicitly to avoid other imports
    from app.database.transaction import (
        TransactionContext,
        get_engine,
        get_session_local,
    )
    from app.database_core import get_database_url

    # Print database URL (with password masked)
    db_url = get_database_url()
    masked_url = db_url.replace(db_url.split("@")[0].split(":")[2], "****")
    print(f"Database URL: {masked_url}")

    print("Creating test session...")
    # Create a session and test TransactionContext
    try:
        session_factory = get_session_local()
        session = session_factory()
        print("Session created successfully")

        # Test basic transaction operations
        with TransactionContext(session) as tx_session:
            print("Inside transaction context with provided session")
            # Just test that we can execute a query
            result = tx_session.execute("SELECT 1").scalar()
            print(f"Query result: {result}")

        # Test with auto-created session
        with TransactionContext() as auto_session:
            print("Inside transaction context with auto-created session")
            # Just test that we can execute a query
            result = auto_session.execute("SELECT 1").scalar()
            print(f"Query result: {result}")

        print("Transaction tests completed successfully!")
    except Exception as e:
        print(f"Database connection error: {e}")

except Exception as e:
    print(f"Error during transaction test: {e}")
    import traceback

    traceback.print_exc()
    sys.exit(1)
