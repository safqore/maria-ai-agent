"""
SQLAlchemy models for the Maria AI Agent application.

This module defines the database models using SQLAlchemy ORM.
"""

import uuid
from datetime import datetime, UTC
from typing import Optional

from sqlalchemy import Column, String, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID

from backend.app.database import Base


class UserSession(Base):
    """
    User Session model representing the user_sessions table.
    
    Attributes:
        uuid (UUID): Primary key, unique identifier for the session
        name (str): User's name
        email (str): User's email address  
        created_at (datetime): When the session was created
        updated_at (datetime): When the session was last updated
        completed_at (datetime, optional): When the session was completed
        ip_address (str, optional): User's IP address
        consent_user_data (bool): Whether the user consented to data collection
    """
    __tablename__ = "user_sessions"
    
    uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    completed_at = Column(DateTime, nullable=True)
    ip_address = Column(Text, nullable=True)
    consent_user_data = Column(Boolean, default=False)
    
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
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "ip_address": self.ip_address,
            "consent_user_data": self.consent_user_data
        }
