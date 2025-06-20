import os
import pytest
from app import app, get_db_connection
from unittest.mock import patch
import uuid

def test_persist_session_unique_uuid(monkeypatch):
    client = app.test_client()
    test_uuid = str(uuid.uuid4())
    data = {
        'session_uuid': test_uuid,
        'name': 'Test User',
        'email': 'test@example.com'
    }
    # Patch DB to simulate unique UUID
    with patch('app.get_db_connection') as mock_conn:
        mock_cursor = mock_conn.return_value.cursor.return_value
        mock_cursor.fetchone.return_value = [0]
        response = client.post('/persist_session', json=data)
        assert response.status_code == 200
        assert response.json['session_uuid'] == test_uuid

def test_persist_session_collision(monkeypatch):
    client = app.test_client()
    test_uuid = str(uuid.uuid4())
    data = {
        'session_uuid': test_uuid,
        'name': 'Test User',
        'email': 'test@example.com'
    }
    # Patch DB to simulate UUID collision
    with patch('app.get_db_connection') as mock_conn, \
         patch('app.migrate_s3_files') as mock_migrate:
        mock_cursor = mock_conn.return_value.cursor.return_value
        mock_cursor.fetchone.return_value = [1]
        response = client.post('/persist_session', json=data)
        assert response.status_code == 200
        assert 'new_uuid' in response.json
        mock_migrate.assert_called_once()

def test_persist_session_invalid_uuid():
    client = app.test_client()
    data = {
        'session_uuid': 'not-a-uuid',
        'name': 'Test User',
        'email': 'test@example.com'
    }
    response = client.post('/persist_session', json=data)
    assert response.status_code == 400
    assert response.json['code'] == 'invalid session'
