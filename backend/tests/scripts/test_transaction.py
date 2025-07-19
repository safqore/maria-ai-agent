#!/usr/bin/env python3
"""
Test script for the TransactionContext.

This script tests the TransactionContext class to ensure
database transactions are properly handled.
"""
import sys
import traceback
from pathlib import Path

# Add the project directory to the Python path
project_dir = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(project_dir))

print("Starting transaction test...")

try:
    print("Importing directly from database.py...")
    from app.database_core import Base, get_db_session, get_engine, get_session_local

    print("Importing TransactionContext...")
    from app.database.transaction import TransactionContext
    from sqlalchemy import text

    print("Imports successful!")
except ImportError as e:
    print(f"Error during test: {e}")
    traceback.print_exc()
    sys.exit(1)


def test_transaction_context():
    """Test the transaction context manager."""
    print("Testing TransactionContext...")

    try:
        # Test auto commit
        with TransactionContext() as session:
            print("  - Created TransactionContext with auto-generated session")
            # Execute a simple query to verify connection
            result = session.execute(text("SELECT 1")).fetchone()
            print(f"  - Test query result: {result}")
        print("  - Transaction context exited successfully")

        # Test with existing session
        print("Creating a session manually...")
        manual_session = get_session_local()
        with TransactionContext(manual_session) as session:
            print("  - Created TransactionContext with provided session")
            # Execute a simple query to verify connection
            result = session.execute(text("SELECT 2")).fetchone()
            print(f"  - Test query result: {result}")
        print("  - Transaction context exited successfully")
        manual_session.close()

        # Test rollback on exception
        print("Testing rollback behavior...")
        try:
            with TransactionContext() as session:
                print("  - Created TransactionContext for rollback test")
                # Execute a query that will raise an exception
                session.execute(text("SELECT invalid_column"))
                print("  - This should not be printed")
        except Exception as e:
            print(f"  - Expected exception caught: {type(e).__name__}")
            print("  - Rollback should have occurred")

        print("All transaction tests passed!")
        return 0

    except Exception as e:
        print(f"Error in transaction test: {e}")
        traceback.print_exc()
        return 1
    """Test the TransactionContext for proper transaction handling."""
    try:
        print("Testing TransactionContext...")

        # Test with explicit session
        session = get_session_local()
        print("Session created successfully.")

        with TransactionContext(session) as tx_session:
            # Execute a simple query
            result = tx_session.execute(text("SELECT 1")).fetchone()
            print(f"Query result with explicit session: {result}")

        print("Transaction completed successfully with explicit session.")

        # Test with implicit session
        with TransactionContext() as tx_session:
            # Execute a simple query
            result = tx_session.execute(text("SELECT 2")).fetchone()
            print(f"Query result with implicit session: {result}")

        print("Transaction completed successfully with implicit session.")

        # Test rollback on exception
        success = False
        try:
            with TransactionContext() as tx_session:
                # Execute a simple query
                tx_session.execute(text("SELECT 1"))
                print("Raising exception to test rollback...")
                raise ValueError("Test exception")
        except ValueError:
            success = True

        if success:
            print("Rollback on exception worked correctly.")
        else:
            print("Error: Exception was not raised as expected!")
            return 1

        print("All transaction tests passed!")
        return 0

    except Exception as e:
        print(f"Error testing transaction context: {e}")
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(test_transaction_context())
    sys.exit(test_transaction_context())
