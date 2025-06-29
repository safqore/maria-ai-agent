"""
Mocked Transaction context manager for database operations in tests.

This module provides a context manager for database transactions in tests,
ensuring proper handling of commits and rollbacks in SQLite.
"""

from contextlib import contextmanager
from typing import Iterator
from sqlalchemy.orm import Session
from backend.tests.mocks.database import get_db_session

class TransactionContext:
    """
    Context manager for database transactions using SQLite.
    
    This class provides a simple way to manage database transactions,
    ensuring that they are properly committed or rolled back.
    """
    
    def __init__(self):
        """Initialize the transaction context."""
        self.session = None
        
    def __enter__(self) -> Session:
        """
        Begin a database transaction.
        
        Returns:
            Session: The database session.
        """
        self.session = next(get_db_session())
        return self.session
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        End a database transaction.
        
        If an exception occurred, roll back the transaction.
        Otherwise, commit the transaction.
        
        Args:
            exc_type: The exception type, if any.
            exc_val: The exception value, if any.
            exc_tb: The exception traceback, if any.
            
        Returns:
            bool: Whether the exception was handled.
        """
        if exc_type is not None:
            # If an exception occurred, roll back
            if self.session is not None:
                self.session.rollback()
        else:
            # Otherwise, commit
            if self.session is not None:
                self.session.commit()
                
        # Always close the session
        if self.session is not None:
            self.session.close()
            
        # Don't handle the exception
        return False
