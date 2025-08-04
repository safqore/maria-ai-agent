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
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from sqlalchemy.pool import NullPool, StaticPool

from config import Config

# Global variable to store a custom database URL (used for testing)
_custom_database_url = None

_engine = None
_SessionLocal = None


def set_database_url(url):
    """Set a custom database URL, overriding environment variables."""
    global _custom_database_url
    _custom_database_url = url


# Create SQLAlchemy engine from environment variables
def get_database_url() -> str:
    """
    Get the database URL based on environment variables and context.

    Priority order:
    1. Custom URL (for testing)
    2. Config.get_database_url() (handles DATABASE_URL, Supabase, etc.)
    3. Fallback to SQLite for local development
    """
    # If a custom URL has been set (for testing purposes), use that first
    global _custom_database_url
    if _custom_database_url is not None:
        return _custom_database_url

    # Use the Config class to get the appropriate database URL
    # This handles DATABASE_URL, Supabase configuration, and traditional PostgreSQL
    config_db_url = Config.get_database_url()

    # If Config returns a non-SQLite URL, use it
    if not config_db_url.startswith("sqlite://"):
        return config_db_url

    # If running under pytest locally, use file-based SQLite for sharing
    pytest_test = os.getenv("PYTEST_CURRENT_TEST")
    if pytest_test:
        # Use the test database in the backend directory
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        test_db_path = os.path.join(backend_dir, "maria_ai_test.db")
        return f"sqlite:///{test_db_path}"

    # Fallback to SQLite for local development
    return config_db_url


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

        # For file-based SQLite, we can use a small pool instead of NullPool
        if db_url == "sqlite:///:memory:":
            # In-memory: use NullPool (each connection gets its own database)
            engine_kwargs["poolclass"] = NullPool
        else:
            # File-based: use StaticPool with a single connection for tests
            engine_kwargs["poolclass"] = StaticPool
            # StaticPool doesn't accept pool_size/max_overflow parameters
            # It maintains a single connection that is shared

        # Configure for concurrent access
        engine_kwargs["pool_pre_ping"] = True

        # Remove incompatible parameters for SQLite
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

    # For file-based SQLite, set up WAL mode
    if db_url.startswith("sqlite://") and not db_url.endswith(":memory:"):
        from sqlalchemy import event

        def enable_wal_mode(dbapi_connection, connection_record):
            dbapi_connection.execute("PRAGMA journal_mode=WAL")
            dbapi_connection.execute("PRAGMA synchronous=NORMAL")
            dbapi_connection.execute("PRAGMA temp_store=memory")
            dbapi_connection.execute("PRAGMA mmap_size=268435456")  # 256MB

        event.listen(_engine, "connect", enable_wal_mode)

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
