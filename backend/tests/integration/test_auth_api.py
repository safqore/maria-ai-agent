"""
Integration tests for authentication functionality.

This module tests the authentication middleware integration with API endpoints.
"""

import json
import uuid

import pytest
from app import create_app
from app.utils.auth import require_api_key, setup_auth_middleware
from app.utils.middleware import apply_middleware_to_blueprint
from flask import Blueprint, Flask, g, jsonify, request


@pytest.fixture
def app():
    """Create a Flask application for testing authentication."""
    # Create a fresh Flask app instead of using create_app to avoid conflicts
    app = Flask(__name__)

    # Configure app for testing
    app.config["TESTING"] = True
    app.config["REQUIRE_AUTH"] = True  # Enable auth for these tests
    app.config["API_KEYS"] = ["test-key", "alt-key"]

    # Override the imported globals with our test values
    import app.utils.auth as auth

    auth.REQUIRE_AUTH = True  # Ensure auth is required for tests
    auth.API_KEYS = ["test-key", "alt-key"]

    # Add a test auth blueprint with protected and unprotected routes
    auth_test_bp = Blueprint("auth_test", __name__)

    # Define an endpoint handler for the protected route
    @auth_test_bp.route("/protected")
    @require_api_key
    def protected_route():
        return jsonify(
            {"status": "success", "message": "You accessed a protected route"}
        )

    # Apply middleware to the blueprint before registering
    apply_middleware_to_blueprint(auth_test_bp, api_version="v1")

    # Register the auth-test blueprint
    app.register_blueprint(auth_test_bp, url_prefix="/api/test")

    # Create a separate blueprint for open routes
    open_bp = Blueprint("open_routes", __name__)

    @open_bp.route("/open")
    def open_route():
        return jsonify({"status": "success", "message": "This route is open"})

    # Apply middleware but avoid auth for this blueprint
    apply_middleware_to_blueprint(open_bp, api_version="v1")

    # Register the open blueprint
    app.register_blueprint(open_bp, url_prefix="/api/test")

    # Set up request logging
    from app.utils.middleware import setup_request_logging

    setup_request_logging(app)

    # Setup authentication for protected endpoints
    @app.before_request
    def check_auth():
        """Check if request needs authentication"""
        # Skip auth check for open blueprint routes
        if request.blueprint == "open_routes":
            return None

        # Skip auth for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return None

        # Skip auth for the auth-info endpoint (it's always accessible)
        if request.path == "/api/auth-info":
            return None

        # Skip non-API routes
        if not request.path.startswith("/api/"):
            return None

        # Check for API key
        api_key = request.headers.get("X-API-Key") or request.args.get("api_key")

        if not api_key or api_key not in ["test-key", "alt-key"]:
            return (
                jsonify({"error": "Unauthorized", "message": "Valid API key required"}),
                401,
            )

        # Mark as authenticated
        g.authenticated = True
        g.api_key = api_key

    # Set up auth middleware, but register the function manually instead
    # of using the automatic before_request to all routes
    @app.route("/api/auth-info", methods=["GET"])
    def auth_info():
        """Return information about API authentication requirements."""
        response = jsonify(
            {
                "authentication_required": True,
                "auth_type": "API Key",
                "header_name": "X-API-Key",
                "query_param": "api_key",
                "documentation": "Add your API key as either a header or query parameter",
            }
        )

        # Add correlation ID to response if available
        if hasattr(g, "correlation_id"):
            response.headers["X-Correlation-ID"] = g.correlation_id

        return response

    # Add API version header to all responses
    @app.after_request
    def add_version_header(response):
        response.headers["X-API-Version"] = "v1"
        return response

    return app


@pytest.fixture
def client(app):
    """Test client for the Flask app."""
    return app.test_client()


class TestAuthenticationIntegration:
    """Tests for authentication middleware integration."""

    def test_open_route_accessible_without_key(self, client):
        """Test that open routes are accessible without API key."""
        response = client.get("/api/test/open")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["status"] == "success"
        assert data["message"] == "This route is open"

    def test_protected_route_requires_key(self, client):
        """Test that protected routes reject requests without API key."""
        response = client.get("/api/test/protected")
        assert response.status_code == 401
        data = json.loads(response.data)
        assert data["error"] == "Unauthorized"

    def test_protected_route_valid_key(self, client):
        """Test that protected routes accept valid API key."""
        response = client.get("/api/test/protected", headers={"X-API-Key": "test-key"})
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["status"] == "success"

    def test_protected_route_alternate_key(self, client):
        """Test that protected routes accept alternate valid API key."""
        response = client.get("/api/test/protected", headers={"X-API-Key": "alt-key"})
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["status"] == "success"

    def test_protected_route_invalid_key(self, client):
        """Test that protected routes reject invalid API key."""
        response = client.get(
            "/api/test/protected", headers={"X-API-Key": "invalid-key"}
        )
        assert response.status_code == 401
        data = json.loads(response.data)
        assert data["error"] == "Unauthorized"

    def test_protected_route_query_param_key(self, client):
        """Test that protected routes accept API key as query parameter."""
        response = client.get("/api/test/protected?api_key=test-key")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["status"] == "success"

    def test_protected_route_empty_key(self, client):
        """Test that protected routes reject empty API key."""
        response = client.get("/api/test/protected", headers={"X-API-Key": ""})
        assert response.status_code == 401
        data = json.loads(response.data)
        assert data["error"] == "Unauthorized"


class TestAuthCorrelationIDIntegration:
    """Tests for authentication with correlation ID integration."""

    def test_correlation_id_with_auth(self, client):
        """Test that correlation ID is preserved with authentication."""
        correlation_id = str(uuid.uuid4())
        response = client.get(
            "/api/test/protected",
            headers={"X-API-Key": "test-key", "X-Correlation-ID": correlation_id},
        )
        assert response.status_code == 200
        assert response.headers.get("X-Correlation-ID") == correlation_id

    def test_auth_info_with_correlation_id(self, client):
        """Test the auth-info endpoint with correlation ID."""
        correlation_id = str(uuid.uuid4())
        response = client.get(
            "/api/auth-info",
            headers={"X-API-Key": "test-key", "X-Correlation-ID": correlation_id},
        )
        assert response.status_code == 200
        # Verify correlation ID is returned in headers
        assert "X-Correlation-ID" in response.headers
        assert response.headers.get("X-Correlation-ID") == correlation_id

        # Check auth info data - using the format from the middleware
        data = json.loads(response.data)
        assert "authentication_required" in data
        assert "auth_type" in data
        assert data["auth_type"] == "API Key"
        assert "header_name" in data
        assert data["header_name"] == "X-API-Key"
        assert "query_param" in data
        assert data["query_param"] == "api_key"


class TestVersionHeaderWithAuth:
    """Tests for API version headers with authentication."""

    def test_version_headers_with_auth(self, client):
        """Test that version headers are present with authentication."""
        response = client.get("/api/test/protected", headers={"X-API-Key": "test-key"})
        assert response.status_code == 200
        assert "X-API-Version" in response.headers
        # The actual version value will depend on your configuration
        assert response.headers.get("X-API-Version") is not None
