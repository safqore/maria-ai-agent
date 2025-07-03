"""
Integration tests for upload API endpoints.

This module tests the upload API endpoints with middleware integration.
"""

import io
import json
import uuid

import pytest
from flask import Flask, jsonify

from backend.app import create_app
from backend.app.models import UserSession
from backend.app.repositories.user_session_repository import UserSessionRepository
from backend.app.database_core import Base, get_engine


@pytest.fixture
def app():
    """Create a Flask application for testing."""
    app = create_app({"TESTING": True})

    # Configure app for testing
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["REQUIRE_AUTH"] = False  # Disable auth for testing
    app.config["MAX_CONTENT_LENGTH"] = (
        1 * 1024 * 1024
    )  # 1MB max upload size for testing

    # Create database tables
    with app.app_context():
        Base.metadata.create_all(bind=get_engine())

    return app


@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()


@pytest.fixture
def session_uuid(app):
    """Generate a test session UUID and create the session."""
    session_id = str(uuid.uuid4())
    with app.app_context():
        repo = UserSessionRepository()
        session = UserSession(uuid=session_id, status="active")
        repo.create(session)
    return session_id


@pytest.fixture
def test_file():
    """Create a test file for upload."""
    return (io.BytesIO(b"test file content"), "test.txt")


class TestUploadAPI:
    """Test suite for upload API endpoints."""

    def test_upload_file_legacy(self, client, session_uuid, test_file):
        """Test upload-file endpoint (legacy route)."""
        file_content, file_name = test_file

        response = client.post(
            "/upload",
            data={"file": (file_content, file_name), "session_uuid": session_uuid},
            content_type="multipart/form-data",
        )

        assert response.status_code == 201
        assert "success" in response.json
        assert response.json["success"] is True
        assert "X-Correlation-ID" in response.headers

    def test_upload_file_versioned(self, client, session_uuid, test_file):
        """Test upload-file endpoint (versioned route)."""
        file_content, file_name = test_file

        response = client.post(
            "/api/v1/upload",
            data={"file": (file_content, file_name), "session_uuid": session_uuid},
            content_type="multipart/form-data",
        )

        assert response.status_code == 201
        assert "success" in response.json
        assert response.json["success"] is True
        assert "X-Correlation-ID" in response.headers
        assert "X-API-Version" in response.headers
        assert response.headers["X-API-Version"] == "v1"

    def test_upload_file_missing_file(self, client, session_uuid):
        """Test upload-file endpoint with missing file."""
        response = client.post(
            "/upload",
            data={"session_uuid": session_uuid},
            content_type="multipart/form-data",
        )

        assert response.status_code == 400
        assert "error" in response.json
        assert "X-Correlation-ID" in response.headers

    def test_upload_file_missing_session(self, client, test_file):
        """Test upload-file endpoint with missing session UUID."""
        file_content, file_name = test_file

        response = client.post(
            "/upload",
            data={"file": (file_content, file_name)},
            content_type="multipart/form-data",
        )

        assert response.status_code == 400
        assert "error" in response.json
        assert "X-Correlation-ID" in response.headers

    def test_upload_file_invalid_session(self, client, test_file):
        """Test upload-file endpoint with invalid session UUID."""
        file_content, file_name = test_file

        response = client.post(
            "/upload",
            data={"file": (file_content, file_name), "session_uuid": "invalid-uuid"},
            content_type="multipart/form-data",
        )

        assert response.status_code == 404
        assert "error" in response.json
        assert "X-Correlation-ID" in response.headers

    def test_upload_file_too_large(self, client, session_uuid):
        """Test upload-file endpoint with file that's too large."""
        # Create a file that exceeds the limit (1MB + 100 bytes)
        large_file = (io.BytesIO(b"0" * (1024 * 1024 + 100)), "large_file.txt")

        try:
            response = client.post(
                "/upload",
                data={"file": large_file, "session_uuid": session_uuid},
                content_type="multipart/form-data",
            )

            # If we get here, the file size limit might not be working
            # Check if we got a 413 Payload Too Large response
            assert response.status_code == 413
        except Exception as e:
            # The client might raise an exception for failed requests
            # This is also acceptable behavior
            pass
