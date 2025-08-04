import uuid
from unittest.mock import MagicMock, patch

import pytest
from app.app_factory import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_persist_session_unique_uuid(client):
    test_uuid = str(uuid.uuid4())
    data = {"session_uuid": test_uuid, "name": "Test User", "email": "test@example.com"}
    with patch(
        "app.repositories.factory.get_user_session_repository"
    ) as mock_repo_factory:
        mock_repo = MagicMock()
        mock_repo.exists.return_value = False  # UUID doesn't exist
        mock_repo.create.return_value = MagicMock(uuid=test_uuid)
        mock_repo_factory.return_value = mock_repo

        response = client.post("/api/v1/persist_session", json=data)
        assert (
            response.status_code == 201
        )  # 201 Created is correct for resource creation
        assert (
            response.json["uuid"] == test_uuid
        )  # Response uses 'uuid' not 'session_uuid'
        assert "Session created successfully" in response.json["message"]


def test_persist_session_collision(client):
    test_uuid = str(uuid.uuid4())
    data = {"session_uuid": test_uuid, "name": "Test User", "email": "test@example.com"}

    # Test collision handling directly on the service
    with patch("app.services.session_service.migrate_s3_files") as mock_migrate:
        from app.services.session_service import SessionService

        service = SessionService()

        # Mock the repository to simulate collision
        service.user_session_repository = MagicMock()

        # Mock the get method to return an existing session (simulating collision)
        existing_session = MagicMock()
        existing_session.uuid = test_uuid
        existing_session.name = "Test User"
        existing_session.email = "test@example.com"
        service.user_session_repository.get.return_value = existing_session

        # Mock create_or_update_session to return (session, False) indicating update, not creation
        service.user_session_repository.create_or_update_session.return_value = (
            existing_session,
            False,
        )

        # Call the service method to test collision logic
        result, status_code = service.persist_session(
            test_uuid, "Test User", "test@example.com"
        )

        # Verify collision handling worked - should return 200 for update
        assert status_code == 200  # Update should return 200 (OK), not 201 (Created)
        assert "Session updated successfully" in result["message"]
        assert "uuid" in result
        assert result["uuid"] == test_uuid


def test_persist_session_invalid_uuid(client):
    data = {
        "session_uuid": "not-a-uuid",
        "name": "Test User",
        "email": "test@example.com",
    }
    response = client.post("/api/v1/persist_session", json=data)
    assert response.status_code == 400
    assert "error" in response.json  # Schema validation error
