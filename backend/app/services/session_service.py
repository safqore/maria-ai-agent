"""
Session service module for Maria AI Agent.

This module provides services for:
- UUID validation and generation
- Session persistence
- User consent management
"""

import uuid
from typing import Any, Dict, Tuple, Optional

from backend.app.repositories.factory import get_user_session_repository
from backend.app.utils.audit_utils import log_audit_event
from backend.app.utils.s3_utils import migrate_s3_files


class SessionService:
    """
    Service class for session-related operations.

    This class handles all business logic related to user sessions including
    UUID validation, generation, and session persistence.
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

    def check_uuid_exists(self, session_uuid: str) -> bool:
        """
        Check if a UUID exists in the database.

        Args:
            session_uuid: The UUID to check

        Returns:
            bool: True if the UUID exists, False otherwise
        """
        return self.user_session_repository.exists(session_uuid)

    def validate_uuid(self, session_uuid: str) -> Tuple[Dict[str, Any], int]:
        """
        Validate a session UUID.

        This method validates the format of a UUID and checks if it exists
        in the database.

        Args:
            session_uuid: String containing the UUID to validate

        Returns:
            tuple: (response_data, status_code)
                response_data: Dictionary with validation result
                status_code: HTTP status code
        """
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

        exists = self.check_uuid_exists(session_uuid)

        if exists:
            log_audit_event(
                "uuid_validation_collision",
                user_uuid=session_uuid,
                details={"reason": "UUID already exists"},
            )
            return {
                "status": "collision",
                "uuid": session_uuid,
                "message": "UUID already exists",
                "details": {"reason": "UUID already exists"},
            }, 409

        log_audit_event("uuid_validation_success", user_uuid=session_uuid)
        return {
            "status": "success",
            "uuid": session_uuid,
            "message": "UUID is valid and unique",
            "details": {},
        }, 200

    def generate_uuid(self) -> Tuple[Dict[str, Any], int]:
        """
        Generate a unique UUID.

        This method attempts to generate a unique UUID and checks for
        collisions with existing UUIDs in the database.

        Returns:
            tuple: (response_data, status_code)
                response_data: Dictionary with generation result
                status_code: HTTP status code
        """
        attempts = 0
        max_attempts = 3
        new_uuid = None

        while attempts < max_attempts:
            candidate = str(uuid.uuid4())
            if not self.check_uuid_exists(candidate):
                new_uuid = candidate
                break
            attempts += 1

        if new_uuid:
            log_audit_event("uuid_generation_success", user_uuid=new_uuid)
            return {
                "status": "success",
                "uuid": new_uuid,
                "message": "Generated unique UUID",
                "details": {},
            }, 200
        else:
            log_audit_event(
                "uuid_generation_failed",
                details={"reason": "Could not generate unique UUID after 3 attempts"},
            )
            return {
                "status": "error",
                "uuid": None,
                "message": "Could not generate unique UUID",
                "details": {
                    "reason": "Could not generate unique UUID after 3 attempts"
                },
            }, 500

    def persist_session(
        self,
        session_uuid: str, name: str, email: str
    ) -> Tuple[Dict[str, Any], int]:
        """
        Persist a user session with name, email, and session_uuid.

        This method checks UUID uniqueness in the database. If there is a collision,
        it generates a new UUID and migrates files in S3.

        Args:
            session_uuid: The session UUID
            name: The user's name
            email: The user's email

        Returns:
            tuple: (response_data, status_code)
                response_data: Dictionary with persistence result
                status_code: HTTP status code
        """
        if not session_uuid or not self.is_valid_uuid(session_uuid):
            return {
                "error": "Invalid or missing session UUID",
                "code": "invalid session",
            }, 400

        # Check if session UUID already exists
        if self.user_session_repository.exists(session_uuid):
            new_uuid = str(uuid.uuid4())
            migrate_s3_files(session_uuid, new_uuid)
            session_uuid = new_uuid
            return {
                "new_uuid": new_uuid,
                "message": "UUID collision, new UUID assigned",
            }, 200

        # Create the user session
        user_session = self.user_session_repository.create_session(
            session_uuid=session_uuid,
            name=name,
            email=email
        )

        log_audit_event(
            "session_persisted",
            user_uuid=str(user_session.uuid),
            details={"name": name, "email": email}
        )
        
        return {"message": "Session persisted", "session_uuid": str(user_session.uuid)}, 200
