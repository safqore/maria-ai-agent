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

# Ensure we can import from app
import pytest
from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database_core import get_engine, Base, init_database
from app import models


@pytest.fixture(scope="session", autouse=True)
def initialize_test_database():
    """Initialize the test database with tables."""
    # Import after setting up the environment

    print("DEBUG: Initializing test database with tables...")

    # Force initialization of database
    init_database()

    # Get engine and create tables
    engine = get_engine()
    Base.metadata.create_all(bind=engine)

    print("DEBUG: Database tables created successfully")

    yield

    # Cleanup - drop all tables
    try:
        Base.metadata.drop_all(bind=engine)
        print("DEBUG: Database tables cleaned up")
    except Exception as e:
        print(f"DEBUG: Error cleaning up database: {e}")


@pytest.fixture
def test_app():
    """
    Create a test-specific Flask app with minimal configuration.

    This can be used when you need more control over the app creation
    process than the standard create_app function provides.
    """
    app = Flask("test_app")
    app.config["TESTING"] = True
    app.config["REQUIRE_AUTH"] = False  # Disable auth for testing
    app.config["SKIP_MIDDLEWARE"] = True  # Skip middleware to avoid conflicts

    yield app


@pytest.fixture
def client():
    """
    Create a test client using the create_app function.

    This fixture creates a proper Flask app using the application factory
    and returns a test client for making requests.
    """
    from app.app_factory import create_app

    # Create app without test_config parameter
    app = create_app()

    # Set test configuration after app creation
    app.config["TESTING"] = True
    app.config["SKIP_MIDDLEWARE"] = True  # Skip middleware to avoid conflicts
    app.config["REQUIRE_AUTH"] = False  # Disable authentication for tests
    app.config["RATELIMIT_ENABLED"] = False  # Disable rate limiting for tests

    # Ensure authentication is disabled at the module level as well
    import app.utils.auth

    app.utils.auth.REQUIRE_AUTH = False

    # Disable S3 for tests
    app.config["S3_BUCKET_NAME"] = "test-bucket"
    app.config["AWS_ACCESS_KEY_ID"] = "test-key"
    app.config["AWS_SECRET_ACCESS_KEY"] = "test-secret"
    app.config["AWS_REGION"] = "us-east-1"

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
    user_session = repo.create_session(
        session_uuid=str(test_uuid),  # create_session still expects string
        name="Test User",
        email="test@example.com",
        consent_user_data=True,
    )

    # Yield the UUID object to the test
    yield test_uuid

    # Clean up after the test
    try:
        repo.delete_session(test_uuid)  # Pass UUID object
    except Exception:
        # If deletion fails, that's okay - we tried to clean up
        pass
