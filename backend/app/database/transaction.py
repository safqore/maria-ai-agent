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


# Create engine and session factory directly to avoid circular imports
def get_database_url():
    """Create database URL from environment variables."""
    db_user = os.getenv("POSTGRES_USER", "postgres")
    db_password = os.getenv("POSTGRES_PASSWORD", "postgres")
    db_host = os.getenv("POSTGRES_HOST", "localhost")
    db_port = os.getenv("POSTGRES_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB", "maria_ai")

    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"


# Create session factory - we need this for the TransactionContext
_engine = create_engine(
    get_database_url(), pool_pre_ping=True, pool_recycle=3600, echo=False
)

# Create session factory directly here
_SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


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
        self.session = session or _SessionLocal()
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
