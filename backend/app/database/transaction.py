"""
Transaction context manager for database operations.

This module provides a context manager for database transactions,
ensuring proper handling of commits and rollbacks.
"""

import os
from typing import Optional

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

# Remove the local get_database_url function and always use the one from app.database


def get_engine():
    """Lazily create and return the SQLAlchemy engine using the correct database URL."""
    from app.database_core import get_engine as get_core_engine

    return get_core_engine()


def get_session_local():
    """Lazily create and return the session factory using the correct engine."""
    from app.database_core import get_session_local as get_core_session_local

    return get_core_session_local()


class TransactionContext:
    """
    Context manager for database transactions.

    This class ensures that database operations within a context are atomic,
    with proper commit and rollback handling.

    Examples:
        ```python
        # Using with an existing session
        session = SessionLocal()
        with TransactionContext(session) as tx_session:
            # Do operations with tx_session
            # Commits or rollbacks based on exceptions

        # Creating a new session automatically
        with TransactionContext() as session:
            # Do operations with session
            # Session is closed after the context
        ```
    """

    def __init__(self, session: Optional[Session] = None):
        """
        Initialize with optional session.

        Args:
            session: SQLAlchemy session to use. If None, a new session is created.
        """
        self.session = session or get_session_local()()
        self.should_close = session is None

    def __enter__(self) -> Session:
        """
        Begin transaction and return session.

        Returns:
            SQLAlchemy session for database operations
        """
        return self.session

    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Commit transaction if no exception, otherwise rollback.

        Args:
            exc_type: Exception type if an exception occurred, None otherwise
            exc_val: Exception value if an exception occurred, None otherwise
            exc_tb: Exception traceback if an exception occurred, None otherwise
        """
        try:
            if exc_type is not None:
                self.session.rollback()
            else:
                self.session.commit()
        finally:
            if self.should_close:
                self.session.close()
