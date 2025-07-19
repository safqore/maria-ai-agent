"""
Tests for the authentication module.
"""

from unittest.mock import patch

import pytest
from app.utils.auth import require_api_key, setup_auth_middleware
from flask import Flask, g, request


class TestAuth:
    @pytest.fixture
    def app(self):
        """Create a Flask test application with auth middleware."""
        app = Flask(__name__)

        # Add a route protected with require_api_key
        @app.route("/protected")
        @require_api_key
        def protected_route():
            return {"message": "protected"}

        # Add an open route
        @app.route("/open")
        def open_route():
            return {"message": "open"}

        # Set up auth middleware
        setup_auth_middleware(app)

        return app

    @patch("app.utils.auth.REQUIRE_AUTH", True)
    @patch("app.utils.auth.API_KEYS", ["test-key"])
    def test_require_api_key_valid(self, app):
        """Test that routes with valid API key are accessible."""
        with app.test_client() as client:
            response = client.get("/protected", headers={"X-API-Key": "test-key"})
            assert response.status_code == 200
            assert response.json == {"message": "protected"}

    @patch("app.utils.auth.REQUIRE_AUTH", True)
    @patch("app.utils.auth.API_KEYS", ["test-key"])
    def test_require_api_key_invalid(self, app):
        """Test that routes with invalid API key are rejected."""
        with app.test_client() as client:
            response = client.get("/protected", headers={"X-API-Key": "wrong-key"})
            assert response.status_code == 401

    @patch("app.utils.auth.REQUIRE_AUTH", True)
    @patch("app.utils.auth.API_KEYS", ["test-key"])
    def test_require_api_key_missing(self, app):
        """Test that routes without API key are rejected."""
        with app.test_client() as client:
            response = client.get("/protected")
            assert response.status_code == 401

    @patch("app.utils.auth.REQUIRE_AUTH", False)
    def test_auth_disabled(self, app):
        """Test that auth can be disabled via environment."""
        with app.test_client() as client:
            response = client.get("/protected")
            assert response.status_code == 200

    @patch("app.utils.auth.REQUIRE_AUTH", True)
    @patch("app.utils.auth.API_KEYS", ["test-key"])
    def test_non_api_routes_accessible(self, app):
        """Test that non-API routes are accessible without auth."""
        with app.test_client() as client:
            # This route doesn't start with /api so it should be accessible
            response = client.get("/open")
            assert response.status_code == 200

    @patch("app.utils.auth.REQUIRE_AUTH", True)
    @patch("app.utils.auth.API_KEYS", ["test-key"])
    def test_options_requests_allowed(self, app):
        """Test that OPTIONS requests are allowed for CORS preflight."""
        with app.test_client() as client:
            response = client.options("/protected")
            assert response.status_code != 401  # Should not be rejected
