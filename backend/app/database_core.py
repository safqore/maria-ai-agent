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
    2. PostgreSQL environment variables
    3. CI environment (always PostgreSQL)
    4. Pytest environment (file-based SQLite)
    5. Local development (SQLite)
    """
    # If a custom URL has been set (for testing purposes), use that first
    global _custom_database_url
    if _custom_database_url is not None:
        return _custom_database_url

    # Determine the database name, with a consistent default
    default_db_name = "maria_ai_agent"

    # Check if PostgreSQL environment variables are set
    db_user = os.getenv("POSTGRES_USER")
    db_password = os.getenv("POSTGRES_PASSWORD", "")
    db_host = os.getenv("POSTGRES_HOST", "localhost")
    db_port = os.getenv("POSTGRES_PORT", "5432")

    # Prioritize environment variable, but use default if not set
    db_name = os.getenv("POSTGRES_DB", default_db_name)

    if db_user and db_name:
        # Use PostgreSQL if environment variables are set
        postgres_url = (
            f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        )
        return postgres_url

    # If running in CI environment, always use PostgreSQL
    ci_env = os.getenv("CI")
    if ci_env:
        db_user = os.getenv("POSTGRES_USER", "postgres")
        db_password = os.getenv("POSTGRES_PASSWORD", "postgres")
        db_host = os.getenv("POSTGRES_HOST", "localhost")
        db_port = os.getenv("POSTGRES_PORT", "5432")
        db_name = os.getenv("POSTGRES_DB", default_db_name)

        postgres_url = (
            f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        )
        return postgres_url

    # If running under pytest locally, use file-based SQLite for sharing
    pytest_test = os.getenv("PYTEST_CURRENT_TEST")
    if pytest_test:
        # Use the test database in the backend directory
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        test_db_path = os.path.join(backend_dir, "maria_ai_test.db")
        return f"sqlite:///{test_db_path}"

    # Fallback to SQLite for local development
    return "sqlite:///maria_ai_dev.db"


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
