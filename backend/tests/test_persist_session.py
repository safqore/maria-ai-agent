import uuid
from unittest.mock import MagicMock, patch

import pytest
from app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_persist_session_unique_uuid(client):
    test_uuid = str(uuid.uuid4())
    data = {"session_uuid": test_uuid, "name": "Test User", "email": "test@example.com"}
    with patch("app.services.session_service.get_db_connection") as mock_conn:
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = [0]
        mock_conn.return_value.cursor.return_value = mock_cursor
        response = client.post("/persist_session", json=data)
        assert response.status_code == 200
        assert response.json["session_uuid"] == test_uuid
        assert response.json["message"] == "Session persisted"


def test_persist_session_collision(client):
    test_uuid = str(uuid.uuid4())
    data = {"session_uuid": test_uuid, "name": "Test User", "email": "test@example.com"}
    with (
        patch("app.services.session_service.get_db_connection") as mock_conn,
        patch("app.services.session_service.migrate_s3_files") as mock_migrate,
    ):
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = [1]
        mock_conn.return_value.cursor.return_value = mock_cursor
        response = client.post("/persist_session", json=data)
        assert response.status_code == 200
        assert "new_uuid" in response.json
        assert response.json["message"] == "UUID collision, new UUID assigned"
        mock_migrate.assert_called_once()


def test_persist_session_invalid_uuid(client):
    data = {
        "session_uuid": "not-a-uuid",
        "name": "Test User",
        "email": "test@example.com",
    }
    response = client.post("/persist_session", json=data)
    assert response.status_code == 400
    assert "error" in response.json  # Schema validation error
