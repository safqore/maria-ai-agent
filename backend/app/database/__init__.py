"""
Database package for Maria AI Agent.

This package provides database configuration, connection management,
and transaction handling.
"""

import os
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Create SQLAlchemy engine from environment variables
def get_database_url():
    """Create database URL from environment variables."""
    db_user = os.getenv("POSTGRES_USER")
    db_password = os.getenv("POSTGRES_PASSWORD")
    db_host = os.getenv("POSTGRES_HOST", "localhost")
    db_port = os.getenv("POSTGRES_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB")
    
    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# Create the SQLAlchemy engine with connection pooling
engine = create_engine(
    get_database_url(),
    pool_pre_ping=True,  # Verify connections before using them from pool
    pool_recycle=3600,   # Recycle connections after 1 hour
    echo=False,          # Set to True for SQL debugging
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

@contextmanager
def get_db_session() -> Session:
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

# Export modules and functions
__all__ = ["transaction", "get_db_session", "Base", "SessionLocal", "engine"]
