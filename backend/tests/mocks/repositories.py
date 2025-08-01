"""
Mock repository module for testing with SQLite.

This module provides patched versions of repositories that work with SQLite's
limitations, particularly for UUID handling.
"""

import uuid
from typing import Any, Dict, List, Optional, Tuple

from app.errors import ResourceNotFoundError, ServerError
from sqlalchemy.exc import SQLAlchemyError
from tests.mocks.database import get_db_session
from tests.mocks.models import UserSession


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

                # If we found a result, create a detached copy to avoid DetachedInstanceError
                if result:
                    # Create a new detached object with all the attributes
                    detached_result = UserSession(
                        uuid=str(result.uuid) if result.uuid else None,
                        name=result.name,
                        email=result.email,
                        is_email_verified=result.is_email_verified,
                        consent_user_data=result.consent_user_data,
                        ip_address=result.ip_address,
                        created_at=result.created_at,
                        updated_at=result.updated_at,
                    )
                    return detached_result
                return result
        except SQLAlchemyError as e:
            raise ServerError(f"Database error in get_by_uuid: {str(e)}")

    def get(self, session_uuid: str) -> Optional[UserSession]:
        """
        Get a user session by UUID (alias for get_by_uuid for compatibility).

        Args:
            session_uuid: The UUID of the session to retrieve (string or UUID object)

        Returns:
            UserSession object if found, None otherwise

        Raises:
            ServerError: If a database error occurs
        """
        return self.get_by_uuid(session_uuid)

    def exists(self, session_uuid: str, require_data: bool = False) -> bool:
        """
        Check if a session with the given UUID exists.

        Args:
            session_uuid: The UUID to check (string or UUID object)
            require_data: If True, also check that the session has a name (meaningful data)

        Returns:
            True if the session exists (and has name if require_data=True), False otherwise

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
                query = db_session.query(UserSession).filter(
                    UserSession.uuid == uuid_object
                )

                # If require_data is True, also check that the session has a name
                if require_data:
                    query = query.filter(
                        UserSession.name.isnot(None), UserSession.name != ""
                    )

                result = query.first()
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
                detached_session = UserSession(
                    uuid=uuid_value, **{k: v for k, v in kwargs.items() if k != "uuid"}
                )

                # Ensure all attributes are properly set on the detached object
                for key, value in kwargs.items():
                    if key != "uuid" and hasattr(detached_session, key):
                        setattr(detached_session, key, value)

                return detached_session
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
