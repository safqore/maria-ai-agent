"""
Repository for UserSession model.

This module provides a repository class for the UserSession model,
isolating database operations from the service layer.
"""

import uuid
from typing import List, Optional, Dict, Any, Tuple

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db_session
from app.models import UserSession
from app.errors import ServerError


class UserSessionRepository:
    """
    Repository for UserSession-related database operations.
    
    This class provides an abstraction over the database operations
    for the UserSession model, making it easier to test and maintain.
    """
    
    @staticmethod
    def get_by_uuid(session_uuid: str) -> Optional[UserSession]:
        """
        Get a user session by UUID.
        
        Args:
            session_uuid: The UUID of the session to retrieve
            
        Returns:
            UserSession object if found, None otherwise
            
        Raises:
            ServerError: If a database error occurs
        """
        try:
            with get_db_session() as session:
                return session.query(UserSession).filter(
                    UserSession.uuid == session_uuid
                ).first()
        except SQLAlchemyError as e:
            raise ServerError(f"Database error: {str(e)}")
            
    @staticmethod
    def exists(session_uuid: str) -> bool:
        """
        Check if a session with the given UUID exists.
        
        Args:
            session_uuid: The UUID to check
            
        Returns:
            True if the session exists, False otherwise
            
        Raises:
            ServerError: If a database error occurs
        """
        try:
            with get_db_session() as session:
                return session.query(
                    session.query(UserSession).filter(
                        UserSession.uuid == session_uuid
                    ).exists()
                ).scalar()
        except SQLAlchemyError as e:
            raise ServerError(f"Database error: {str(e)}")
            
    @staticmethod
    def create(
        session_uuid: str, 
        name: str = "", 
        email: str = "", 
        ip_address: Optional[str] = None,
        consent_user_data: bool = False
    ) -> UserSession:
        """
        Create a new user session.
        
        Args:
            session_uuid: The UUID for the session
            name: The user's name
            email: The user's email
            ip_address: The user's IP address
            consent_user_data: Whether the user consented to data collection
            
        Returns:
            The created UserSession
            
        Raises:
            ServerError: If a database error occurs
        """
        try:
            with get_db_session() as session:
                user_session = UserSession(
                    uuid=session_uuid,
                    name=name,
                    email=email,
                    ip_address=ip_address,
                    consent_user_data=consent_user_data
                )
                session.add(user_session)
                session.commit()
                session.refresh(user_session)
                return user_session
        except SQLAlchemyError as e:
            raise ServerError(f"Database error: {str(e)}")
            
    @staticmethod
    def update(
        session_uuid: str, 
        data: Dict[str, Any]
    ) -> Optional[UserSession]:
        """
        Update a user session.
        
        Args:
            session_uuid: The UUID of the session to update
            data: Dictionary with fields to update
            
        Returns:
            The updated UserSession if found, None otherwise
            
        Raises:
            ServerError: If a database error occurs
        """
        try:
            with get_db_session() as session:
                user_session = session.query(UserSession).filter(
                    UserSession.uuid == session_uuid
                ).first()
                
                if not user_session:
                    return None
                    
                for key, value in data.items():
                    if hasattr(user_session, key):
                        setattr(user_session, key, value)
                        
                session.commit()
                session.refresh(user_session)
                return user_session
        except SQLAlchemyError as e:
            raise ServerError(f"Database error: {str(e)}")
    
    @staticmethod
    def delete(session_uuid: str) -> bool:
        """
        Delete a user session.
        
        Args:
            session_uuid: The UUID of the session to delete
            
        Returns:
            True if the session was deleted, False if not found
            
        Raises:
            ServerError: If a database error occurs
        """
        try:
            with get_db_session() as session:
                user_session = session.query(UserSession).filter(
                    UserSession.uuid == session_uuid
                ).first()
                
                if not user_session:
                    return False
                    
                session.delete(user_session)
                session.commit()
                return True
        except SQLAlchemyError as e:
            raise ServerError(f"Database error: {str(e)}")
