"""
Pytest configuration and fixtures for Maria AI Agent backend tests.

This module provides:
- Database setup and teardown fixtures
- Flask app fixtures for testing
- Common test utilities
"""

import os
import sys
import tempfile
import uuid
from pathlib import Path

# Add the backend directory to Python path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Set test environment variables before importing Flask app
os.environ["PYTEST_CURRENT_TEST"] = "true"
os.environ["TESTING"] = "true"

# Ensure we can import from app
import pytest
from flask import Flask
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

from app.database_core import get_engine, Base, init_database
from app import models


@pytest.fixture(scope="session", autouse=True)
def initialize_test_database():
    """Initialize the test database with tables."""
    print("DEBUG: Initializing test database with tables...")

    # Force initialization of database
    init_database()

    # Get engine and create tables
    engine = get_engine()
    
    # Make sure all models are imported so their tables are created
    from app.models import UserSession
    
    # Drop all tables first to ensure clean state
    try:
        Base.metadata.drop_all(bind=engine)
        print("DEBUG: Dropped existing tables")
    except Exception as e:
        print(f"DEBUG: Error dropping tables (expected for first run): {e}")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)

    print("DEBUG: Database tables created successfully")
    
    # Verify tables were created
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    print(f"DEBUG: Created tables: {table_names}")

    yield

    # Cleanup - drop all tables
    try:
        Base.metadata.drop_all(bind=engine)
        print("DEBUG: Database tables cleaned up")
    except Exception as e:
        print(f"DEBUG: Error cleaning up database: {e}")


@pytest.fixture(scope="function")
def app():
    """
    Create a test Flask app with proper configuration.
    
    This fixture creates a function-scoped app to ensure test isolation
    and prevent rate limiting carryover between tests.
    """
    from app.app_factory import create_app

    # Create app with test configuration
    flask_app = create_app()

    # Set test configuration
    flask_app.config["TESTING"] = True
    flask_app.config["SKIP_MIDDLEWARE"] = True  # Skip middleware to avoid conflicts
    flask_app.config["REQUIRE_AUTH"] = False  # Disable authentication for tests
    flask_app.config["RATELIMIT_ENABLED"] = False  # Disable rate limiting for tests

    # Ensure authentication is disabled at the module level as well
    import app.utils.auth
    app.utils.auth.REQUIRE_AUTH = False

    # Disable S3 for tests
    flask_app.config["S3_BUCKET_NAME"] = "test-bucket"
    flask_app.config["AWS_ACCESS_KEY_ID"] = "test-key"
    flask_app.config["AWS_SECRET_ACCESS_KEY"] = "test-secret"
    flask_app.config["AWS_REGION"] = "us-east-1"

    # Ensure database is initialized and tables are created
    with flask_app.app_context():
        init_database()
        engine = get_engine()
        Base.metadata.create_all(bind=engine)

    yield flask_app


@pytest.fixture
def client(app):
    """
    Create a test client using the app fixture.

    This fixture creates a test client from the app fixture,
    ensuring proper test isolation and configuration.
    """
    with app.test_client() as client:
        yield client


@pytest.fixture
def session_uuid(client):
    """
    Create a test user session and return its UUID.

    This fixture creates a test session in the database and returns the UUID object.
    After the test completes, it cleans up by deleting the session.
    """
    from app.repositories.factory import get_user_session_repository
    from app.database_core import Base, get_engine

    # Ensure tables exist (should already be created by initialize_test_database)
    Base.metadata.create_all(bind=get_engine())

    # Generate a unique UUID for this test
    test_uuid = uuid.uuid4()  # Return UUID object, not string

    # Create the test session
    repo = get_user_session_repository()
    try:
        user_session = repo.create_session(
            session_uuid=str(test_uuid),  # create_session still expects string
            name="Test User",
            email="test@example.com",
            consent_user_data=True,
        )
        print(f"DEBUG: Created test session with UUID: {test_uuid}")
    except Exception as e:
        print(f"DEBUG: Error creating test session: {e}")
        # If creation fails, still yield the UUID for tests to use
        pass

    # Yield the UUID object to the test
    yield test_uuid

    # Clean up after the test
    try:
        repo.delete_session(test_uuid)  # Pass UUID object
        print(f"DEBUG: Cleaned up test session with UUID: {test_uuid}")
    except Exception as e:
        print(f"DEBUG: Error cleaning up test session: {e}")
        # If deletion fails, that's okay - we tried to clean up
        pass
