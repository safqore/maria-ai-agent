"""
Integration tests for session API endpoints.

This module tests the session API endpoints with middleware integration.
"""

import importlib
import json
import sys
import uuid
from unittest import mock

import pytest
from flask import Flask, current_app, jsonify, request  # Add request import here
from tests.mocks.database import (
    GUID,
    Base,
    SessionLocal,
    engine,
    get_db_session,
    get_engine,
    get_session_local,
    init_database,
)

# Import our mocked modules for SQLite compatibility
from tests.mocks.models import UserSession
from tests.mocks.repositories import UserSessionRepository


@pytest.fixture
def app(request):
    """Create a Flask application for testing using the real app factory."""
    import os
    import sys
    from unittest.mock import MagicMock, patch

    # Set up patching for database module before importing app factory
    sys.modules["backend.app.models"] = MagicMock()
    sys.modules["backend.app.models"].UserSession = UserSession

    sys.modules["app.repositories.user_session_repository"] = MagicMock()
    sys.modules["app.repositories.user_session_repository"].UserSessionRepository = (
        UserSessionRepository
    )

    # Only patch for specific collision tests to avoid interfering with regular tests
    # This patching is moved to the specific test methods that need it

    # Patch the database functions
    import app.database as database

    database.get_db_session = get_db_session
    database.get_engine = get_engine
    database.get_session_local = get_session_local
    database.Base = Base
    database.init_database = init_database
    database.engine = engine
    database.SessionLocal = SessionLocal

    # CRITICAL: Also patch the core database module that TransactionContext uses
    import app.database_core as database_core

    database_core.get_db_session = get_db_session
    database_core.get_engine = get_engine
    database_core.get_session_local = get_session_local
    database_core.Base = Base
    database_core.init_database = init_database
    database_core.engine = engine
    database_core.SessionLocal = SessionLocal

    # Also patch the transaction module to use the test database
    import app.database.transaction as transaction_module

    transaction_module.get_session_local = get_session_local
    transaction_module.get_engine = get_engine

    # Replace TransactionContext with test version
    from tests.mocks.transaction import TransactionContext as TestTransactionContext

    transaction_module.TransactionContext = TestTransactionContext

    # Create database tables
    init_database()

    # Import app factory after patching
    from app.app_factory import create_app

    # Create test configuration
    test_config = {
        "TESTING": True,
        "SKIP_MIDDLEWARE": True,
        "REQUIRE_AUTH": False,
        "RATELIMIT_ENABLED": False,
    }

    # Create app without test_config parameter
    app = create_app()

    # Set test configuration after app creation
    app.config.update(test_config)

    return app


@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()


@pytest.fixture
def session_uuid():
    """Generate a test session UUID."""
    return str(uuid.uuid4())


@pytest.fixture
def test_session(app, session_uuid):
    """Create a test session in the database."""
    # Use app context to ensure proper database setup
    with app.app_context():
        repo = UserSessionRepository()
        repo.create(
            uuid=session_uuid,
            name="Test User",
            email="test@example.com",
            consent_user_data=True,
            ip_address="127.0.0.1",
        )
        # Return the provided session UUID string directly to avoid DetachedInstanceError
        return session_uuid


class TestSessionAPI:
    """Test suite for session API endpoints."""

    def test_generate_uuid_legacy(self, client):
        """Test generate-uuid endpoint (legacy route)."""
        # Test with correlation ID
        correlation_id = str(uuid.uuid4())
        response = client.post(
            "/api/v1/generate-uuid", headers={"X-Correlation-ID": correlation_id}
        )

        assert response.status_code == 200
        assert "uuid" in response.json
        assert "X-Correlation-ID" in response.headers
        assert response.headers["X-Correlation-ID"] == correlation_id

        # Validate the generated UUID format
        try:
            uuid.UUID(response.json["uuid"])
            is_valid_uuid = True
        except ValueError:
            is_valid_uuid = False

        assert is_valid_uuid

    def test_generate_uuid_versioned(self, client):
        """Test generate-uuid endpoint (versioned route)."""
        response = client.post("/api/v1/generate-uuid")

        assert response.status_code == 200
        assert "uuid" in response.json
        assert "X-Correlation-ID" in response.headers
        assert "X-API-Version" in response.headers
        assert response.headers["X-API-Version"] == "v1"

    def test_validate_uuid_legacy_valid(self, client, test_session):
        """Test validate-uuid endpoint with valid UUID (legacy route)."""
        response = client.post(
            "/api/v1/validate-uuid",
            json={"uuid": test_session},
            content_type="application/json",
        )

        assert response.status_code == 200
        assert "status" in response.json
        assert response.json["status"] == "success"
        assert "uuid" in response.json
        assert response.json["uuid"] == test_session
        assert "X-Correlation-ID" in response.headers

    def test_validate_uuid_legacy_invalid(self, client):
        """Test validate-uuid endpoint with invalid UUID (legacy route)."""
        response = client.post(
            "/api/v1/validate-uuid",
            json={"uuid": "not-a-uuid"},
            content_type="application/json",
        )

        assert response.status_code == 400
        assert "message" in response.json
        assert "status" in response.json
        assert response.json["status"] == "invalid"
        assert "X-Correlation-ID" in response.headers

    def test_validate_uuid_invalid_json(self, client):
        """Test validate-uuid endpoint with invalid JSON."""
        response = client.post(
            "/api/v1/validate-uuid",
            data="invalid-json",
            content_type="application/json",
        )

        assert response.status_code == 400
        assert "error" in response.json
        assert "Invalid JSON format" in response.json.get("message", "")
        assert "correlation_id" in response.json

    def test_validate_uuid_versioned(self, client, test_session):
        """Test validate-uuid endpoint (versioned route)."""
        response = client.post(
            "/api/v1/validate-uuid",
            json={"uuid": test_session},
            content_type="application/json",
        )

        assert response.status_code == 200
        assert "status" in response.json
        assert response.json["status"] == "success"
        assert "uuid" in response.json
        assert response.json["uuid"] == test_session
        assert "X-Correlation-ID" in response.headers
        assert "X-API-Version" in response.headers
        assert response.headers["X-API-Version"] == "v1"

    def test_persist_session_legacy(self, client, test_session):
        """Test persist_session endpoint (legacy route)."""
        response = client.post(
            "/api/v1/persist_session",
            json={
                "session_uuid": test_session,
                "name": "Test User",
                "email": "test@example.com",
            },
            content_type="application/json",
        )

        assert (
            response.status_code == 201
        )  # 201 Created is correct for resource creation
        assert "X-Correlation-ID" in response.headers

    def test_persist_session_versioned(self, client, test_session):
        """Test persist_session endpoint (versioned route)."""
        response = client.post(
            "/api/v1/persist_session",
            json={
                "session_uuid": test_session,
                "name": "Test User",
                "email": "test@example.com",
            },
            content_type="application/json",
        )

        assert (
            response.status_code == 201
        )  # 201 Created is correct for resource creation
        assert "X-Correlation-ID" in response.headers
        assert "X-API-Version" in response.headers
        assert response.headers["X-API-Version"] == "v1"

    def test_persist_session_invalid_uuid(self, client):
        """Test persist_session endpoint with invalid UUID."""
        response = client.post(
            "/api/v1/persist_session",
            json={
                "session_uuid": "invalid-uuid",
                "name": "Test User",
                "email": "test@example.com",
            },
            content_type="application/json",
        )

        # Invalid UUID should return 400 Bad Request
        assert response.status_code == 400
        assert "error" in response.json
        assert "details" in response.json
        assert "X-Correlation-ID" in response.headers

    def test_api_info_endpoint(self, client):
        """Test API info endpoint."""
        response = client.get("/api/info")

        assert response.status_code == 200
        assert "name" in response.json
        assert "version" in response.json
        assert "endpoints" in response.json
        assert "X-Correlation-ID" in response.headers
        assert "X-API-Version" in response.headers

    def test_persist_session_missing_fields(self, client, test_session):
        """Test persist_session endpoint with missing fields."""
        # Test with missing name
        response = client.post(
            "/api/v1/persist_session",
            json={
                "session_uuid": test_session,
                "email": "test@example.com",
                # No name field - this is optional
            },
            content_type="application/json",
        )

        # This should create a new session successfully with 201 status
        assert response.status_code == 201
        assert "message" in response.json
        assert "uuid" in response.json
        assert response.json["uuid"] == test_session
        assert "X-Correlation-ID" in response.headers

        # Test with missing session_uuid (required field)
        response = client.post(
            "/api/v1/persist_session",
            json={
                "name": "Test User",
                "email": "test@example.com",
                # No session_uuid field
            },
            content_type="application/json",
        )

        assert response.status_code == 400
        assert "error" in response.json
        assert "details" in response.json
        assert "X-Correlation-ID" in response.headers

    def test_persist_session_new_uuid_on_collision(self, client, test_session):
        """Test persist_session endpoint with UUID collision."""
        # Mock the S3 migration function to prevent AWS errors in tests
        with mock.patch(
            "app.services.session_service.migrate_s3_files"
        ) as mock_migrate:
            # First create a session with the test UUID
            response = client.post(
                "/api/v1/persist_session",
                json={
                    "session_uuid": test_session,
                    "name": "Test User",
                    "email": "test@example.com",
                },
                content_type="application/json",
            )

            assert response.status_code == 201  # First creation should return 201

            # Now try to create another session with the same UUID
            response = client.post(
                "/api/v1/persist_session",
                json={
                    "session_uuid": test_session,
                    "name": "Another User",
                    "email": "another@example.com",
                },
                content_type="application/json",
            )

            # Should return a new UUID due to collision with 200 status
            assert response.status_code == 200
            assert "new_uuid" in response.json
            assert "message" in response.json
            assert "UUID collision, new UUID assigned" in response.json["message"]
            assert "X-Correlation-ID" in response.headers

            # Verify the new UUID is valid
            new_uuid = response.json["new_uuid"]
            try:
                uuid.UUID(new_uuid)
                is_valid_uuid = True
            except ValueError:
                is_valid_uuid = False

            assert is_valid_uuid

            # Verify that S3 migration was called
            assert (
                mock_migrate.called
            ), "S3 migration should be called for collision handling"

    def test_validate_uuid_nonexistent(self, client):
        """Test validate-uuid endpoint with non-existent but valid UUID."""
        # Generate a UUID that doesn't exist in database
        non_existent_uuid = str(uuid.uuid4())

        response = client.post(
            "/api/v1/validate-uuid",
            json={"uuid": non_existent_uuid},
            content_type="application/json",
        )

        # Should be valid since it's well-formed and doesn't exist
        assert response.status_code == 200
        assert "status" in response.json
        assert response.json["status"] == "success"
        assert response.json["uuid"] == non_existent_uuid
        assert "X-Correlation-ID" in response.headers

    def test_validate_uuid_empty(self, client):
        """Test validate-uuid endpoint with empty UUID."""
        response = client.post(
            "/api/v1/validate-uuid", json={"uuid": ""}, content_type="application/json"
        )

        assert response.status_code == 400
        assert "status" in response.json
        assert response.json["status"] == "invalid"
        assert "details" in response.json
        assert "X-Correlation-ID" in response.headers

    def test_validate_uuid_missing_field(self, client):
        """Test validate-uuid endpoint with missing UUID field."""
        response = client.post(
            "/api/v1/validate-uuid",
            json={},
            content_type="application/json",  # Empty JSON
        )

        assert response.status_code == 400
        assert "error" in response.json or "status" in response.json
        assert "X-Correlation-ID" in response.headers

    def test_validate_uuid_malformed(self, client):
        """Test validate-uuid endpoint with malformed UUID."""
        response = client.post(
            "/api/v1/validate-uuid",
            json={"uuid": "123-456-not-a-valid-uuid"},
            content_type="application/json",
        )

        assert response.status_code == 400
        assert "status" in response.json
        assert response.json["status"] == "invalid"
        assert "details" in response.json
        assert "uuid" in response.json["details"]
        assert "X-Correlation-ID" in response.headers

    def test_rate_limiting(self, app, client):
        """Test rate limiting on endpoints."""
        # Note: Since we're using a custom test app setup,
        # rate limiting isn't properly configured. This is
        # a placeholder test that will be skipped.

        # Instead of actual testing, we verify that the endpoint works
        response = client.post("/api/v1/generate-uuid")

        # Just verify the endpoint responds
        assert response.status_code == 200
        assert "uuid" in response.json
        assert "X-Correlation-ID" in response.headers

        # Add a note that this is a placeholder
        pytest.skip("Rate limiting tests require a different test setup")

    def test_generate_uuid_correlation_id_propagation(self, client):
        """Test correlation ID propagation through generate-uuid endpoint."""
        custom_correlation_id = str(uuid.uuid4())
        response = client.post(
            "/api/v1/generate-uuid", headers={"X-Correlation-ID": custom_correlation_id}
        )

        assert response.status_code == 200
        assert "X-Correlation-ID" in response.headers
        assert response.headers["X-Correlation-ID"] == custom_correlation_id

    def test_validate_uuid_collision(self, client):
        """Test validate-uuid endpoint with colliding UUID."""
        # Create a new session UUID
        new_test_uuid = str(uuid.uuid4())

        # Set up repository patching for this specific test
        from tests.mocks.repositories import UserSessionRepository

        test_repo = UserSessionRepository()

        # Patch the service to use our shared mock repository
        import app.services.session_service as session_service_module

        original_session_service_init = session_service_module.SessionService.__init__

        def patched_init(self):
            self.user_session_repository = test_repo

        session_service_module.SessionService.__init__ = patched_init

        try:
            # First ensure the session exists in the database
            with client.application.app_context():
                # Use the same repository instance that the service will use
                test_repo.create(
                    uuid=new_test_uuid,
                    name="Test User",
                    email="test@example.com",
                    consent_user_data=True,
                    ip_address="127.0.0.1",
                )
                # Check existence the same way the service does - with UUID object
                uuid_obj = uuid.UUID(new_test_uuid)
                exists = test_repo.exists(uuid_obj)
                assert exists is True

            # Test with an existing UUID (should report collision)
            response = client.post(
                "/api/v1/validate-uuid",
                json={"uuid": new_test_uuid},
                content_type="application/json",
            )

            assert response.status_code == 409
        finally:
            # Restore original SessionService initialization
            session_service_module.SessionService.__init__ = (
                original_session_service_init
            )
        assert "status" in response.json
        assert response.json["status"] == "collision"
        assert response.json["uuid"] == new_test_uuid
        assert "message" in response.json
        assert "X-API-Version" in response.headers
        assert "X-Correlation-ID" in response.headers

    def test_options_request_handling(self, client):
        """Test OPTIONS requests are handled correctly."""
        response = client.options("/api/v1/generate-uuid")

        assert response.status_code == 200
        assert "Access-Control-Allow-Origin" in response.headers
        assert "Access-Control-Allow-Methods" in response.headers
        assert "Access-Control-Allow-Headers" in response.headers

    def test_persist_session_invalid_email(self, client, test_session):
        """Test persist_session endpoint with invalid email format."""
        # Test with invalid email format
        response = client.post(
            "/api/v1/persist_session",
            json={
                "session_uuid": test_session,
                "name": "Test User",
                "email": "not-an-email",  # Not a valid email format
            },
            content_type="application/json",
        )

        # Email format validation is not enforced in the current schema
        # This should still succeed as we don't validate email format
        assert response.status_code == 201  # Should return 201 for new session creation
        assert "message" in response.json
        assert "session_uuid" in response.json
        assert response.json["session_uuid"] == test_session
        assert "X-Correlation-ID" in response.headers

    def test_persist_session_with_correlation_id(self, client, test_session):
        """Test persist_session endpoint with custom correlation ID."""
        custom_correlation_id = str(uuid.uuid4())
        response = client.post(
            "/api/v1/persist_session",
            json={
                "session_uuid": test_session,
                "name": "Test User",
                "email": "test@example.com",
            },
            headers={"X-Correlation-ID": custom_correlation_id},
            content_type="application/json",
        )

        assert response.status_code == 201  # Should return 201 for new session creation
        assert "message" in response.json
        assert "X-Correlation-ID" in response.headers
        assert response.headers["X-Correlation-ID"] == custom_correlation_id

    def test_generate_uuid_invalid_http_method(self, client):
        """Test generate-uuid endpoint with invalid HTTP method."""
        # GET method is not allowed for this endpoint
        response = client.get("/api/v1/generate-uuid")

        assert response.status_code == 405

        # Parse the response data to check for error
        try:
            data = response.get_json()
            if data:
                assert "error" in data or "message" in data
        except (ValueError, TypeError):
            # If the response is not valid JSON, just check headers
            assert response.headers.get("Allow", "").strip()

        # Check Allow header is present (standard for 405)
        assert "Allow" in response.headers
        assert "X-Correlation-ID" in response.headers

    def test_session_endpoint_versioning(self, client, test_session):
        """Test that session endpoints maintain consistent versioning."""
        # Check if all endpoints have consistent versioning headers
        endpoints = [
            {"method": "post", "url": "/api/v1/generate-uuid", "data": {}},
            {
                "method": "post",
                "url": "/api/v1/validate-uuid",
                "data": {"uuid": test_session},
            },
            {
                "method": "post",
                "url": "/api/v1/persist_session",
                "data": {
                    "session_uuid": test_session,
                    "name": "Test User",
                    "email": "test@example.com",
                },
            },
        ]

        for endpoint in endpoints:
            method = getattr(client, endpoint["method"])
            response = method(
                endpoint["url"], json=endpoint["data"], content_type="application/json"
            )

            # Check that status is successful (2xx)
            assert 200 <= response.status_code < 300

            # Check versioning headers
            assert "X-API-Version" in response.headers
            assert response.headers["X-API-Version"] == "v1"
            assert "X-Correlation-ID" in response.headers

    def test_invalid_content_type(self, client, test_session):
        """Test endpoints with invalid content type."""
        response = client.post(
            "/api/v1/validate-uuid",
            data=json.dumps({"uuid": test_session}),
            content_type="text/plain",  # Invalid content type
        )

        # The app should return a 415 Unsupported Media Type
        assert response.status_code == 415
        assert "error" in response.json
        assert "message" in response.json
        assert "Content-Type" in response.json["message"]
        assert "X-Correlation-ID" in response.headers


class TestSessionRepositoryIntegration:
    """Test integration between session API and repository."""

    def test_session_persist_database_update(self, client):
        """Test that session persistence updates the database."""
        # Generate a new UUID
        response = client.post("/api/v1/generate-uuid")
        assert response.status_code == 200
        generated_uuid = response.json["uuid"]

        # Persist the session
        test_name = "Integration Test User"
        test_email = "integration@test.com"
        response = client.post(
            "/api/v1/persist_session",
            json={
                "session_uuid": generated_uuid,
                "name": test_name,
                "email": test_email,
            },
            content_type="application/json",
        )
        assert response.status_code == 201  # Should return 201 for new session creation

        # Force a small delay to ensure transaction is committed
        import time

        time.sleep(0.01)

        # Verify the session was stored in the database using the real database
        with client.application.app_context():
            import uuid as uuid_module

            from app.repositories.factory import get_user_session_repository

            repo = get_user_session_repository()
            uuid_obj = uuid_module.UUID(generated_uuid)
            session = repo.get_by_uuid(uuid_obj)

            assert session is not None
            assert str(session.uuid) == generated_uuid
            assert session.name == test_name
            assert session.email == test_email

    def test_session_validation_database_check(self, client):
        """Test that UUID validation checks the database."""
        # Generate a completely new UUID for this test to avoid conflicts
        new_test_uuid = str(uuid.uuid4())

        # Create a session with the new UUID using the real repository
        with client.application.app_context():
            import uuid as uuid_module

            from app.repositories.factory import get_user_session_repository

            repo = get_user_session_repository()
            uuid_obj = uuid_module.UUID(new_test_uuid)

            # First ensure the UUID doesn't already exist
            if repo.exists(uuid_obj):
                # If it does, generate another one
                new_test_uuid = str(uuid.uuid4())
                uuid_obj = uuid_module.UUID(new_test_uuid)

            # Create a new session with our guaranteed unique UUID
            session = repo.create_session(
                session_uuid=new_test_uuid,
                name="Test User",
                email="test@example.com",
                consent_user_data=True,
            )
            assert session is not None

            # Verify it exists
            exists = repo.exists(uuid_obj)
            assert exists is True

        # Check validation correctly reports collision
        response = client.post(
            "/api/v1/validate-uuid",
            json={"uuid": new_test_uuid},
            content_type="application/json",
        )
        assert response.status_code == 409
        assert response.json["status"] == "collision"

        # Now delete the session from the database
        with client.application.app_context():
            repo.delete_session(uuid_obj)

        # Validation should now report success (no collision)
        response = client.post(
            "/api/v1/validate-uuid",
            json={"uuid": new_test_uuid},
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.json["status"] == "success"
