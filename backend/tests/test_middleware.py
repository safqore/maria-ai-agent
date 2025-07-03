"""
Tests for the middleware module.
"""

import json
from unittest.mock import MagicMock, patch

import pytest
from flask import Flask, g, jsonify, request

from backend.app.utils.middleware import (
    extract_correlation_id,
    generate_request_id,
    log_request_middleware,
    setup_request_logging,
    setup_request_validation,
    validate_json_middleware,
)


class TestMiddleware:
    @pytest.fixture
    def app(self):
        """Create a Flask test application."""
        app = Flask(__name__)

        @app.route("/test")
        def test_route():
            return {"message": "test"}

        @app.route("/test-json", methods=["POST"])
        def test_json():
            data = request.get_json()
            return jsonify({"received": data})

        return app

    def test_log_request_middleware_before_request(self, app):
        """Test that before_request middleware sets request timing and ID."""
        before_request, _ = log_request_middleware()

        with app.test_request_context("/test"):
            before_request()
            assert hasattr(g, "request_start_time")
            assert hasattr(g, "correlation_id")
            assert isinstance(g.correlation_id, str)

    def test_log_request_middleware_after_request(self, app):
        """Test that after_request middleware logs and adds headers."""
        before_request, after_request = log_request_middleware()

        with app.test_request_context("/test"):
            before_request()
            response = app.make_response(("test", 200))
            processed_response = after_request(response)

            # Check that correlation ID was added to headers
            assert "X-Correlation-ID" in processed_response.headers
            assert processed_response.headers["X-Correlation-ID"] == g.correlation_id

    @patch("backend.app.utils.middleware.logger")
    def test_middleware_logs_requests(self, mock_logger, app):
        """Test that the middleware logs request information."""
        with app.test_request_context("/test", method="GET"):
            before_request, after_request = log_request_middleware()
            before_request()
            response = app.make_response(("test", 200))
            after_request(response)

        # Check that logger was called
        mock_logger.info.assert_called()

    def test_extract_correlation_id_from_header(self, app):
        """Test that correlation ID is extracted from header if valid."""
        test_id = "550e8400-e29b-41d4-a716-446655440000"

        with app.test_request_context(headers={"X-Correlation-ID": test_id}):
            result = extract_correlation_id()
            assert result == test_id

    def test_extract_correlation_id_generates_new_for_invalid(self, app):
        """Test that correlation ID is generated if header value is invalid."""
        with app.test_request_context(headers={"X-Correlation-ID": "invalid-uuid"}):
            result = extract_correlation_id()
            assert result != "invalid-uuid"

            # Verify it's a valid UUID
            import uuid

            try:
                uuid.UUID(result)
                is_valid = True
            except ValueError:
                is_valid = False
            assert is_valid

    def test_validate_json_middleware_valid(self, app):
        """Test JSON validation middleware with valid JSON."""
        client = app.test_client()

        # Set up middleware
        before_request = validate_json_middleware()
        app.before_request(before_request)

        response = client.post(
            "/test-json",
            data=json.dumps({"test": "data"}),
            content_type="application/json",
        )

        assert response.status_code == 200
        assert response.json["received"]["test"] == "data"

    def test_validate_json_middleware_invalid(self, app):
        """Test JSON validation middleware with invalid JSON."""
        client = app.test_client()

        # Set up middleware
        before_request = validate_json_middleware()
        app.before_request(before_request)

        response = client.post(
            "/test-json",
            data='{"invalid": "json"',  # Incomplete JSON
            content_type="application/json",
        )

        assert response.status_code == 400
        assert "error" in response.json
        assert "Invalid JSON format" in response.json["error"]

    def test_setup_request_validation(self, app):
        """Test that setup_request_validation registers middleware."""
        with patch.object(app, "before_request") as mock_before_request:
            setup_request_validation(app)
            assert mock_before_request.called

    def test_request_validation_skips_non_json(self, app):
        """Test that request validation skips non-JSON requests."""
        client = app.test_client()

        # Set up middleware
        before_request = validate_json_middleware()
        app.before_request(before_request)

        response = client.post(
            "/test-json", data="plain text", content_type="text/plain"
        )

        # Should not validate and should pass through
        assert response.status_code != 400
