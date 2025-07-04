"""
Mock repository module for testing with SQLite.

This module provides patched versions of repositories that work with SQLite's
limitations, particularly for UUID handling.
"""

import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy.exc import SQLAlchemyError

from app.errors import ResourceNotFoundError, ServerError
from backend.tests.mocks.database import get_db_session
from backend.tests.mocks.models import UserSession


class UserSessionRepository:
    """
    Repository for UserSession-related database operations for testing.

    This class provides an abstraction over the database operations
    for the UserSession model, making it easier to test with SQLite.
    """

    def get_by_uuid(self, session_uuid: str) -> Optional[UserSession]:
        """
        Get a user session by UUID.

        Args:
            session_uuid: The UUID of the session to retrieve (string or UUID object)

        Returns:
            UserSession object if found, None otherwise

        Raises:
            ServerError: If a database error occurs
        """
        try:
            with get_db_session() as session:
                # Convert string to UUID if it's a string
                if isinstance(session_uuid, str):
                    try:
                        session_uuid = uuid.UUID(session_uuid)
                    except ValueError:
                        print(
                            f"Warning: Invalid UUID format in get_by_uuid: {session_uuid}"
                        )
                        # If invalid UUID format, return None
                        return None
                elif not isinstance(session_uuid, uuid.UUID):
                    # If not a string or UUID, try to convert
                    try:
                        session_uuid = uuid.UUID(str(session_uuid))
                    except (ValueError, TypeError):
                        print(f"Warning: Cannot convert to UUID: {session_uuid}")
                        return None

                # Query with proper UUID object
                result = (
                    session.query(UserSession)
                    .filter(UserSession.uuid == session_uuid)
                    .first()
                )

                # If that fails, try alternative approaches
                if result is None:
                    # Try with string representation as fallback
                    try:
                        result = (
                            session.query(UserSession)
                            .filter(UserSession.uuid == str(session_uuid))
                            .first()
                        )
                    except Exception:
                        pass

                    # If still not found, try direct query by primary key
                    if result is None:
                        try:
                            result = session.get(UserSession, session_uuid)
                        except Exception:
                            pass

                return result
        except SQLAlchemyError as e:
            raise ServerError(f"Database error in get_by_uuid: {str(e)}")

    def exists(self, session_uuid: str) -> bool:
        """
        Check if a session with the given UUID exists.

        Args:
            session_uuid: The UUID to check (string or UUID object)

        Returns:
            True if the session exists, False otherwise

        Raises:
            ServerError: If a database error occurs
        """
        try:
            if session_uuid is None:
                return False

            # Convert string UUID to UUID object if necessary
            uuid_object = session_uuid
            if isinstance(session_uuid, str):
                try:
                    uuid_object = uuid.UUID(session_uuid)
                except ValueError:
                    print(f"Invalid UUID format in exists check: {session_uuid}")
                    return False

            # Use database session directly for more reliable check in tests
            with get_db_session() as db_session:
                result = (
                    db_session.query(UserSession)
                    .filter(UserSession.uuid == uuid_object)
                    .first()
                )
                return result is not None

        except SQLAlchemyError as e:
            raise ServerError(f"Database error in exists: {str(e)}")
        except Exception as e:
            print(f"Unexpected error in exists: {str(e)}")
            return False

    def create(self, **kwargs) -> UserSession:
        """
        Create a new user session.

        Args:
            **kwargs: Fields for the new user session

        Returns:
            The created UserSession object

        Raises:
            ServerError: If a database error occurs
        """
        try:
            with get_db_session() as session:
                # Generate a UUID if not provided
                if "uuid" not in kwargs or kwargs["uuid"] is None:
                    kwargs["uuid"] = uuid.uuid4()

                # Convert string UUID to UUID object if provided as string
                if isinstance(kwargs["uuid"], str):
                    try:
                        kwargs["uuid"] = uuid.UUID(kwargs["uuid"])
                    except ValueError:
                        print(
                            f"Warning: Invalid UUID format in create: {kwargs['uuid']}"
                        )
                        # Generate a new UUID instead of failing
                        kwargs["uuid"] = uuid.uuid4()
                elif not isinstance(kwargs["uuid"], uuid.UUID):
                    # If not a string or UUID, try to convert
                    try:
                        kwargs["uuid"] = uuid.UUID(str(kwargs["uuid"]))
                    except (ValueError, TypeError):
                        print(f"Warning: Cannot convert to UUID: {kwargs['uuid']}")
                        kwargs["uuid"] = uuid.uuid4()

                # Create user session with safe UUID
                user_session = UserSession(**kwargs)
                session.add(user_session)
                session.commit()

                # Extract UUID before the session is closed
                uuid_value = str(user_session.uuid) if user_session.uuid else None

                # Create a new UserSession object that's not attached to any session
                # This prevents DetachedInstanceError when the session is closed
                return UserSession(
                    uuid=uuid_value, **{k: v for k, v in kwargs.items() if k != "uuid"}
                )
        except SQLAlchemyError as e:
            raise ServerError(f"Database error in create: {str(e)}")
        except Exception as e:
            raise ServerError(f"Error creating user session: {str(e)}")

    def update(self, session_uuid: str, **kwargs) -> Optional[UserSession]:
        """
        Update an existing user session.

        Args:
            session_uuid: The UUID of the session to update
            **kwargs: Fields to update

        Returns:
            Updated UserSession object if found, None otherwise

        Raises:
            ServerError: If a database error occurs
        """
        try:
            with get_db_session() as session:
                # Convert string to UUID if it's a string
                if isinstance(session_uuid, str):
                    try:
                        session_uuid = uuid.UUID(session_uuid)
                    except ValueError:
                        # If invalid UUID format, return None
                        return None

                user_session = (
                    session.query(UserSession)
                    .filter(UserSession.uuid == session_uuid)
                    .first()
                )
                if not user_session:
                    return None

                for key, value in kwargs.items():
                    if hasattr(user_session, key):
                        setattr(user_session, key, value)

                session.commit()
                session.refresh(user_session)
                return user_session
        except SQLAlchemyError as e:
            raise ServerError(f"Database error in update: {str(e)}")

    def delete(self, session_uuid: str) -> bool:
        """
        Delete a user session.

        Args:
            session_uuid: The UUID of the session to delete

        Returns:
            True if deleted, False if not found

        Raises:
            ServerError: If a database error occurs
        """
        try:
            with get_db_session() as session:
                # Convert string to UUID if it's a string
                if isinstance(session_uuid, str):
                    try:
                        session_uuid = uuid.UUID(session_uuid)
                    except ValueError:
                        # If invalid UUID format, return False
                        return False

                user_session = (
                    session.query(UserSession)
                    .filter(UserSession.uuid == session_uuid)
                    .first()
                )
                if not user_session:
                    return False

                session.delete(user_session)
                session.commit()
                return True
        except SQLAlchemyError as e:
            raise ServerError(f"Database error in delete: {str(e)}")
