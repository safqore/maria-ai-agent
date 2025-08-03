"""
Repository for UserSession model.

This module provides a repository class for the UserSession model,
isolating database operations from the service layer.
"""

import uuid
from typing import Any, Dict, List, Optional, Tuple, Union

from app.database_core import get_db_session
from app.errors import ServerError
from app.models import UserSession
from app.repositories.base_repository import BaseRepository
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session


class UserSessionRepository(BaseRepository[UserSession]):
    """
    Repository for UserSession-related database operations.

    This class provides an abstraction over the database operations
    for the UserSession model, making it easier to test and maintain.
    """

    def __init__(self):
        """Initialize with the UserSession model class."""
        super().__init__(UserSession)

    def get_by_uuid(self, session_uuid: uuid.UUID) -> Optional[UserSession]:
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

    def get(self, session_uuid: Union[str, uuid.UUID]) -> Optional[UserSession]:
        """
        Get a user session by UUID (string or UUID object).

        Args:
            session_uuid: The UUID of the session to retrieve (string or UUID)

        Returns:
            UserSession object if found, None otherwise

        Raises:
            ServerError: If a database error occurs
        """
        return self.get_by_id(session_uuid)

    def exists(
        self, session_uuid: Union[str, uuid.UUID], require_data: bool = False
    ) -> bool:
        """
        Check if a session with the given UUID exists.

        Args:
            session_uuid: The UUID to check
            require_data: If True, also check that the session has a name (meaningful data)

        Returns:
            True if the session exists (and has name if require_data=True), False otherwise

        Raises:
            ServerError: If a database error occurs
        """
        if not require_data:
            return super().exists(session_uuid)

        # Check existence AND meaningful data (name is required)
        try:
            with get_db_session() as session:
                # Convert string UUID to UUID object if needed
                converted_uuid = self._convert_uuid_if_needed(session_uuid)

                # Check if record exists and has meaningful data (name is not null/empty)
                record = (
                    session.query(self.model_class)
                    .filter(
                        self.model_class.uuid == converted_uuid,
                        self.model_class.name.isnot(None),
                        self.model_class.name != "",
                    )
                    .first()
                )
                return record is not None
        except SQLAlchemyError as e:
            raise ServerError(f"Database error in exists: {str(e)}")

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
        # Convert string UUID to UUID object
        uuid_obj = uuid.UUID(session_uuid)
        return self.create(
            uuid=uuid_obj,
            name=name,
            email=email,
            ip_address=ip_address,
            consent_user_data=consent_user_data,
        )

    def update_session(
        self, session_uuid: uuid.UUID, data: Dict[str, Any]
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
            return None

    def delete_session(self, session_uuid: uuid.UUID) -> bool:
        """
        Delete a user session.

        Args:
            session_uuid: The UUID of the session to delete

        Returns:
            True if the session was deleted, False if it didn't exist

        Raises:
            ServerError: If a database error occurs
        """
        try:
            return self.delete(session_uuid)
        except Exception as e:
            # Return False for NotFoundError to maintain backward compatibility
            return False

    def create_or_update_session(
        self,
        session_uuid: str,
        name: Optional[str] = None,
        email: Optional[str] = None,
        **kwargs,
    ) -> Tuple[UserSession, bool]:
        """
        Create a new session or update an existing one with partial information.

        Args:
            session_uuid: The UUID of the session
            name: Optional name to update
            email: Optional email to update
            kwargs: Additional optional fields

        Returns:
            Tuple of (UserSession, bool) where bool indicates if session was created (True) or updated (False)
        """
        try:
            with get_db_session() as db_session:
                # Convert UUID
                uuid_obj = uuid.UUID(session_uuid)

                # Find existing session
                existing_session = (
                    db_session.query(UserSession)
                    .filter(UserSession.uuid == uuid_obj)
                    .first()
                )

                if existing_session:
                    # Track whether we need to update
                    needs_update = False

                    # Update name if provided and different
                    if name is not None and (
                        not existing_session.name
                        or existing_session.name != name.strip()
                    ):
                        existing_session.name = name.strip()
                        needs_update = True

                    # Update email if provided and different
                    if email is not None and (
                        not existing_session.email
                        or existing_session.email != email.strip()
                    ):
                        existing_session.email = email.strip()
                        needs_update = True

                    # Update any additional fields
                    for key, value in kwargs.items():
                        if (
                            hasattr(existing_session, key)
                            and getattr(existing_session, key) != value
                        ):
                            setattr(existing_session, key, value)
                            needs_update = True

                    # Only commit if something actually changed
                    if needs_update:
                        db_session.add(existing_session)
                        db_session.commit()
                        db_session.refresh(existing_session)

                    # Detach the object from the session to avoid binding issues
                    db_session.expunge(existing_session)
                    return existing_session, False  # Updated existing session

                # Create new session if not exists
                # Ensure name is not None since it's required
                if not name or not name.strip():
                    raise ValueError("Name is required and cannot be empty")

                new_session = UserSession(
                    uuid=uuid_obj,
                    name=name.strip(),
                    email=email.strip() if email and email.strip() else None,
                    **kwargs,
                )

                db_session.add(new_session)
                db_session.commit()
                db_session.refresh(new_session)

                # Detach the object from the session to avoid binding issues
                db_session.expunge(new_session)
                return new_session, True  # Created new session

        except SQLAlchemyError as e:
            if "db_session" in locals():
                db_session.rollback()
            raise ValueError(f"Database error: {str(e)}")
