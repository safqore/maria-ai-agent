"""
Session service module for Maria AI Agent.

This module provides services for:
- UUID validation and generation
- Session persistence
- User consent management

Architecture Note:
- Uses explicit transaction boundaries with TransactionContext
- All database operations are wrapped in proper transactions
- Provides clear transaction scope for atomic operations
"""

import logging
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Dict, Optional, Tuple

from app.database.transaction import TransactionContext
from app.models import UserSession
from app.repositories.factory import get_user_session_repository
from app.utils.audit_utils import log_audit_event
from app.utils.s3_utils import migrate_s3_files

# Configure more detailed logging
logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class SessionService:
    """
    Service class for session-related operations.

    This class handles all business logic related to user sessions including
    UUID validation, generation, and session persistence.

    Architecture Note:
    - Uses explicit transactions for all database operations
    - Transaction boundaries are clearly defined for atomic operations
    """

    def __init__(self):
        """Initialize with a repository instance."""
        self.user_session_repository = get_user_session_repository()

    @staticmethod
    def is_valid_uuid(val: Any) -> bool:
        """
        Validate if a string is a valid UUID.

        Args:
            val: The value to validate, will be converted to string

        Returns:
            bool: True if the value is a valid UUID, False otherwise
        """
        try:
            uuid.UUID(str(val))
            return True
        except ValueError:
            return False

    def cleanup_expired_sessions(self) -> int:
        """
        Clean up sessions that are older than 10 minutes and incomplete.

        Returns:
            int: Number of sessions cleaned up
        """
        cutoff_time = datetime.now(UTC) - timedelta(minutes=10)

        try:
            with TransactionContext() as session:
                # Find expired incomplete sessions
                expired_sessions = (
                    session.query(UserSession)
                    .filter(
                        UserSession.created_at < cutoff_time,
                        (
                            (UserSession.name.is_(None) | (UserSession.name == ""))
                            | (UserSession.email.is_(None) | (UserSession.email == ""))
                            | (UserSession.is_email_verified.is_(False))
                        ),
                    )
                    .all()
                )

                count = len(expired_sessions)

                # Delete expired sessions
                for expired_session in expired_sessions:
                    session.delete(expired_session)

                # Transaction will be committed automatically when context exits

                if count > 0:
                    logger.info(f"Cleaned up {count} expired sessions")
                    log_audit_event(
                        "expired_sessions_cleaned",
                        details={
                            "count": count,
                            "cutoff_time": cutoff_time.isoformat(),
                        },
                    )

                return count

        except Exception as e:
            logger.error(f"Error cleaning up expired sessions: {e}")
            return 0

    def validate_uuid(self, session_uuid: str) -> Tuple[Dict[str, Any], int]:
        """
        Validate a session UUID with 10-minute expiration rule.

        Business Logic:
        - UUID exists with complete data → COLLISION (start new session)
        - UUID exists with incomplete data + < 10 minutes → SUCCESS (continue)
        - UUID exists with incomplete data + > 10 minutes → INVALID (start new session)
        - UUID doesn't exist → INVALID (tampered)

        Args:
            session_uuid: String containing the UUID to validate

        Returns:
            tuple: (response_data, status_code)
                response_data: Dictionary with validation result
                status_code: HTTP status code
        """
        # Clean up expired sessions first
        self.cleanup_expired_sessions()

        # Validate UUID format first
        if not session_uuid or not self.is_valid_uuid(session_uuid):
            log_audit_event(
                "uuid_validation_failed",
                user_uuid=session_uuid,
                details={"reason": "invalid format"},
            )
            return {
                "status": "invalid",
                "uuid": None,
                "message": "Invalid or missing UUID",
                "details": {"reason": "invalid format"},
            }, 400

        # Log the validation attempt
        log_audit_event(
            "uuid_validation_attempt",
            user_uuid=session_uuid,
            details={"validation_type": "format_and_session_state"},
        )

        # Get session from database
        try:
            session = self.user_session_repository.get(session_uuid)
        except Exception as e:
            logger.error(f"Database error during UUID validation: {e}")
            return {
                "status": "error",
                "uuid": None,
                "message": "Database error",
                "details": {"reason": "database_error"},
            }, 500

        if not session:
            # UUID doesn't exist - tampered
            log_audit_event(
                "uuid_validation_tampered",
                user_uuid=session_uuid,
                details={"reason": "not_found"},
            )
            return {
                "status": "invalid",
                "uuid": None,
                "message": "UUID not found - session may be tampered",
                "details": {"reason": "not_found"},
            }, 400

        # Check if session is complete (has name + email + verified email)
        is_complete = session.name and session.email and session.is_email_verified

        if is_complete:
            # Session is complete - this is a collision
            log_audit_event(
                "uuid_validation_collision",
                user_uuid=session_uuid,
                details={"reason": "complete_session"},
            )
            return {
                "status": "collision",
                "uuid": session_uuid,
                "message": "Session already exists with complete data",
                "details": {"reason": "complete_session"},
            }, 409

        # Check if session is expired (> 10 minutes)
        # Handle both naive and timezone-aware datetimes
        if session.created_at.tzinfo is None:
            # If created_at is naive, assume it's UTC
            session_age = datetime.now(UTC) - session.created_at.replace(tzinfo=UTC)
        else:
            # If created_at is timezone-aware, use it directly
            session_age = datetime.now(UTC) - session.created_at

        if session_age > timedelta(minutes=10):
            # Session is expired - invalid
            log_audit_event(
                "uuid_validation_expired",
                user_uuid=session_uuid,
                details={
                    "reason": "expired",
                    "age_minutes": session_age.total_seconds() / 60,
                },
            )
            return {
                "status": "invalid",
                "uuid": None,
                "message": "Session expired - please start new session",
                "details": {
                    "reason": "expired",
                    "age_minutes": session_age.total_seconds() / 60,
                },
            }, 400

        # Session is valid and active (< 10 minutes, incomplete)
        log_audit_event(
            "uuid_validation_success",
            user_uuid=session_uuid,
            details={
                "session_state": "active_incomplete",
                "age_minutes": session_age.total_seconds() / 60,
            },
        )
        return {
            "status": "success",
            "uuid": session_uuid,
            "message": "UUID is valid and session is active",
            "details": {
                "session_state": "active_incomplete",
                "age_minutes": session_age.total_seconds() / 60,
            },
        }, 200

    def generate_uuid(self) -> Tuple[Dict[str, Any], int]:
        """
        Generate a unique UUID and store it in the database immediately.

        This method generates a unique UUID and stores it in the database
        immediately upon generation for tamper detection.

        Returns:
            tuple: (response_data, status_code)
                response_data: Dictionary with generation result
                status_code: HTTP status code
        """
        max_attempts = 10  # Reasonable limit for UUID generation

        for attempt in range(max_attempts):
            # Generate a new UUID
            new_uuid = str(uuid.uuid4())
            logger.debug(f"Generated UUID attempt {attempt + 1}: {new_uuid}")

            # Check if this UUID already exists in the database
            exists = self.user_session_repository.exists(new_uuid, require_data=False)

            if not exists:
                # UUID is unique - STORE IT IN DATABASE IMMEDIATELY
                try:
                    with TransactionContext() as session:
                        user_session = UserSession(
                            uuid=uuid.UUID(new_uuid),  # Convert string to UUID object
                            name="",  # Use empty string as placeholder - will be updated later
                            email=None,
                            is_email_verified=False,
                            created_at=datetime.now(UTC),
                            updated_at=datetime.now(UTC),
                        )
                        session.add(user_session)
                        # Transaction will be committed automatically when context exits

                    log_audit_event("uuid_generation_success", user_uuid=new_uuid)
                    return {
                        "status": "success",
                        "uuid": new_uuid,
                        "message": "Generated unique UUID",
                        "details": {"attempt": attempt + 1},
                    }, 201  # 201 Created for new resource
                except Exception as e:
                    logger.error(f"Failed to store generated UUID: {e}")
                    log_audit_event(
                        "uuid_generation_storage_failed",
                        user_uuid=new_uuid,
                        details={"error": str(e), "attempt": attempt + 1},
                    )
                    continue
            else:
                # UUID exists, try again
                log_audit_event(
                    "uuid_generation_collision",
                    user_uuid=new_uuid,
                    details={"attempt": attempt + 1, "reason": "UUID already exists"},
                )
                continue

        # If we get here, we couldn't generate a unique UUID after max attempts
        log_audit_event(
            "uuid_generation_failed",
            details={
                "reason": f"Could not generate unique UUID after {max_attempts} attempts"
            },
        )
        return {
            "status": "error",
            "uuid": None,
            "message": f"Could not generate unique UUID after {max_attempts} attempts",
            "details": {
                "reason": f"Could not generate unique UUID after {max_attempts} attempts"
            },
        }, 500

    def persist_session(
        self, session_uuid: str, name: Optional[str] = None, email: Optional[str] = None
    ) -> Tuple[Dict[str, Any], int]:
        """
        Persist a session with robust UUID collision handling.

        Args:
            session_uuid: The UUID to use for the session
            name: Optional name for the session (required for new sessions)
            email: Optional email for the session

        Returns:
            Tuple of (response dictionary, status code)
            - 201: New session created
            - 200: Existing session updated
            - 400: Invalid input
            - 500: Server error
        """
        max_collision_attempts = 5
        current_uuid = session_uuid

        for attempt in range(max_collision_attempts):
            try:
                # Check if session already exists
                existing_session = self.user_session_repository.get(current_uuid)

                # For new sessions, name is required
                if not existing_session and (not name or not name.strip()):
                    raise ValueError(
                        "Name is required for new sessions and cannot be empty"
                    )

                # Email validation is optional - if provided, it must not be empty
                if email and not email.strip():
                    email = None

                # Attempt to create or update session
                try:
                    user_session, was_created = (
                        self.user_session_repository.create_or_update_session(
                            current_uuid, name=name, email=email
                        )
                    )

                    # Log successful persistence
                    log_audit_event(
                        "session_persisted",
                        user_uuid=str(user_session.uuid),
                        details={
                            "name": name,
                            "email": email,
                            "attempt": attempt,
                            "was_created": was_created,
                        },
                    )

                    # Return appropriate status code based on whether session was created or updated
                    if was_created:
                        return {
                            "status": "success",
                            "uuid": str(user_session.uuid),
                            "message": "Session created successfully",
                            "details": {"attempt": attempt, "action": "created"},
                        }, 201
                    else:
                        return {
                            "status": "success",
                            "uuid": str(user_session.uuid),
                            "message": "Session updated successfully",
                            "details": {"attempt": attempt, "action": "updated"},
                        }, 200

                except ValueError as ve:
                    # If a collision or validation error occurs, try generating a new UUID
                    current_uuid = str(uuid.uuid4())
                    log_audit_event(
                        "uuid_collision_retry",
                        user_uuid=current_uuid,
                        details={
                            "original_uuid": session_uuid,
                            "attempt": attempt,
                            "error": str(ve),
                        },
                    )
                    continue

            except Exception as e:
                # Log any unexpected errors
                log_audit_event(
                    "session_persistence_fatal_error",
                    details={"error": str(e), "uuid": current_uuid, "attempt": attempt},
                )
                return {
                    "status": "error",
                    "message": "Failed to persist session",
                    "details": {"error": str(e), "attempt": attempt},
                }, 500

        # If all attempts fail
        log_audit_event(
            "session_persistence_max_attempts_exceeded",
            details={
                "original_uuid": session_uuid,
                "max_attempts": max_collision_attempts,
            },
        )
        return {
            "status": "error",
            "message": "Could not persist session after multiple attempts",
            "details": {
                "original_uuid": session_uuid,
                "max_attempts": max_collision_attempts,
            },
        }, 500
