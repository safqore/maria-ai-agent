"""
Configuration file for backend tests.
This file is automatically recognized by pytest and allows sharing fixtures and setup.
"""

import os
import sys
import uuid
import pytest
from flask import Flask

# Ensure we can import from backend.app
# This adds the project root to sys.path if it's not already there
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

# Set the SQLALCHEMY_DATABASE_URI environment variable to SQLite at the very top of the file, before any other imports, to ensure all tests use SQLite and not PostgreSQL. This should be the first line in the file.
import os
os.environ["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"


@pytest.fixture(scope="session", autouse=True)
def test_database_url():
    """Set up SQLite database URL for all tests."""
    import os
    import tempfile
    
    # Set environment variables to force SQLite for testing
    # This will cause get_database_url() to return None, which we can handle
    os.environ["POSTGRES_USER"] = ""
    os.environ["POSTGRES_PASSWORD"] = ""
    os.environ["POSTGRES_HOST"] = ""
    os.environ["POSTGRES_PORT"] = ""
    os.environ["POSTGRES_DB"] = ""
    
    # Create a temporary file-based SQLite database
    temp_db = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
    temp_db.close()
    sqlite_url = f"sqlite:///{temp_db.name}"
    
    # Import and set the database URL after environment is configured
    import backend.app.database_core
    backend.app.database_core._custom_database_url = sqlite_url
    
    # Force re-initialization of the database engine
    backend.app.database_core._engine = None
    backend.app.database_core._SessionLocal = None
    
    yield sqlite_url
    
    # Clean up the temporary database file
    try:
        os.unlink(temp_db.name)
    except OSError:
        pass
    
    # Reset to None to allow normal operation
    backend.app.database_core._custom_database_url = None


@pytest.fixture(scope="session", autouse=True)
def initialize_test_database(test_database_url):
    """Initialize the test database with tables."""
    from backend.app.database_core import get_engine, Base
    
    # Import models to ensure SQLAlchemy knows about all tables
    from backend.app import models
    
    print("DEBUG: Initializing test database with tables...")
    
    # Get engine and create tables
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    
    print("DEBUG: Database tables created successfully")
    
    yield
    
    # Cleanup if needed
    pass


@pytest.fixture
def test_app(test_database_url):
    """
    Create a test-specific Flask app with minimal configuration.

    This can be used when you need more control over the app creation
    process than the standard create_app function provides.
    """
    app = Flask("test_app")
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = test_database_url
    app.config["REQUIRE_AUTH"] = False  # Disable auth for testing
    app.config["SKIP_MIDDLEWARE"] = True  # Skip middleware to avoid conflicts

    yield app


@pytest.fixture
def client(test_database_url):
    """
    Create a test client using the create_app function.
    
    This fixture creates a proper Flask app using the application factory
    and returns a test client for making requests.
    """
    from backend.app.app_factory import create_app
    
    # Create test configuration
    test_config = {
        "TESTING": True,
        "SKIP_MIDDLEWARE": True,  # Skip middleware to avoid conflicts
    }
    
    app = create_app(test_config)
    
    with app.test_client() as client:
        yield client


@pytest.fixture
def session_uuid(client):
    """
    Create a test user session and return its UUID.
    
    This fixture creates a test session in the database and returns the UUID.
    After the test completes, it cleans up by deleting the session.
    """
    from backend.app.repositories.factory import get_user_session_repository
    from backend.app.database_core import Base, get_engine
    
    # Ensure tables exist in the current database session
    Base.metadata.create_all(bind=get_engine())
    
    # Generate a unique UUID for this test
    test_uuid = str(uuid.uuid4())
    
    # Create the test session
    repo = get_user_session_repository()
    user_session = repo.create_session(
        session_uuid=test_uuid,
        name="Test User",
        email="test@example.com",
        consent_user_data=True
    )
    
    # Yield the UUID to the test
    yield test_uuid
    
    # Clean up after the test
    try:
        repo.delete_session(test_uuid)
    except Exception:
        # If deletion fails, that's okay - we tried to clean up
        pass
