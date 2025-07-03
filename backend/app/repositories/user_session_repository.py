"""
Repository for UserSession model.

This module provides a repository class for the UserSession model,
isolating database operations from the service layer.
"""

import uuid
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from backend.app.database import get_db_session
from backend.app.errors import ServerError
from backend.app.models import UserSession
from backend.app.repositories.base_repository import BaseRepository


class UserSessionRepository(BaseRepository[UserSession]):
    """
    Repository for UserSession-related database operations.

    This class provides an abstraction over the database operations
    for the UserSession model, making it easier to test and maintain.
    """

    def __init__(self):
        """Initialize with the UserSession model class."""
        super().__init__(UserSession)

    def get_by_uuid(self, session_uuid: str) -> Optional[UserSession]:
        """
        Get a user session by UUID.

        Args:
            session_uuid: The UUID of the session to retrieve

        Returns:
            UserSession object if found, None otherwise

        Raises:
            ServerError: If a database error occurs
        """
        return self.get_by_id(session_uuid)

    def exists(self, session_uuid: str) -> bool:
        """
        Check if a session with the given UUID exists.

        Args:
            session_uuid: The UUID to check

        Returns:
            True if the session exists, False otherwise

        Raises:
            ServerError: If a database error occurs
        """
        return super().exists(session_uuid)

    def create_session(
        self,
        session_uuid: str,
        name: str = "",
        email: str = "",
        ip_address: Optional[str] = None,
        consent_user_data: bool = False,
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
        return self.create(
            uuid=session_uuid,
            name=name,
            email=email,
            ip_address=ip_address,
            consent_user_data=consent_user_data,
        )

    def update_session(
        self, session_uuid: str, data: Dict[str, Any]
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
            NotFoundError: If the session does not exist
        """
        try:
            return self.update(session_uuid, data)
        except Exception as e:
            # Return None for NotFoundError to maintain backward compatibility
            if hasattr(e, "name") and e.name == "NotFoundError":
                return None
            raise

    def delete_session(self, session_uuid: str) -> bool:
        """
        Delete a user session.

        Args:
            session_uuid: The UUID of the session to delete

        Returns:
            True if the session was deleted, False if not found

        Raises:
            ServerError: If a database error occurs
        """
        return self.delete(session_uuid)
