"""
Test file upload functionality.
"""

import io
from unittest.mock import patch

import pytest

from app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_upload_file_valid_uuid(client):
    data = {
        "file": (io.BytesIO(b"test pdf content"), "test.pdf"),
        "session_uuid": "123e4567-e89b-12d3-a456-426614174000",
    }
    response = client.post("/api/v1/upload", data=data, content_type="multipart/form-data")
    assert response.status_code == 200
    assert "url" in response.json
    assert "filename" in response.json


def test_upload_file_invalid_uuid(client):
    data = {
        "file": (io.BytesIO(b"test pdf content"), "test.pdf"),
        "session_uuid": "not-a-uuid",
    }
    response = client.post("/api/v1/upload", data=data, content_type="multipart/form-data")
    assert response.status_code == 400
    assert (
        response.json["error"] == "Invalid request data"
        or response.json["error"] == "Invalid or missing session UUID"
    )


def test_upload_file_missing_uuid(client):
    data = {"file": (io.BytesIO(b"test pdf content"), "test.pdf")}
    response = client.post("/api/v1/upload", data=data, content_type="multipart/form-data")
    assert response.status_code == 400
    assert "error" in response.json
