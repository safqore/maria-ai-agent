"""
Database configuration for SQLAlchemy ORM.

This module provides:
- SQLAlchemy engine configuration
- Base class for declarative models
- Session management
"""

import os
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

# Global variable to store a custom database URL (used for testing)
_custom_database_url = None


def set_database_url(url):
    """Set a custom database URL, overriding environment variables."""
    global _custom_database_url
    _custom_database_url = url


# Create SQLAlchemy engine from environment variables
def get_database_url():
    """Create database URL from environment variables or use custom URL."""
    # If a custom URL has been set (for testing purposes), use that
    global _custom_database_url
    if _custom_database_url is not None:
        return _custom_database_url

    # Otherwise build PostgreSQL URL from environment variables
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
    session_factory = get_session_local()
    session = session_factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
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
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
