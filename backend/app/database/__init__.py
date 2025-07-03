"""
Database package for Maria AI Agent.

This package provides database configuration, connection management,
and transaction handling.
"""

import os
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# Import TransactionContext from the transaction module
from backend.app.database.transaction import TransactionContext


# Create SQLAlchemy engine from environment variables
def get_database_url():
    """Create database URL from environment variables."""
    db_user = os.getenv("POSTGRES_USER")
    db_password = os.getenv("POSTGRES_PASSWORD")
    db_host = os.getenv("POSTGRES_HOST", "localhost")
    db_port = os.getenv("POSTGRES_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB")

    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"


# Lazy initialization of database components
_engine = None
_SessionLocal = None


def init_database():
    """Initialize database engine and session factory."""
    global _engine, _SessionLocal
    if _engine is None:
        _engine = create_engine(
            get_database_url(),
            pool_pre_ping=True,  # Verify connections before using them from pool
            pool_recycle=3600,  # Recycle connections after 1 hour
            pool_size=10,  # Number of connections to maintain in pool
            max_overflow=20,  # Additional connections beyond pool_size
            pool_timeout=30,  # Timeout for getting connection from pool
            echo=False,  # Set to True for SQL debugging
        )
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


def get_engine():
    """Get the SQLAlchemy engine, initializing if necessary."""
    if _engine is None:
        init_database()
    return _engine


def get_session_local():
    """Get the session factory, initializing if necessary."""
    if _SessionLocal is None:
        init_database()
    return _SessionLocal


# For backward compatibility - these will be set after environment is loaded
engine = None
SessionLocal = None

# Base class for models
# Using SQLAlchemy 2.0 syntax
Base = declarative_base()


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Context manager for database sessions.

    This function provides a database session that is automatically
    closed after use, and handles committing changes or rolling back
    on exceptions.

    Example:
        with get_db_session() as session:
            user = session.query(User).filter(User.id == 1).first()

    Returns:
        SQLAlchemy session object
    """
    # Ensure database is initialized
    if _SessionLocal is None:
        init_database()

    session = _SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# Export modules and functions
__all__ = [
    "TransactionContext",
    "get_db_session",
    "Base",
    "SessionLocal",
    "engine",
    "init_database",
    "get_engine",
    "get_session_local",
]
