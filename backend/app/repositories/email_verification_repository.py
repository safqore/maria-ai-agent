"""
Email Verification Repository for managing email verification records.

This repository extends the BaseRepository pattern to provide email verification
specific database operations with proper session management and cleanup.
"""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Optional

from app.database_core import get_db_session
from app.models import UserSession
from app.repositories.base_repository import BaseRepository
from sqlalchemy import and_


class EmailVerificationRepository(BaseRepository[UserSession]):
    """
    Repository for email verification operations.

    Extends BaseRepository to provide email verification specific methods
    while maintaining consistency with the established repository pattern.
    """

    def __init__(self):
        super().__init__(UserSession)

    def get_by_session_id(self, session_id: str) -> Optional[UserSession]:
        """
        Get user session by session ID for email verification operations.

        Args:
            session_id: The session UUID as string

        Returns:
            UserSession instance if found, None otherwise
        """
        try:
            session_uuid = uuid.UUID(session_id)
        except ValueError:
            return None

        with get_db_session() as session:
            user_session = (
                session.query(UserSession).filter_by(uuid=session_uuid).first()
            )
            if user_session:
                session.expunge(user_session)
            return user_session

    def update_verification_code(
        self, session_id: str, code: str, expires_at: datetime
    ) -> bool:
        """
        Update verification code for a session.

        Args:
            session_id: The session UUID as string
            code: 6-digit verification code
            expires_at: When the code expires

        Returns:
            True if updated successfully, False otherwise
        """
        try:
            session_uuid = uuid.UUID(session_id)
        except ValueError:
            return False

        with get_db_session() as session:
            user_session = (
                session.query(UserSession).filter_by(uuid=session_uuid).first()
            )

            if not user_session:
                return False

            user_session.verification_code = code
            user_session.verification_expires_at = expires_at
            user_session.verification_attempts = 0
            user_session.is_email_verified = False
            user_session.updated_at = datetime.now(UTC)

            session.commit()
            return True

    def increment_verification_attempts(self, session_id: str) -> bool:
        """
        Increment verification attempts for a session.

        Args:
            session_id: The session UUID as string

        Returns:
            True if updated successfully, False otherwise
        """
        try:
            session_uuid = uuid.UUID(session_id)
        except ValueError:
            return False

        with get_db_session() as session:
            user_session = (
                session.query(UserSession).filter_by(uuid=session_uuid).first()
            )

            if not user_session:
                return False

            user_session.increment_verification_attempts()
            user_session.updated_at = datetime.now(UTC)

            session.commit()
            return True

    def increment_resend_attempts(self, session_id: str) -> bool:
        """
        Increment resend attempts for a session.

        Args:
            session_id: The session UUID as string

        Returns:
            True if updated successfully, False otherwise
        """
        try:
            session_uuid = uuid.UUID(session_id)
        except ValueError:
            return False

        with get_db_session() as session:
            user_session = (
                session.query(UserSession).filter_by(uuid=session_uuid).first()
            )

            if not user_session:
                return False

            user_session.increment_resend_attempts()
            user_session.updated_at = datetime.now(UTC)

            session.commit()
            return True

    def mark_email_verified(self, session_id: str) -> bool:
        """
        Mark email as verified for a session.

        Args:
            session_id: The session UUID as string

        Returns:
            True if updated successfully, False otherwise
        """
        try:
            session_uuid = uuid.UUID(session_id)
        except ValueError:
            return False

        with get_db_session() as session:
            user_session = (
                session.query(UserSession).filter_by(uuid=session_uuid).first()
            )

            if not user_session:
                return False

            user_session.mark_email_verified()
            user_session.updated_at = datetime.now(UTC)

            session.commit()
            return True

    def reset_verification(self, session_id: str) -> bool:
        """
        Reset all verification fields for a session.

        Args:
            session_id: The session UUID as string

        Returns:
            True if updated successfully, False otherwise
        """
        try:
            session_uuid = uuid.UUID(session_id)
        except ValueError:
            return False

        with get_db_session() as session:
            user_session = (
                session.query(UserSession).filter_by(uuid=session_uuid).first()
            )

            if not user_session:
                return False

            user_session.reset_verification()
            user_session.updated_at = datetime.now(UTC)

            session.commit()
            return True

    def cleanup_expired_verifications(self, hours: int = 24) -> int:
        """
        Clean up expired verification records.

        Args:
            hours: Number of hours to look back for expired records

        Returns:
            Number of records cleaned up
        """
        cutoff_time = datetime.now(UTC) - timedelta(hours=hours)

        with get_db_session() as session:
            expired_sessions = (
                session.query(UserSession)
                .filter(
                    and_(
                        UserSession.verification_expires_at < cutoff_time,
                        UserSession.verification_code.isnot(None),
                    )
                )
                .all()
            )

            count = len(expired_sessions)
            for user_session in expired_sessions:
                user_session.reset_verification()
                user_session.updated_at = datetime.now(UTC)

            session.commit()
            return count
