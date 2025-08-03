"""
Verification Service for email verification business logic.

This service handles email verification operations including code generation,
validation, rate limiting, and proper transaction management.
"""

from datetime import UTC, datetime
from typing import Any, Dict, Optional

from app.database.transaction import TransactionContext
from app.repositories.email_verification_repository import EmailVerificationRepository
from app.services.email_service import EmailService
from app.utils.audit_utils import log_audit_event
from flask import current_app


class VerificationService:
    """
    Service for email verification business logic.

    Handles verification code generation, validation, rate limiting,
    and proper transaction management using TransactionContext.
    """

    def __init__(self):
        """Initialize the verification service with dependencies."""
        self.email_service = EmailService()
        self.email_verification_repository = EmailVerificationRepository()

    def send_verification_code(self, session_id: str, email: str) -> Dict[str, Any]:
        """
        Send verification code to the provided email address.

        Args:
            session_id: Session UUID as string
            email: Email address to send code to

        Returns:
            Dictionary with operation result and nextTransition
        """
        with TransactionContext():
            try:
                # Get user session
                user_session = self.email_verification_repository.get_by_session_id(
                    session_id
                )
                if not user_session:
                    return {
                        "status": "error",
                        "error": "Session not found",
                        "nextTransition": "SESSION_ERROR",
                    }

                # Validate email format
                if not self.email_service.validate_email_format(email):
                    return {
                        "status": "error",
                        "error": "Please enter a valid email address",
                        "nextTransition": "EMAIL_INPUT",
                    }

                # Check rate limiting for resend
                if not user_session.can_resend_verification:
                    if user_session.resend_attempts >= user_session.max_resend_attempts:
                        return {
                            "status": "error",
                            "error": "Maximum resend attempts reached. Please try again later.",
                            "nextTransition": "SESSION_RESET",
                        }
                    else:
                        return {
                            "status": "error",
                            "error": "Please wait 30 seconds before requesting another code",
                            "nextTransition": "CODE_INPUT",
                        }

                # Generate verification code
                code = self.email_service.generate_verification_code()
                expires_at = self.email_service.get_verification_expiry()

                # Update session with email and new code
                if not self.email_verification_repository.update_email(
                    session_id, email
                ):
                    return {
                        "status": "error",
                        "error": "Failed to update email address",
                        "nextTransition": "EMAIL_INPUT",
                    }

                if not self.email_verification_repository.update_verification_code(
                    session_id, code, expires_at
                ):
                    return {
                        "status": "error",
                        "error": "Failed to update verification code",
                        "nextTransition": "EMAIL_INPUT",
                    }

                # Send email
                if not self.email_service.send_verification_email(
                    email, code, session_id
                ):
                    return {
                        "status": "error",
                        "error": "Failed to send verification email. Please try again.",
                        "nextTransition": "EMAIL_INPUT",
                    }

                # Increment resend attempts
                self.email_verification_repository.increment_resend_attempts(session_id)

                # Log successful code generation
                log_audit_event(
                    event_type="verification_code_generated",
                    user_uuid=session_id,
                    details={
                        "email": self.email_service.hash_email(email),
                        "expires_at": expires_at.isoformat(),
                    },
                )

                return {
                    "status": "success",
                    "message": "Verification code sent successfully",
                    "nextTransition": "CODE_INPUT",
                }

            except Exception as e:
                current_app.logger.error(f"Error sending verification code: {e}")
                return {
                    "status": "error",
                    "error": "An unexpected error occurred. Please try again.",
                    "nextTransition": "EMAIL_INPUT",
                }

    def verify_code(self, session_id: str, code: str) -> Dict[str, Any]:
        """
        Verify the provided code for the session.

        Args:
            session_id: Session UUID as string
            code: 6-digit verification code

        Returns:
            Dictionary with operation result and nextTransition
        """
        with TransactionContext():
            try:
                # Get user session
                user_session = self.email_verification_repository.get_by_session_id(
                    session_id
                )
                if not user_session:
                    return {
                        "status": "error",
                        "error": "Session not found",
                        "nextTransition": "SESSION_ERROR",
                    }

                # Check if already verified
                if user_session.is_email_verified:
                    return {
                        "status": "success",
                        "message": "Email already verified",
                        "nextTransition": "CHAT_READY",
                    }

                # Check if verification code exists
                if not user_session.verification_code:
                    return {
                        "status": "error",
                        "error": "No verification code found. Please request a new code.",
                        "nextTransition": "EMAIL_INPUT",
                    }

                # Check if code has expired
                if user_session.is_verification_expired:
                    return {
                        "status": "error",
                        "error": "Verification code has expired. Please request a new code.",
                        "nextTransition": "EMAIL_INPUT",
                    }

                # Check attempt limits
                if (
                    user_session.verification_attempts
                    >= user_session.max_verification_attempts
                ):
                    return {
                        "status": "error",
                        "error": "Maximum verification attempts reached. Please try again later.",
                        "nextTransition": "SESSION_RESET",
                    }

                # Increment attempts first
                self.email_verification_repository.increment_verification_attempts(
                    session_id
                )

                # Verify code
                if user_session.verification_code != code:
                    attempts_remaining = user_session.verification_attempts_remaining
                    if attempts_remaining <= 0:
                        return {
                            "status": "error",
                            "error": "Maximum verification attempts reached. Please try again later.",
                            "nextTransition": "SESSION_RESET",
                        }
                    else:
                        return {
                            "status": "error",
                            "error": f"Invalid verification code. {attempts_remaining} attempts remaining.",
                            "nextTransition": "CODE_INPUT",
                        }

                # Mark email as verified
                if not self.email_verification_repository.mark_email_verified(
                    session_id
                ):
                    return {
                        "status": "error",
                        "error": "Failed to mark email as verified",
                        "nextTransition": "CODE_INPUT",
                    }

                # Log successful verification
                log_audit_event(
                    event_type="email_verified",
                    user_uuid=session_id,
                    details={
                        "verification_attempts": user_session.verification_attempts + 1
                    },
                )

                return {
                    "status": "success",
                    "message": "Email verified successfully",
                    "nextTransition": "CHAT_READY",
                }

            except Exception as e:
                current_app.logger.error(f"Error verifying code: {e}")
                return {
                    "status": "error",
                    "error": "An unexpected error occurred. Please try again.",
                    "nextTransition": "CODE_INPUT",
                }

    def resend_code(self, session_id: str) -> Dict[str, Any]:
        """
        Resend verification code for the session.

        Args:
            session_id: Session UUID as string

        Returns:
            Dictionary with operation result and nextTransition
        """
        with TransactionContext():
            try:
                # Get user session
                user_session = self.email_verification_repository.get_by_session_id(
                    session_id
                )
                if not user_session:
                    return {
                        "status": "error",
                        "error": "Session not found",
                        "nextTransition": "SESSION_ERROR",
                    }

                # Check if already verified
                if user_session.is_email_verified:
                    return {
                        "status": "success",
                        "message": "Email already verified",
                        "nextTransition": "CHAT_READY",
                    }

                # Check if email exists for resend
                if not user_session.email:
                    return {
                        "status": "error",
                        "error": "No email address found for this session. Please provide an email address first.",
                        "nextTransition": "EMAIL_INPUT",
                    }

                # Check rate limiting
                if not user_session.can_resend_verification:
                    if user_session.resend_attempts >= user_session.max_resend_attempts:
                        return {
                            "status": "error",
                            "error": "Maximum resend attempts reached. Please try again later.",
                            "nextTransition": "SESSION_RESET",
                        }
                    else:
                        return {
                            "status": "error",
                            "error": "Please wait 30 seconds before requesting another code",
                            "nextTransition": "CODE_INPUT",
                        }

                # Generate new verification code
                code = self.email_service.generate_verification_code()
                expires_at = self.email_service.get_verification_expiry()

                # Update session with new code
                if not self.email_verification_repository.update_verification_code(
                    session_id, code, expires_at
                ):
                    return {
                        "status": "error",
                        "error": "Failed to update verification code",
                        "nextTransition": "CODE_INPUT",
                    }

                # Send email
                if not self.email_service.send_verification_email(
                    user_session.email, code, session_id
                ):
                    return {
                        "status": "error",
                        "error": "Failed to send verification email. Please try again.",
                        "nextTransition": "CODE_INPUT",
                    }

                # Increment resend attempts
                self.email_verification_repository.increment_resend_attempts(session_id)

                # Log successful resend
                log_audit_event(
                    event_type="verification_code_resent",
                    user_uuid=session_id,
                    details={
                        "email": self.email_service.hash_email(user_session.email),
                        "expires_at": expires_at.isoformat(),
                    },
                )

                return {
                    "status": "success",
                    "message": "Verification code resent successfully",
                    "nextTransition": "CODE_INPUT",
                }

            except Exception as e:
                current_app.logger.error(f"Error resending code: {e}")
                return {
                    "status": "error",
                    "error": "An unexpected error occurred. Please try again.",
                    "nextTransition": "CODE_INPUT",
                }

    def cleanup_expired_verifications(self, hours: int = 24) -> int:
        """
        Clean up expired verification records.

        Args:
            hours: Number of hours to look back for expired records

        Returns:
            Number of records cleaned up
        """
        try:
            count = self.email_verification_repository.cleanup_expired_verifications(
                hours
            )
            current_app.logger.info(f"Cleaned up {count} expired verification records")
            return count
        except Exception as e:
            current_app.logger.error(f"Error cleaning up expired verifications: {e}")
            return 0
