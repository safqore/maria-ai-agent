"""
Example implementation of integrating TransactionContext with services.

This file demonstrates how to use the TransactionContext with service methods
to ensure proper transaction management.
"""

import logging
from backend.app.database.transaction import TransactionContext
from backend.app.repositories.factory import get_user_session_repository
from backend.app.models import UserSession

# Configure logger
logger = logging.getLogger(__name__)


class SessionServiceExample:
    """
    Example service class showing TransactionContext integration.
    
    This is a reference implementation showing how to use the TransactionContext
    with service methods to ensure proper transaction handling.
    """
    
    def create_user_session(self, session_data: dict) -> UserSession:
        """
        Create a new user session with transaction support.
        
        Args:
            session_data (dict): Session data to create
            
        Returns:
            UserSession: Created session object
            
        Raises:
            Exception: If session creation fails
        """
        with TransactionContext() as tx:
            try:
                # Get repository with transaction session
                repo = get_user_session_repository(session=tx.session)
                
                # Create session object
                session = UserSession(**session_data)
                
                # Save to database
                created_session = repo.create(session)
                
                # TransactionContext will automatically commit if no exception occurs
                logger.info(f"Created session {created_session.uuid}")
                return created_session
                
            except Exception as e:
                # Log error
                logger.error(f"Failed to create session: {str(e)}")
                
                # Re-raise exception - TransactionContext will handle rollback
                raise
                
    def update_user_session(self, session_uuid: str, update_data: dict) -> UserSession:
        """
        Update an existing user session with transaction support.
        
        Args:
            session_uuid (str): UUID of session to update
            update_data (dict): Data to update
            
        Returns:
            UserSession: Updated session object
            
        Raises:
            Exception: If session update fails
        """
        with TransactionContext() as tx:
            try:
                # Get repository with transaction session
                repo = get_user_session_repository(session=tx.session)
                
                # Get existing session
                session = repo.get_by_uuid(session_uuid)
                
                if not session:
                    raise ValueError(f"Session {session_uuid} not found")
                
                # Update fields
                for key, value in update_data.items():
                    if hasattr(session, key):
                        setattr(session, key, value)
                
                # Save changes
                updated_session = repo.update(session)
                
                # TransactionContext will automatically commit if no exception occurs
                logger.info(f"Updated session {updated_session.uuid}")
                return updated_session
                
            except Exception as e:
                # Log error
                logger.error(f"Failed to update session: {str(e)}")
                
                # Re-raise exception - TransactionContext will handle rollback
                raise
