"""
Repository factory module.

This module provides factory functions to create repositories,
ensuring that repository instances are created consistently.
"""

from app.models import UserSession
from app.repositories.user_session_repository import UserSessionRepository
from app.repositories.email_verification_repository import EmailVerificationRepository


def get_user_session_repository() -> UserSessionRepository:
    """
    Get a UserSessionRepository instance.

    Returns:
        UserSessionRepository: A repository for UserSession operations
    """
    return UserSessionRepository()


def get_email_verification_repository() -> EmailVerificationRepository:
    """
    Get an EmailVerificationRepository instance.

    Returns:
        EmailVerificationRepository: A repository for email verification operations
    """
    return EmailVerificationRepository()
