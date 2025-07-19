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
from app import models
from app.database_core import Base, get_engine, init_database
from flask import Flask
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker


@pytest.fixture(scope="session", autouse=True)
def initialize_test_database():
    """Initialize the test database with proper schema and migrations."""
    print("DEBUG: Initializing test database with migrations...")

    # Force initialization of database
    init_database()

    # Get engine and database URL
    engine = get_engine()
    db_url = str(engine.url)
    print(f"DEBUG: Database URL: {db_url}")

    # Check if we're using PostgreSQL or SQLite
    is_postgres = db_url.startswith("postgresql://")
    is_sqlite = db_url.startswith("sqlite://")

    if is_postgres:
        print("DEBUG: Using PostgreSQL - migrations should already be applied by CI")
        # In CI, migrations are already applied, just verify tables exist
        try:
            inspector = inspect(engine)
            table_names = inspector.get_table_names()
            print(f"DEBUG: Existing tables: {table_names}")

            # Verify required tables exist
            required_tables = ["user_sessions"]
            missing_tables = [t for t in required_tables if t not in table_names]
            if missing_tables:
                raise Exception(f"Required tables missing: {missing_tables}")

        except Exception as e:
            print(f"DEBUG: Error checking PostgreSQL tables: {e}")
            # If verification fails, try creating with ORM
            import app.models
            from app.models import UserSession

            Base.metadata.create_all(bind=engine)

    elif is_sqlite:
        print("DEBUG: Using SQLite - setting up tables with ORM")

        # For file-based SQLite, clean up any existing database file
        if not db_url.endswith(":memory:"):
            import os
            import tempfile

            test_db_path = os.path.join(tempfile.gettempdir(), "maria_ai_test.db")
            if os.path.exists(test_db_path):
                try:
                    os.remove(test_db_path)
                    print(f"DEBUG: Removed existing test database: {test_db_path}")
                except Exception as e:
                    print(f"DEBUG: Could not remove existing test database: {e}")

            # Re-initialize engine after cleanup
            init_database()
            engine = get_engine()

        # Make sure all models are imported so their tables are created
        import app.models
        from app.models import UserSession

        # Force import of all models by accessing them
        print(
            f"DEBUG: Imported models: {[cls.__name__ for cls in Base.registry._class_registry.values() if hasattr(cls, '__table__')]}"
        )

        # Create all tables (no need to drop for fresh file)
        Base.metadata.create_all(bind=engine)
        print("DEBUG: Created tables with ORM")

    # Verify final table state
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    print(f"DEBUG: Final tables: {table_names}")

    # Ensure user_sessions table exists
    if "user_sessions" not in table_names:
        print("DEBUG: user_sessions table missing, creating manually")
        from app.models import UserSession

        UserSession.__table__.create(bind=engine, checkfirst=True)
        # Verify again
        table_names = inspector.get_table_names()
        print(f"DEBUG: Tables after manual creation: {table_names}")

    print("DEBUG: Database initialization complete!")

    yield

    # Cleanup - remove test database file
    if is_sqlite and not db_url.endswith(":memory:"):
        import os
        import tempfile

        test_db_path = os.path.join(tempfile.gettempdir(), "maria_ai_test.db")
        if os.path.exists(test_db_path):
            try:
                os.remove(test_db_path)
                print("DEBUG: Test database file cleaned up")
            except Exception as e:
                print(f"DEBUG: Error cleaning up test database file: {e}")
    elif is_sqlite:
        try:
            Base.metadata.drop_all(bind=engine)
            print("DEBUG: In-memory database tables cleaned up")
        except Exception as e:
            print(f"DEBUG: Error cleaning up database: {e}")


@pytest.fixture(scope="function")
def app():
    """
    Create a test Flask app with proper configuration.

    This fixture creates a function-scoped app to ensure test isolation
    and prevent issues between tests.
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

    # For function-scoped tests, we don't need to recreate tables
    # They should already exist from the session-scoped fixture
    with flask_app.app_context():
        init_database()
        engine = get_engine()

        # Verify tables exist
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"DEBUG: App fixture - existing tables: {tables}")

        # Only create tables if they don't exist
        if "user_sessions" not in tables:
            print("DEBUG: App fixture - creating missing tables")
            import app.models
            from app.models import UserSession

            Base.metadata.create_all(bind=engine)

    yield flask_app

    # No cleanup needed - session fixture handles database cleanup


@pytest.fixture
def client(app):
    """
    Create a test client using the app fixture.

    This fixture creates a test client from the app fixture,
    ensuring proper test isolation and configuration.
    Each test gets its own client instance to prevent thread sharing.
    """
    with app.test_client() as client:
        yield client


@pytest.fixture
def isolated_client(app):
    """
    Create an isolated test client for concurrent tests.

    This fixture creates a completely separate client instance
    for tests that need to run concurrently without sharing state.
    """
    # Create a new client instance for each test
    # Do NOT use context manager to avoid "Cannot nest client invocations"
    client = app.test_client()
    try:
        yield client
    finally:
        # Ensure client is properly closed
        if hasattr(client, "close"):
            client.close()


@pytest.fixture
def session_uuid(client):
    """
    Create a test user session and return its UUID.

    This fixture creates a test session in the database and returns the UUID object.
    After the test completes, it cleans up by deleting the session.
    """
    from app.database_core import Base, get_engine
    from app.repositories.factory import get_user_session_repository

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
