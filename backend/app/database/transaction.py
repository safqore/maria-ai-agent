"""
Transaction manager for SQLAlchemy ORM.

This module provides a transaction manager for handling atomic database operations
that span multiple steps and potentially multiple repositories.
"""

from functools import wraps
import logging
from typing import Any, Callable, TypeVar

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from backend.app.database import SessionLocal
from backend.app.errors import ServerError

# Type variable for the return value of a transaction function
R = TypeVar('R')

logger = logging.getLogger(__name__)


class TransactionManager:
    """
    Transaction manager for coordinating database operations across repositories.
    
    This class provides a context manager and decorator for database transactions,
    ensuring that multiple database operations are performed atomically.
    """
    
    @staticmethod
    def transactional(func: Callable[..., R]) -> Callable[..., R]:
        """
        Decorator for functions that should be executed in a transaction.
        
        Args:
            func: The function to wrap in a transaction
            
        Returns:
            Wrapped function that executes in a transaction
            
        Raises:
            ServerError: If a database error occurs during the transaction
        """
        @wraps(func)
        def wrapper(*args, **kwargs):
            session = SessionLocal()
            try:
                # Add the session as a keyword argument
                kwargs['session'] = session
                
                # Call the function
                result = func(*args, **kwargs)
                
                # Commit the transaction
                session.commit()
                
                return result
            except Exception as e:
                # Rollback the transaction on error
                session.rollback()
                
                if isinstance(e, SQLAlchemyError):
                    logger.error(f"Database error in transaction: {str(e)}")
                    raise ServerError(f"Database error: {str(e)}")
                    
                # Re-raise other exceptions
                raise
            finally:
                session.close()
        
        return wrapper


# Create a singleton instance
transaction_manager = TransactionManager()


# Example usage:
# @transaction_manager.transactional
# def create_user_with_profile(user_data, profile_data, session=None):
#     """Creates a user and profile in a single transaction."""
#     # Use the provided session instead of creating a new one
#     user_repo = UserRepository()
#     profile_repo = ProfileRepository()
#     
#     # Create user
#     user = user_repo.create_with_session(session, **user_data)
#     
#     # Add user ID to profile data
#     profile_data['user_id'] = user.id
#     
#     # Create profile
#     profile = profile_repo.create_with_session(session, **profile_data)
#     
#     return user, profile
