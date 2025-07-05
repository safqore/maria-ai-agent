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
from sqlalchemy.pool import StaticPool, NullPool

# Global variable to store a custom database URL (used for testing)
_custom_database_url = None

_engine = None
_SessionLocal = None


def set_database_url(url):
    """Set a custom database URL, overriding environment variables."""
    global _custom_database_url
    _custom_database_url = url


# Create SQLAlchemy engine from environment variables
def get_database_url():
    """Create database URL from environment variables or use custom URL."""
    # Debug output
    pytest_test = os.getenv("PYTEST_CURRENT_TEST")
    print(f"DEBUG: PYTEST_CURRENT_TEST = {repr(pytest_test)}")

    # If running under pytest, always use SQLite in-memory database
    if pytest_test:
        print("DEBUG: Using SQLite for pytest")
        return "sqlite:///:memory:"

    # If a custom URL has been set (for testing purposes), use that
    global _custom_database_url
    if _custom_database_url is not None:
        print(f"DEBUG: Using custom URL: {_custom_database_url}")
        return _custom_database_url

    # Otherwise build PostgreSQL URL from environment variables
    db_user = os.getenv("POSTGRES_USER")
    db_password = os.getenv("POSTGRES_PASSWORD")
    db_host = os.getenv("POSTGRES_HOST", "localhost")
    db_port = os.getenv("POSTGRES_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB")

    postgres_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    print(f"DEBUG: Using PostgreSQL URL: {postgres_url}")
    return postgres_url


# Lazy initialization of database components


def init_database():
    """Initialize database engine and session factory."""
    global _engine, _SessionLocal
    db_url = get_database_url()

    engine_kwargs = {
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "echo": False,
    }

    if db_url.startswith("sqlite://"):
        # SQLite-specific configuration for thread safety
        engine_kwargs["connect_args"] = {
            "check_same_thread": False,
            "timeout": 20,  # Connection timeout in seconds
        }

        # For SQLite, use NullPool to avoid connection sharing issues
        # This creates a new connection for each request
        engine_kwargs["poolclass"] = NullPool

        # Configure for concurrent access
        engine_kwargs["pool_pre_ping"] = True

        # Remove incompatible parameters for SQLite
        engine_kwargs.pop("pool_size", None)
        engine_kwargs.pop("max_overflow", None)
        engine_kwargs.pop("pool_recycle", None)
    else:
        # PostgreSQL configuration
        engine_kwargs.update(
            {
                "pool_size": 5,
                "max_overflow": 10,
            }
        )

    _engine = create_engine(db_url, **engine_kwargs)
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


def get_engine():
    """Get the SQLAlchemy engine, always using the latest database URL."""
    global _engine
    if _engine is None:
        init_database()
    if _engine is not None and str(_engine.url) != get_database_url():
        init_database()
    return _engine


def get_session_local():
    """Get the session factory, always using the latest database URL."""
    global _SessionLocal, _engine
    if _SessionLocal is None or _engine is None:
        init_database()
    if _engine is not None and str(_engine.url) != get_database_url():
        init_database()
    return _SessionLocal


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
