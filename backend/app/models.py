"""
SQLAlchemy models for the Maria AI Agent application.

This module defines the database models using SQLAlchemy ORM.

Architecture Note:
- Uses lazy loading as the default strategy for relationships (lazy='select')
- Eager loading is used selectively with joinedload() for performance-critical operations
- This approach optimizes memory usage and prevents unnecessary data loading
"""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.database_core import Base


class UserSession(Base):
    """
    User Session model representing the user_sessions table.

    Architecture Note:
    - All relationships use lazy='select' (default) for memory efficiency
    - Use eager loading selectively where needed with joinedload()

    Attributes:
        uuid (UUID): Primary key, unique identifier for the session
        name (str): User's name
        email (str): User's email address
        created_at (datetime): When the session was created
        updated_at (datetime): When the session was last updated
        completed_at (datetime, optional): When the session was completed
        ip_address (str, optional): User's IP address
        consent_user_data (bool): Whether the user consented to data collection
        verification_code (str, optional): 6-digit numeric verification code
        verification_attempts (int): Number of verification attempts made
        max_verification_attempts (int): Maximum allowed verification attempts
        verification_expires_at (datetime, optional): When the verification code expires
        is_email_verified (bool): Whether the email has been successfully verified
        resend_attempts (int): Number of resend attempts made
        max_resend_attempts (int): Maximum allowed resend attempts
        last_resend_at (datetime, optional): When the last resend occurred
    """

    __tablename__ = "user_sessions"

    # Note: When adding relationships in the future, use lazy='select' by default
    # Example: some_relation = relationship("SomeModel", lazy='select', back_populates="user_session")

    uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )
    completed_at = Column(DateTime, nullable=True)
    ip_address = Column(Text, nullable=True)
    consent_user_data = Column(Boolean, default=False)

    # Email verification fields
    verification_code = Column(String(6), nullable=True)
    verification_attempts = Column(Integer, default=0, nullable=False)
    max_verification_attempts = Column(Integer, default=3, nullable=False)
    verification_expires_at = Column(DateTime, nullable=True)
    is_email_verified = Column(Boolean, default=False, nullable=False)
    resend_attempts = Column(Integer, default=0, nullable=False)
    max_resend_attempts = Column(Integer, default=3, nullable=False)
    last_resend_at = Column(DateTime, nullable=True)

    def __init__(self, **kwargs):
        """Initialize the UserSession instance with proper defaults."""
        # Set default values for verification fields if not provided
        if "verification_attempts" not in kwargs:
            kwargs["verification_attempts"] = 0
        if "max_verification_attempts" not in kwargs:
            kwargs["max_verification_attempts"] = 3
        if "is_email_verified" not in kwargs:
            kwargs["is_email_verified"] = False
        if "resend_attempts" not in kwargs:
            kwargs["resend_attempts"] = 0
        if "max_resend_attempts" not in kwargs:
            kwargs["max_resend_attempts"] = 3

        super().__init__(**kwargs)

    def __repr__(self):
        """String representation of the user session."""
        return f"<UserSession(uuid='{self.uuid}', name='{self.name}', email='{self.email}')>"

    def to_dict(self):
        """Convert the model instance to a dictionary."""
        return {
            "uuid": str(self.uuid),
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": (
                self.completed_at.isoformat() if self.completed_at else None
            ),
            "ip_address": self.ip_address,
            "consent_user_data": self.consent_user_data,
            "verification_code": self.verification_code,
            "verification_attempts": self.verification_attempts,
            "max_verification_attempts": self.max_verification_attempts,
            "verification_expires_at": (
                self.verification_expires_at.isoformat()
                if self.verification_expires_at
                else None
            ),
            "is_email_verified": self.is_email_verified,
            "resend_attempts": self.resend_attempts,
            "max_resend_attempts": self.max_resend_attempts,
            "last_resend_at": (
                self.last_resend_at.isoformat() if self.last_resend_at else None
            ),
        }

    # Email verification methods
    @property
    def is_verification_expired(self) -> bool:
        """Check if the verification code has expired."""
        if not self.verification_expires_at:
            return False
        return datetime.now(UTC) > self.verification_expires_at

    @property
    def verification_attempts_remaining(self) -> int:
        """Get the number of verification attempts remaining."""
        return max(0, self.max_verification_attempts - self.verification_attempts)

    @property
    def resend_attempts_remaining(self) -> int:
        """Get the number of resend attempts remaining."""
        return max(0, self.max_resend_attempts - self.resend_attempts)

    @property
    def can_resend_verification(self) -> bool:
        """Check if a new verification code can be resent (respects cooldown and attempt limits)."""
        # Check resend attempt limits
        if self.resend_attempts >= self.max_resend_attempts:
            return False

        # Check cooldown period (30 seconds)
        if self.last_resend_at:
            cooldown_expires = self.last_resend_at + timedelta(seconds=30)
            if datetime.now(UTC) < cooldown_expires:
                return False

        return True

    def start_email_verification(self, code: str) -> None:
        """Start a new email verification process."""
        self.verification_code = code
        self.verification_attempts = 0
        self.verification_expires_at = datetime.now(UTC) + timedelta(minutes=10)
        self.is_email_verified = False

    def increment_verification_attempts(self) -> None:
        """Increment the verification attempt count."""
        self.verification_attempts += 1

    def increment_resend_attempts(self) -> None:
        """Increment the resend attempt count and update last resend timestamp."""
        self.resend_attempts += 1
        self.last_resend_at = datetime.now(UTC)

    def mark_email_verified(self) -> None:
        """Mark the email as successfully verified."""
        self.is_email_verified = True
        self.verification_code = None  # Clear the code after successful verification

    def reset_verification(self) -> None:
        """Reset all verification fields (used on session reset)."""
        self.verification_code = None
        self.verification_attempts = 0
        self.verification_expires_at = None
        self.is_email_verified = False
        self.resend_attempts = 0
        self.last_resend_at = None
