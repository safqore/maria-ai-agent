"""
Integration tests for session API endpoints.

This module tests the session API endpoints with middleware integration.
"""

import json
import pytest
import uuid
from flask import Flask, jsonify

from backend.app import create_app
from backend.app.models import UserSession
from backend.app.repositories.user_session_repository import UserSessionRepository


@pytest.fixture
def app():
    """Create a Flask application for testing."""
    app = create_app({"TESTING": True})
    
    # Configure app for testing
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["REQUIRE_AUTH"] = False  # Disable auth for testing
    
    # Create database tables
    with app.app_context():
        from backend.app.database import Base, engine
        Base.metadata.create_all(bind=engine)
    
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
    with app.app_context():
        repo = UserSessionRepository()
        session = UserSession(
            uuid=session_uuid,
            status="active"
        )
        repo.create(session)
    return session_uuid


class TestSessionAPI:
    """Test suite for session API endpoints."""

    def test_generate_uuid_legacy(self, client):
        """Test generate-uuid endpoint (legacy route)."""
        # Test with correlation ID
        correlation_id = str(uuid.uuid4())
        response = client.post(
            "/generate-uuid",
            headers={"X-Correlation-ID": correlation_id}
        )
        
        assert response.status_code == 201
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
        
        assert response.status_code == 201
        assert "uuid" in response.json
        assert "X-Correlation-ID" in response.headers
        assert "X-API-Version" in response.headers
        assert response.headers["X-API-Version"] == "v1"

    def test_validate_uuid_legacy_valid(self, client, test_session):
        """Test validate-uuid endpoint with valid UUID (legacy route)."""
        response = client.post(
            "/validate-uuid",
            json={"uuid": test_session},
            content_type="application/json"
        )
        
        assert response.status_code == 200
        assert "valid" in response.json
        assert response.json["valid"] is True
        assert "X-Correlation-ID" in response.headers

    def test_validate_uuid_legacy_invalid(self, client):
        """Test validate-uuid endpoint with invalid UUID (legacy route)."""
        response = client.post(
            "/validate-uuid",
            json={"uuid": "not-a-uuid"},
            content_type="application/json"
        )
        
        assert response.status_code == 400
        assert "error" in response.json
        assert "X-Correlation-ID" in response.headers

    def test_validate_uuid_invalid_json(self, client):
        """Test validate-uuid endpoint with invalid JSON."""
        response = client.post(
            "/validate-uuid",
            data="invalid-json",
            content_type="application/json"
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
            content_type="application/json"
        )
        
        assert response.status_code == 200
        assert "valid" in response.json
        assert response.json["valid"] is True
        assert "X-Correlation-ID" in response.headers
        assert "X-API-Version" in response.headers
        assert response.headers["X-API-Version"] == "v1"

    def test_persist_session_legacy(self, client, test_session):
        """Test persist_session endpoint (legacy route)."""
        response = client.post(
            "/persist_session",
            json={
                "session_uuid": test_session,
                "name": "Test User",
                "email": "test@example.com"
            },
            content_type="application/json"
        )
        
        assert response.status_code == 200
        assert "X-Correlation-ID" in response.headers

    def test_persist_session_versioned(self, client, test_session):
        """Test persist_session endpoint (versioned route)."""
        response = client.post(
            "/api/v1/persist_session",
            json={
                "session_uuid": test_session,
                "name": "Test User",
                "email": "test@example.com"
            },
            content_type="application/json"
        )
        
        assert response.status_code == 200
        assert "X-Correlation-ID" in response.headers
        assert "X-API-Version" in response.headers
        assert response.headers["X-API-Version"] == "v1"

    def test_persist_session_invalid_uuid(self, client):
        """Test persist_session endpoint with invalid UUID."""
        response = client.post(
            "/persist_session",
            json={
                "session_uuid": "invalid-uuid",
                "name": "Test User",
                "email": "test@example.com"
            },
            content_type="application/json"
        )
        
        assert response.status_code == 404
        assert "error" in response.json
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
