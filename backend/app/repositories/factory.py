"""
Repository factory module.

This module provides factory functions to create repositories,
ensuring that repository instances are created consistently.
"""

from backend.app.models import UserSession
from backend.app.repositories.user_session_repository import UserSessionRepository


def get_user_session_repository() -> UserSessionRepository:
    """
    Get a UserSessionRepository instance.

    Returns:
        UserSessionRepository: A repository for UserSession operations
    """
    return UserSessionRepository()
