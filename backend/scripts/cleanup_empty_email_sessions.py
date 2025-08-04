#!/usr/bin/env python3
"""
Script to clean up user sessions without email addresses.

This script will:
1. Find all sessions with empty email addresses
2. Delete those sessions
3. Log the details of deleted sessions
"""

import logging
import os
import sys
from datetime import datetime, timezone

# Determine the project root dynamically
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, project_root)

# SQLAlchemy imports
from sqlalchemy import UUID, Boolean, Column, DateTime, Text, create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import declarative_base, sessionmaker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(
            os.path.join(project_root, "backend/logs/session_cleanup.log")
        ),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# Create a base class for declarative models
Base = declarative_base()


class UserSession(Base):
    """
    Simplified UserSession model for database cleanup.
    """

    __tablename__ = "user_sessions"

    uuid = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))


def get_engine():
    """
    Create and return a SQLAlchemy engine.

    Reads database configuration from environment or uses a default.
    """
    # Try to read from environment, fallback to default SQLite
    db_url = os.environ.get(
        "DATABASE_URL", "sqlite:///" + os.path.join(project_root, "maria_ai_dev.db")
    )
    return create_engine(db_url)


def cleanup_empty_email_sessions():
    """
    Find and delete sessions without email addresses.

    Returns:
        tuple: (total_sessions_found, total_sessions_deleted)
    """
    # Create a database session
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Find sessions without an email
        empty_email_sessions = (
            session.query(UserSession).filter(UserSession.email == "").all()
        )

        logger.info(
            f"Found {len(empty_email_sessions)} sessions without email addresses"
        )

        # Track deleted sessions
        deleted_sessions = []

        # Delete each session
        for sess in empty_email_sessions:
            # Log the details before deletion
            deleted_sessions.append(
                {
                    "uuid": str(sess.uuid),
                    "name": sess.name,
                    "created_at": sess.created_at,
                }
            )

            # Delete the session
            session.delete(sess)

        # Commit the deletions
        session.commit()

        # Log cleanup details
        logger.info(f"Deleted {len(deleted_sessions)} sessions without email addresses")

        return len(empty_email_sessions), len(deleted_sessions)

    except SQLAlchemyError as e:
        # Rollback in case of error
        session.rollback()
        logger.error(f"Database error during session cleanup: {e}")
        raise
    except Exception as e:
        # Rollback in case of any other error
        session.rollback()
        logger.error(f"Unexpected error during session cleanup: {e}")
        raise
    finally:
        # Close the session
        session.close()


def main():
    """
    Main function to run the cleanup process.
    """
    try:
        total_found, total_deleted = cleanup_empty_email_sessions()
        print(
            f"Cleanup complete. Total sessions found: {total_found}, Total sessions deleted: {total_deleted}"
        )
        return 0
    except Exception as e:
        print(f"Cleanup failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
