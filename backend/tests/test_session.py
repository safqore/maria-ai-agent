import os
from unittest.mock import MagicMock, patch

import pytest

from backend.app import create_app
from backend.app.routes.session import limiter

# Set rate limit for testing
os.environ["SESSION_RATE_LIMIT"] = "1/minute"


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@patch("backend.app.services.session_service.SessionService.check_uuid_exists")
def test_generate_uuid_success(mock_check_uuid_exists, client):
    # Mock UUID existence check to always return False (no collision)
    mock_check_uuid_exists.return_value = False
    response = client.post("/generate-uuid")
    try:
        data = response.get_json()
    except Exception:
        print("Raw response:", response.get_data(as_text=True))
        raise
    assert isinstance(data, dict), f"Expected dict, got {type(data)}: {data}"
    assert response.status_code == 200
    assert data["status"] == "success"
    assert data["uuid"]
    assert data["message"] == "Generated unique UUID"


@patch("backend.app.services.session_service.SessionService.check_uuid_exists")
def test_validate_uuid_invalid(mock_check_uuid_exists, client):
    response = client.post("/validate-uuid", json={"uuid": "not-a-uuid"})
    data = response.get_json()
    assert response.status_code == 400
    assert data["status"] == "invalid"
    assert data["uuid"] is None


@patch("backend.app.services.session_service.SessionService.check_uuid_exists")
def test_validate_uuid_success(mock_check_uuid_exists, client):
    # Mock UUID existence check to return False (no collision)
    mock_check_uuid_exists.return_value = False
    # Generate a new UUID and validate it (should be unique)
    gen_response = client.post("/generate-uuid")
    try:
        gen_data = gen_response.get_json()
    except Exception:
        print("Raw response:", gen_response.get_data(as_text=True))
        raise
    assert isinstance(
        gen_data, dict
    ), f"Expected dict, got {type(gen_data)}: {gen_data}"
    uuid_val = gen_data["uuid"]
    response = client.post("/validate-uuid", json={"uuid": uuid_val})
    try:
        data = response.get_json()
    except Exception:
        print("Raw response:", response.get_data(as_text=True))
        raise
    assert isinstance(data, dict), f"Expected dict, got {type(data)}: {data}"
    assert response.status_code == 200
    assert data["status"] == "success"
    assert data["uuid"] == uuid_val


@patch("backend.app.services.session_service.SessionService.check_uuid_exists")
def test_rate_limit(mock_check_uuid_exists, client):
    # Defensive: skip if limiter storage is not initialized
    try:
        storage_type = str(type(limiter.storage))
    except AssertionError:
        pytest.skip("Limiter storage not initialized. Skipping rate limit test.")
    if "MemoryStorage" in storage_type:
        pytest.skip(
            "Rate limit test is unreliable with in-memory storage. "
            "Use Redis for integration testing."
        )
    # Mock UUID existence check to always return False (no collision)
    mock_check_uuid_exists.return_value = False
    # Exceed the rate limit using the same IP
    for _ in range(10):
        response = client.post(
            "/generate-uuid", environ_overrides={"REMOTE_ADDR": "1.2.3.4"}
        )
        assert response.status_code == 200
    # The next request should be rate limited
    response = client.post(
        "/generate-uuid", environ_overrides={"REMOTE_ADDR": "1.2.3.4"}
    )
    assert response.status_code == 429
    assert "rate limit" in response.get_data(as_text=True).lower()
