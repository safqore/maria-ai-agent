"""
Comprehensive API integration tests for session endpoints.

This module tests the complete API integration including:
- All HTTP endpoints
- Request/response validation
- Error handling
- Rate limiting
- CORS handling
- Security scenarios
"""

import json
import uuid
from typing import Any, Dict
from unittest.mock import MagicMock, Mock, patch

import pytest
from app.app_factory import create_app
from app.models import UserSession
from app.routes.session import limiter
from app.services.session_service import SessionService
from flask import current_app


class TestSessionAPIIntegration:
    """Comprehensive API integration tests for session endpoints."""

    @pytest.fixture(scope="function")
    def app(self):
        """Create test application."""
        app = create_app()
        app.config["TESTING"] = True
        # Disable rate limiting for most tests
        app.config["RATELIMIT_ENABLED"] = False
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client."""
        with app.test_client() as client:
            yield client

    @pytest.fixture
    def app_context(self, app):
        """Create application context."""
        with app.app_context():
            yield app

    @pytest.fixture
    def mock_session_service(self, app_context):
        """Mock session service for consistent testing."""
        with patch("app.routes.session.SessionService") as mock_service_class:
            mock_service = Mock()
            mock_service_class.return_value = mock_service
            yield mock_service

    def teardown_method(self):
        """Reset rate limiter state after each test."""
        try:
            from app.routes.session import limiter
            from app.routes.upload import limiter as upload_limiter

            # Reset the in-memory storage for rate limiting for both limiters
            for lim in [limiter, upload_limiter]:
                if hasattr(lim, "_storage") and hasattr(lim._storage, "storage"):
                    lim._storage.storage.clear()
                elif hasattr(lim, "storage") and hasattr(lim.storage, "storage"):
                    lim.storage.storage.clear()
                elif hasattr(lim, "_storage") and hasattr(lim._storage, "reset"):
                    lim._storage.reset()
        except Exception as e:
            # Ignore any errors during cleanup but print for debugging
            print(f"Warning: Failed to clear rate limiter storage: {e}")
            pass

    # Generate UUID Endpoint Tests
    def test_generate_uuid_success(self, client, mock_session_service):
        """Test successful UUID generation."""
        # Setup mock response
        mock_session_service.generate_uuid.return_value = (
            {
                "status": "success",
                "uuid": "123e4567-e89b-12d3-a456-426614174000",
                "message": "Generated unique UUID",
                "details": {},
            },
            200,
        )

        response = client.post("/api/v1/generate-uuid")

        assert response.status_code == 200
        assert response.content_type == "application/json"

        data = response.get_json()
        assert data["status"] == "success"
        assert data["uuid"] == "123e4567-e89b-12d3-a456-426614174000"
        assert data["message"] == "Generated unique UUID"
        assert "details" in data

        mock_session_service.generate_uuid.assert_called_once()

    def test_generate_uuid_failure_max_retries(self, client, mock_session_service):
        """Test UUID generation failure after max retries."""
        mock_session_service.generate_uuid.return_value = (
            {
                "status": "error",
                "uuid": None,
                "message": "Could not generate unique UUID",
                "details": {
                    "reason": "Could not generate unique UUID after 3 attempts"
                },
            },
            500,
        )

        response = client.post("/api/v1/generate-uuid")

        assert response.status_code == 500
        data = response.get_json()
        assert data["status"] == "error"
        assert data["uuid"] is None
        assert "Could not generate unique UUID" in data["message"]

    def test_generate_uuid_options_request(self, client):
        """Test OPTIONS request for CORS preflight."""
        response = client.options("/api/v1/generate-uuid")

        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"

    def test_generate_uuid_wrong_method(self, client):
        """Test wrong HTTP method returns 405."""
        response = client.get("/api/v1/generate-uuid")
        assert response.status_code == 405

    # Validate UUID Endpoint Tests
    def test_validate_uuid_success(self, client, mock_session_service):
        """Test successful UUID validation."""
        test_uuid = str(uuid.uuid4())
        mock_session_service.validate_uuid.return_value = (
            {
                "status": "success",
                "uuid": test_uuid,
                "message": "UUID is valid and unique",
                "details": {},
            },
            200,
        )

        response = client.post("/api/v1/validate-uuid", json={"uuid": test_uuid})

        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"
        assert data["uuid"] == test_uuid

        mock_session_service.validate_uuid.assert_called_once_with(test_uuid)

    def test_validate_uuid_invalid_format(self, client, mock_session_service):
        """Test UUID validation with invalid format."""
        invalid_uuid = "not-a-uuid"

        # This should fail schema validation before reaching service
        response = client.post("/api/v1/validate-uuid", json={"uuid": invalid_uuid})

        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == "invalid"
        assert "Invalid UUID format" in data["message"]

    def test_validate_uuid_collision(self, client, mock_session_service):
        """Test UUID validation when UUID already exists."""
        test_uuid = str(uuid.uuid4())
        mock_session_service.validate_uuid.return_value = (
            {
                "status": "collision",
                "uuid": test_uuid,
                "message": "UUID already exists",
                "details": {"reason": "UUID already exists"},
            },
            409,
        )

        response = client.post("/api/v1/validate-uuid", json={"uuid": test_uuid})

        assert response.status_code == 409
        data = response.get_json()
        assert data["status"] == "collision"
        assert data["uuid"] == test_uuid

    def test_validate_uuid_missing_payload(self, client):
        """Test validation with missing request body."""
        response = client.post("/api/v1/validate-uuid", json={})

        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == "invalid"
        assert "details" in data

    def test_validate_uuid_no_json(self, client):
        """Test validation with no JSON body."""
        response = client.post("/api/v1/validate-uuid", data="not json")

        assert (
            response.status_code == 415
        )  # Unsupported Media Type is correct for non-JSON

    def test_validate_uuid_options_request(self, client):
        """Test OPTIONS request for CORS preflight."""
        response = client.options("/api/v1/validate-uuid")

        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"

    # Persist Session Endpoint Tests
    def test_persist_session_success(self, client, mock_session_service):
        """Test successful session persistence."""
        test_uuid = str(uuid.uuid4())
        mock_session_service.persist_session.return_value = (
            {"message": "Session persisted", "session_uuid": test_uuid},
            200,
        )

        response = client.post(
            "/api/v1/persist_session",
            json={
                "session_uuid": test_uuid,
                "name": "John Doe",
                "email": "john@example.com",
            },
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["message"] == "Session persisted"
        assert data["session_uuid"] == test_uuid

        mock_session_service.persist_session.assert_called_once_with(
            test_uuid, "John Doe", "john@example.com"
        )

    def test_persist_session_with_collision(self, client, mock_session_service):
        """Test session persistence with UUID collision."""
        old_uuid = str(uuid.uuid4())
        new_uuid = str(uuid.uuid4())

        mock_session_service.persist_session.return_value = (
            {"new_uuid": new_uuid, "message": "UUID collision, new UUID assigned"},
            200,
        )

        response = client.post(
            "/api/v1/persist_session",
            json={
                "session_uuid": old_uuid,
                "name": "John Doe",
                "email": "john@example.com",
            },
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["new_uuid"] == new_uuid
        assert "collision" in data["message"]

    def test_persist_session_invalid_uuid(self, client):
        """Test session persistence with invalid UUID."""
        response = client.post(
            "/api/v1/persist_session",
            json={
                "session_uuid": "not-a-uuid",
                "name": "John Doe",
                "email": "john@example.com",
            },
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_persist_session_missing_fields(self, client):
        """Test session persistence with missing required fields."""
        # Missing session_uuid
        response = client.post(
            "/api/v1/persist_session",
            json={"name": "John Doe", "email": "john@example.com"},
        )

        assert response.status_code == 400

    def test_persist_session_optional_fields(self, client, mock_session_service):
        """Test session persistence with optional fields."""
        test_uuid = str(uuid.uuid4())
        mock_session_service.persist_session.return_value = (
            {"message": "Session persisted", "session_uuid": test_uuid},
            200,
        )

        # Only session_uuid provided, name and email should default to empty
        response = client.post(
            "/api/v1/persist_session", json={"session_uuid": test_uuid}
        )

        assert response.status_code == 200

        # Verify service was called with empty defaults
        mock_session_service.persist_session.assert_called_once_with(test_uuid, "", "")

    def test_persist_session_options_request(self, client):
        """Test OPTIONS request for CORS preflight."""
        response = client.options("/api/v1/persist_session")

        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"

    # Rate Limiting Tests
    @pytest.mark.skip(
        reason="Rate limiting tests are unreliable with in-memory storage in test environments"
    )
    @pytest.mark.parametrize(
        "endpoint,method,payload",
        [
            ("/api/v1/generate-uuid", "post", None),
            (
                "/api/v1/validate-uuid",
                "post",
                {"uuid": "123e4567-e89b-42d3-a456-426614174000"},
            ),
        ],
    )
    def test_rate_limiting_enabled(self, client, endpoint, method, payload):
        """Test rate limiting is enforced when enabled."""
        # Enable rate limiting for this test
        current_app.config["RATELIMIT_ENABLED"] = True

        # Make multiple requests quickly
        for i in range(3):
            if method == "post":
                response = client.post(endpoint, json=payload)
            else:
                response = client.get(endpoint)

            # First few requests should succeed
            if i < 2:
                assert response.status_code == 200
            else:
                # This request should be rate limited
                assert response.status_code == 429

    @pytest.mark.skip(
        reason="Rate limiting tests are unreliable with in-memory storage in test environments"
    )
    def test_rate_limiting_different_ips(self, client):
        """Test rate limiting is per IP address."""
        current_app.config["RATELIMIT_ENABLED"] = True

        # Make requests from different IP addresses
        # IP 1
        for i in range(3):
            response = client.post(
                "/api/v1/generate-uuid",
                environ_overrides={"REMOTE_ADDR": "192.168.1.1"},
            )
            if i < 2:
                assert response.status_code == 200
            else:
                assert response.status_code == 429

        # IP 2 should have separate rate limit
        response = client.post(
            "/api/v1/generate-uuid", environ_overrides={"REMOTE_ADDR": "192.168.1.2"}
        )
        assert response.status_code == 200

    # Error Handling Tests
    def test_service_exception_handling(self, client, mock_session_service):
        """Test that service exceptions are handled gracefully."""
        mock_session_service.generate_uuid.side_effect = Exception("Database error")

        response = client.post("/api/v1/generate-uuid")

        # Should return 500 with error message
        assert response.status_code == 500
        # The exact error handling depends on your error handling implementation

    def test_malformed_json_handling(self, client):
        """Test handling of malformed JSON."""
        response = client.post(
            "/api/v1/validate-uuid",
            data="{invalid json}",
            content_type="application/json",
        )

        assert response.status_code == 400

    def test_large_payload_handling(self, client):
        """Test handling of unusually large payloads."""
        large_uuid = "a" * 1000  # Very long string

        response = client.post("/api/v1/validate-uuid", json={"uuid": large_uuid})

        assert response.status_code == 400

    # Security Tests
    def test_sql_injection_attempt(self, client):
        """Test that SQL injection attempts are handled safely."""
        malicious_uuid = "'; DROP TABLE users; --"

        response = client.post("/api/v1/validate-uuid", json={"uuid": malicious_uuid})

        # Should be caught by UUID format validation
        assert response.status_code == 400

    def test_xss_attempt(self, client):
        """Test that XSS attempts are handled safely."""
        xss_uuid = "<script>alert('xss')</script>"

        response = client.post("/api/v1/validate-uuid", json={"uuid": xss_uuid})

        assert response.status_code == 400

    # Content Type Tests
    def test_wrong_content_type(self, client):
        """Test handling of wrong content type."""
        response = client.post(
            "/api/v1/validate-uuid", data='{"uuid":"test"}', content_type="text/plain"
        )

        # Should require application/json - 415 is correct for unsupported media type
        assert response.status_code == 415

    def test_missing_content_type(self, client):
        """Test handling of missing content type."""
        response = client.post("/api/v1/validate-uuid", data='{"uuid":"test"}')

        assert (
            response.status_code == 415
        )  # Unsupported Media Type for missing content type

    # Integration Tests with Real Service (Optional)
    def test_end_to_end_uuid_workflow(self, client):
        """Test complete UUID workflow from generation to validation."""
        # This test uses the real service (no mocking) for integration testing

        # Generate a UUID
        gen_response = client.post("/api/v1/generate-uuid")
        assert gen_response.status_code == 200

        gen_data = gen_response.get_json()
        generated_uuid = gen_data["uuid"]

        # Validate the generated UUID (should be successful since it's new)
        val_response = client.post(
            "/api/v1/validate-uuid", json={"uuid": generated_uuid}
        )
        assert val_response.status_code == 200

        val_data = val_response.get_json()
        assert val_data["status"] == "success"
        assert val_data["uuid"] == generated_uuid

    # Performance Tests
    @pytest.mark.sqlite_incompatible
    @pytest.mark.skipif(
        True,  # Always skip this test for now due to SQLite thread safety issues
        reason="SQLite has thread safety issues with concurrent access",
    )
    def test_concurrent_requests(self, app):
        """Test concurrent requests to the API."""
        import threading
        import time

        results = []
        errors = []

        def make_request():
            """Make a request in a separate thread."""
            try:
                # Create a completely separate client instance for this thread
                # Do NOT use context manager to avoid nesting issues
                thread_client = app.test_client()

                response = thread_client.post("/api/v1/generate-uuid")
                results.append(response.status_code)

                if response.status_code != 200:
                    errors.append(
                        f"Status {response.status_code}: {response.get_json()}"
                    )

            except Exception as e:
                errors.append(f"Exception: {str(e)}")

        # Create and start threads
        threads = []
        for i in range(3):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join(timeout=10)  # 10 second timeout

        # Check results
        print(f"Concurrent test results: {results}")
        print(f"Concurrent test errors: {errors}")

        # Most requests should succeed (some may fail due to rate limiting)
        successful_requests = [r for r in results if r == 200]
        assert (
            len(successful_requests) >= 1
        ), f"At least one request should succeed. Results: {results}, Errors: {errors}"

    # Edge Cases
    def test_empty_json_body(self, client):
        """Test handling of empty JSON body."""
        response = client.post("/api/v1/validate-uuid", json={})

        assert response.status_code == 400

    def test_null_values(self, client):
        """Test handling of null values in JSON."""
        response = client.post("/api/v1/validate-uuid", json={"uuid": None})

        assert response.status_code == 400

    def test_numeric_uuid_value(self, client):
        """Test handling of numeric UUID value."""
        response = client.post("/api/v1/validate-uuid", json={"uuid": 123456})

        assert response.status_code == 400

    def test_boolean_uuid_value(self, client):
        """Test handling of boolean UUID value."""
        response = client.post("/api/v1/validate-uuid", json={"uuid": True})

        assert response.status_code == 400

    # Helper methods for test utilities
    def _generate_valid_uuid(self) -> str:
        """Generate a valid UUID for testing."""
        return str(uuid.uuid4())

    def _create_test_session_data(self, session_uuid: str = None) -> Dict[str, Any]:
        """Create test session data."""
        return {
            "session_uuid": session_uuid or self._generate_valid_uuid(),
            "name": "Test User",
            "email": "test@example.com",
        }
