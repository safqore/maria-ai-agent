"""
Mock database module for testing.
This module provides an in-memory SQLite database for testing.
"""

import os
import uuid
from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import MetaData, create_engine, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

# Create a base class for declarative models
Base = declarative_base()

# Create an in-memory SQLite engine for testing
engine = create_engine("sqlite:///:memory:", echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Define a session context manager
@contextmanager
def get_db_session() -> Iterator[Session]:
    """Get a database session."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_engine():
    """Get the database engine."""
    return engine


def get_session_local():
    """Get the session factory."""
    return SessionLocal


def init_database():
    """Initialize the database with tables."""
    Base.metadata.create_all(bind=engine)


def teardown_database():
    """Remove all tables from the database."""
    Base.metadata.drop_all(bind=engine)


def create_tables():
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)


def get_database_url():
    """Mock for the get_database_url function."""
    return "sqlite:///:memory:"


# Override the UUID converter for SQLite since it doesn't support UUID natively
from sqlalchemy.dialects.sqlite import CHAR
from sqlalchemy.types import TypeDecorator


class GUID(TypeDecorator):
    """Platform-independent GUID type.

    Uses CHAR(36) for SQLite to store UUID strings.
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value

        # Always convert to string format for SQLite
        if isinstance(value, uuid.UUID):
            return str(value)
        elif isinstance(value, str):
            try:
                # Make sure it's a valid UUID by parsing and converting back to string
                return str(uuid.UUID(value))
            except ValueError:
                # Log issue but allow through to fail validation elsewhere
                print(f"Warning: Invalid UUID format received: {value}")
                return value
        else:
            # Handle other types by converting to string
            try:
                return str(value)
            except Exception as e:
                print(f"Error converting value to UUID string: {e}")
                return str(value) if value is not None else None

    def process_result_value(self, value, dialect):
        if value is None:
            return value

        # Always try to convert string to UUID for consistency
        if isinstance(value, str):
            try:
                return uuid.UUID(value)
            except (ValueError, TypeError):
                print(f"Warning: Cannot convert database value '{value}' to UUID")
                return value
        # If already a UUID, return it
        elif isinstance(value, uuid.UUID):
            return value
        # For any other type, try to convert to UUID
        else:
            try:
                return uuid.UUID(str(value))
            except (ValueError, TypeError):
                return value
