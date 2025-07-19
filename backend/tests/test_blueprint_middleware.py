"""
Tests for blueprint middleware integration.

This module tests the integration of middleware with Flask blueprints.
"""

import json

import pytest
from app.utils.middleware import apply_middleware_to_blueprint
from flask import Blueprint, Flask, g, jsonify, request


@pytest.fixture
def app():
    """Create a Flask application for testing."""
    app = Flask(__name__)

    # Create a test blueprint
    bp = Blueprint("test_blueprint", __name__)

    # Add a JSON endpoint for testing
    @bp.route("/test-json", methods=["POST"])
    def test_json():
        data = request.get_json()
        return jsonify({"received": data})

    # Add an endpoint that returns correlation ID
    @bp.route("/test-correlation", methods=["GET"])
    def test_correlation():
        return jsonify({"correlation_id": g.get("correlation_id", "missing")})

    # Add an endpoint to test error handling
    @bp.route("/test-error", methods=["GET"])
    def test_error():
        # Simulate error
        raise ValueError("Test error")

    # Add an endpoint to test version header
    @bp.route("/test-version", methods=["GET"])
    def test_version():
        return jsonify({"status": "ok"})

    # Apply middleware to the blueprint
    apply_middleware_to_blueprint(bp, api_version="v1")

    # Register the blueprint
    app.register_blueprint(bp, url_prefix="/api/v1")

    return app


@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()


def test_correlation_id_in_blueprint_request(client):
    """Test correlation ID is added to blueprint responses."""
    response = client.get("/api/v1/test-correlation")

    assert response.status_code == 200
    assert "correlation_id" in response.json
    assert response.json["correlation_id"] != "missing"
    assert "X-Correlation-ID" in response.headers
    assert "X-API-Version" in response.headers
    assert response.headers["X-API-Version"] == "v1"


def test_json_validation_in_blueprint(client):
    """Test JSON validation middleware in blueprint."""
    # Test with valid JSON
    response = client.post(
        "/api/v1/test-json",
        data=json.dumps({"test": "data"}),
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json["received"]["test"] == "data"

    # Test with invalid JSON
    response = client.post(
        "/api/v1/test-json",
        data='{"invalid": "json"',  # Incomplete JSON
        content_type="application/json",
    )

    assert response.status_code == 400
    assert "error" in response.json
    assert "Invalid JSON format" in response.json["message"]
    assert "correlation_id" in response.json


def test_error_handling_in_blueprint(client):
    """Test error handling middleware in blueprint."""
    response = client.get("/api/v1/test-error")

    assert response.status_code == 500
    assert "error" in response.json
    assert response.json["error"] == "ValueError"
    assert "Test error" in response.json["message"]
    assert "correlation_id" in response.json


def test_version_header_in_blueprint(client):
    """Test API version header in blueprint response."""
    response = client.get("/api/v1/test-version")

    assert response.status_code == 200
    assert "X-API-Version" in response.headers
    assert response.headers["X-API-Version"] == "v1"
