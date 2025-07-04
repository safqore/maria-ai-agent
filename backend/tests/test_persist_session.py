import uuid
from unittest.mock import MagicMock, patch

import pytest

from backend.app.app_factory import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_persist_session_unique_uuid(client):
    test_uuid = str(uuid.uuid4())
    data = {"session_uuid": test_uuid, "name": "Test User", "email": "test@example.com"}
    with patch("backend.app.repositories.factory.get_user_session_repository") as mock_repo_factory:
        mock_repo = MagicMock()
        mock_repo.exists.return_value = False  # UUID doesn't exist
        mock_repo.create.return_value = MagicMock(uuid=test_uuid)
        mock_repo_factory.return_value = mock_repo
        
        response = client.post("/persist_session", json=data)
        assert response.status_code == 201  # 201 Created is correct for resource creation
        assert response.json["uuid"] == test_uuid  # Response uses 'uuid' not 'session_uuid'
        assert "Session created successfully" in response.json["message"]


def test_persist_session_collision(client):
    test_uuid = str(uuid.uuid4())
    data = {"session_uuid": test_uuid, "name": "Test User", "email": "test@example.com"}
    
    # Test collision handling directly on the service
    with patch("backend.app.services.session_service.migrate_s3_files") as mock_migrate:
        from backend.app.services.session_service import SessionService
        service = SessionService()
        
        # Mock the repository to simulate collision
        service.user_session_repository = MagicMock()
        service.user_session_repository.exists.return_value = True  # Collision
        service.user_session_repository.create_session.return_value = MagicMock(
            uuid=test_uuid,
            name="Test User",
            email="test@example.com",
            created_at=None
        )
        
        # Call the service method to test collision logic
        result, status_code = service.persist_session(test_uuid, "Test User", "test@example.com")
        
        # Verify collision handling worked
        assert status_code == 200  # Collision should return 200 (OK), not 201 (Created)
        assert "UUID collision, new UUID assigned" in result["message"]
        assert "uuid" in result
        assert mock_migrate.called, "S3 migration should be called for collision handling"


def test_persist_session_invalid_uuid(client):
    data = {
        "session_uuid": "not-a-uuid",
        "name": "Test User",
        "email": "test@example.com",
    }
    response = client.post("/persist_session", json=data)
    assert response.status_code == 400
    assert "error" in response.json  # Schema validation error
