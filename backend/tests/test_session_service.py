"""
Comprehensive unit tests for the SessionService class.

This module tests all business logic related to session management:
- UUID validation and generation
- Session persistence
- Error handling
- Audit logging
"""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Dict
from unittest.mock import MagicMock, Mock, call, patch

import pytest
from app.models import UserSession
from app.services.session_service import SessionService


class TestSessionService:
    """Test suite for SessionService class."""

    def setup_method(self):
        """Set up test fixtures before each test method."""
        self.mock_repository = Mock()
        # Create SessionService with mocked repository for tests that need self.session_service
        with patch(
            "app.services.session_service.get_user_session_repository",
            return_value=self.mock_repository,
        ):
            self.session_service = SessionService()

    def create_session_service(self):
        """Helper method to create SessionService with mocked repository."""
        with patch(
            "app.repositories.factory.get_user_session_repository",
            return_value=self.mock_repository,
        ):
            return SessionService()

    def test_init_creates_repository_instance(self):
        """Test that SessionService initializes with repository."""
        with patch(
            "app.services.session_service.get_user_session_repository"
        ) as mock_factory:
            mock_repo = Mock()
            mock_factory.return_value = mock_repo

            service = SessionService()

            mock_factory.assert_called_once()
            assert service.user_session_repository == mock_repo

    # UUID Validation Tests
    def test_is_valid_uuid_with_valid_uuid(self):
        """Test UUID validation with valid UUID string."""
        valid_uuid = str(uuid.uuid4())
        assert SessionService.is_valid_uuid(valid_uuid) is True

    def test_is_valid_uuid_with_invalid_format(self):
        """Test UUID validation with invalid format."""
        invalid_cases = [
            "not-a-uuid",
            "123456789",
            "",
            "123e4567-e89b-12d3-a456-42661417400",  # Too short
            "123e4567-e89b-12d3-a456-426614174000-extra",  # Too long
            None,
            123,
            [],
        ]

        for invalid_uuid in invalid_cases:
            assert SessionService.is_valid_uuid(invalid_uuid) is False

    def test_is_valid_uuid_with_different_uuid_versions(self):
        """Test UUID validation with different UUID versions."""
        # Test various UUID versions
        uuid_v1 = str(uuid.uuid1())
        uuid_v4 = str(uuid.uuid4())

        assert SessionService.is_valid_uuid(uuid_v1) is True
        assert SessionService.is_valid_uuid(uuid_v4) is True

    # Session Cleanup Tests
    @patch("app.services.session_service.TransactionContext")
    @patch("app.services.session_service.log_audit_event")
    def test_cleanup_expired_sessions(self, mock_audit, mock_transaction_context):
        """Test cleanup of expired sessions."""
        # Mock transaction context
        mock_transaction = Mock()
        mock_transaction_context.return_value.__enter__.return_value = mock_transaction

        # Mock expired sessions
        expired_session1 = Mock()
        expired_session1.created_at = datetime.now(UTC) - timedelta(minutes=15)
        expired_session1.name = None
        expired_session1.email = None
        expired_session1.is_email_verified = False

        expired_session2 = Mock()
        expired_session2.created_at = datetime.now(UTC) - timedelta(minutes=20)
        expired_session2.name = ""
        expired_session2.email = ""
        expired_session2.is_email_verified = False

        # Mock the query chain
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.all.return_value = [expired_session1, expired_session2]
        mock_query.filter.return_value = mock_filter
        mock_transaction.query.return_value = mock_query

        result = self.session_service.cleanup_expired_sessions()

        assert result == 2
        # Verify sessions were deleted
        assert mock_transaction.delete.call_count == 2

    # UUID Validation Method Tests
    @patch("app.services.session_service.log_audit_event")
    def test_validate_uuid_success_active_session(self, mock_audit):
        """Test successful UUID validation for active incomplete session."""
        with patch(
            "app.services.session_service.get_user_session_repository",
            return_value=self.mock_repository,
        ):
            session_service = SessionService()
            test_uuid = str(uuid.uuid4())

            # Mock session that exists and is active (< 10 minutes, incomplete)
            mock_session = Mock()
            mock_session.name = "John"
            mock_session.email = None
            mock_session.is_email_verified = False
            mock_session.created_at = datetime.now(UTC) - timedelta(minutes=5)

            self.mock_repository.get.return_value = mock_session

            response, status_code = session_service.validate_uuid(test_uuid)

        assert status_code == 200
        assert response["status"] == "success"
        assert response["uuid"] == test_uuid
        assert response["message"] == "UUID is valid and session is active"
        assert response["details"]["session_state"] == "active_incomplete"
        assert "age_minutes" in response["details"]

        # Check that audit events were called
        assert mock_audit.call_count >= 2
        mock_audit.assert_any_call(
            "uuid_validation_attempt",
            user_uuid=test_uuid,
            details={"validation_type": "format_and_session_state"},
        )

        # Check for success audit event with approximate age
        success_calls = [
            call
            for call in mock_audit.call_args_list
            if call[0][0] == "uuid_validation_success"
        ]
        assert len(success_calls) == 1
        success_call = success_calls[0]
        assert success_call[1]["user_uuid"] == test_uuid
        assert success_call[1]["details"]["session_state"] == "active_incomplete"
        assert "age_minutes" in success_call[1]["details"]

    @patch("app.services.session_service.log_audit_event")
    def test_validate_uuid_invalid_format(self, mock_audit):
        """Test UUID validation with invalid format."""
        invalid_uuid = "not-a-uuid"

        response, status_code = self.session_service.validate_uuid(invalid_uuid)

        assert status_code == 400
        assert response["status"] == "invalid"
        assert response["uuid"] is None
        assert response["message"] == "Invalid or missing UUID"
        assert response["details"]["reason"] == "invalid format"

        mock_audit.assert_called_once_with(
            "uuid_validation_failed",
            user_uuid=invalid_uuid,
            details={"reason": "invalid format"},
        )

    @patch("app.services.session_service.log_audit_event")
    def test_validate_uuid_empty_string(self, mock_audit):
        """Test UUID validation with empty string."""
        response, status_code = self.session_service.validate_uuid("")

        assert status_code == 400
        assert response["status"] == "invalid"
        assert response["uuid"] is None

    @patch("app.services.session_service.log_audit_event")
    def test_validate_uuid_none(self, mock_audit):
        """Test UUID validation with None."""
        response, status_code = self.session_service.validate_uuid(None)

        assert status_code == 400
        assert response["status"] == "invalid"
        assert response["uuid"] is None

    @patch("app.services.session_service.log_audit_event")
    def test_validate_uuid_collision_complete_session(self, mock_audit):
        """Test UUID validation when session is complete (collision)."""
        test_uuid = str(uuid.uuid4())

        # Mock session that exists and is complete
        mock_session = Mock()
        mock_session.name = "John"
        mock_session.email = "john@example.com"
        mock_session.is_email_verified = True
        mock_session.created_at = datetime.now(UTC) - timedelta(minutes=5)

        self.mock_repository.get.return_value = mock_session

        response, status_code = self.session_service.validate_uuid(test_uuid)

        assert status_code == 409
        assert response["status"] == "collision"
        assert response["uuid"] == test_uuid
        assert response["message"] == "Session already exists with complete data"
        assert response["details"]["reason"] == "complete_session"

        # Check that audit events were called
        assert mock_audit.call_count >= 2
        mock_audit.assert_any_call(
            "uuid_validation_attempt",
            user_uuid=test_uuid,
            details={"validation_type": "format_and_session_state"},
        )
        mock_audit.assert_any_call(
            "uuid_validation_collision",
            user_uuid=test_uuid,
            details={"reason": "complete_session"},
        )

    @patch("app.services.session_service.log_audit_event")
    def test_validate_uuid_expired_session(self, mock_audit):
        """Test UUID validation when session is expired (> 10 minutes)."""
        test_uuid = str(uuid.uuid4())

        # Mock session that exists but is expired
        mock_session = Mock()
        mock_session.name = "John"
        mock_session.email = None
        mock_session.is_email_verified = False
        mock_session.created_at = datetime.now(UTC) - timedelta(minutes=15)

        self.mock_repository.get.return_value = mock_session

        response, status_code = self.session_service.validate_uuid(test_uuid)

        assert status_code == 400
        assert response["status"] == "invalid"
        assert response["uuid"] is None
        assert response["message"] == "Session expired - please start new session"
        assert response["details"]["reason"] == "expired"
        assert "age_minutes" in response["details"]

        # Check that audit events were called
        assert mock_audit.call_count >= 2
        mock_audit.assert_any_call(
            "uuid_validation_attempt",
            user_uuid=test_uuid,
            details={"validation_type": "format_and_session_state"},
        )

        # Check for expired audit event with approximate age
        expired_calls = [
            call
            for call in mock_audit.call_args_list
            if call[0][0] == "uuid_validation_expired"
        ]
        assert len(expired_calls) == 1
        expired_call = expired_calls[0]
        assert expired_call[1]["user_uuid"] == test_uuid
        assert expired_call[1]["details"]["reason"] == "expired"
        assert "age_minutes" in expired_call[1]["details"]

    @patch("app.services.session_service.log_audit_event")
    def test_validate_uuid_not_found_tampered(self, mock_audit):
        """Test UUID validation when UUID doesn't exist (tampered)."""
        test_uuid = str(uuid.uuid4())

        self.mock_repository.get.return_value = None

        response, status_code = self.session_service.validate_uuid(test_uuid)

        assert status_code == 400
        assert response["status"] == "invalid"
        assert response["uuid"] is None
        assert response["message"] == "UUID not found - session may be tampered"
        assert response["details"]["reason"] == "not_found"

        # Check that audit events were called
        assert mock_audit.call_count >= 2
        mock_audit.assert_any_call(
            "uuid_validation_attempt",
            user_uuid=test_uuid,
            details={"validation_type": "format_and_session_state"},
        )
        mock_audit.assert_any_call(
            "uuid_validation_tampered",
            user_uuid=test_uuid,
            details={"reason": "not_found"},
        )

    # UUID Generation Tests
    @patch("app.services.session_service.TransactionContext")
    @patch("app.services.session_service.log_audit_event")
    @patch("app.services.session_service.uuid.uuid4")
    def test_generate_uuid_success_first_attempt(
        self, mock_uuid4, mock_audit, mock_transaction_context
    ):
        """Test successful UUID generation on first attempt."""
        # Mock transaction context
        mock_transaction = Mock()
        mock_transaction_context.return_value.__enter__.return_value = mock_transaction

        test_uuid = "123e4567-e89b-12d3-a456-426614174000"
        mock_uuid4.return_value = test_uuid

        self.mock_repository.exists.return_value = False

        response, status_code = self.session_service.generate_uuid()

        assert status_code == 201  # 201 Created for new resource
        assert response["status"] == "success"
        assert response["uuid"] == test_uuid
        assert response["message"] == "Generated unique UUID"
        assert response["details"]["attempt"] == 1

        # Verify UUID was stored in database (transaction commits automatically)
        mock_transaction.add.assert_called_once()

        # Check audit event
        mock_audit.assert_called_once_with(
            "uuid_generation_success", user_uuid=test_uuid
        )

    @patch("app.services.session_service.TransactionContext")
    @patch("app.services.session_service.log_audit_event")
    @patch("app.services.session_service.uuid.uuid4")
    def test_generate_uuid_success_after_collision(
        self, mock_uuid4, mock_audit, mock_transaction_context
    ):
        """Test successful UUID generation after collision."""
        # Mock transaction context
        mock_transaction = Mock()
        mock_transaction_context.return_value.__enter__.return_value = mock_transaction

        # Mock UUID generation to return different UUIDs
        class MockUUIDObj:
            def __init__(self, uuid_str):
                self.uuid_str = uuid_str

            def __str__(self):
                return self.uuid_str

            def __repr__(self):
                return f"MockUUIDObj('{self.uuid_str}')"

        # First UUID exists, second is unique
        mock_uuid4.side_effect = [
            MockUUIDObj("123e4567-e89b-12d3-a456-426614174000"),
            MockUUIDObj("987fcdeb-51a2-43d1-b789-123456789abc"),
        ]

        self.mock_repository.exists.side_effect = [True, False]

        response, status_code = self.session_service.generate_uuid()

        assert status_code == 201
        assert response["status"] == "success"
        assert response["uuid"] == "987fcdeb-51a2-43d1-b789-123456789abc"
        assert response["details"]["attempt"] == 2

        # Verify UUID was stored in database (transaction commits automatically)
        mock_transaction.add.assert_called_once()

    @patch("app.services.session_service.TransactionContext")
    @patch("app.services.session_service.log_audit_event")
    @patch("app.services.session_service.uuid.uuid4")
    def test_generate_uuid_storage_failure(
        self, mock_uuid4, mock_audit, mock_transaction_context
    ):
        """Test UUID generation when storage fails."""
        # Mock transaction context to raise exception
        mock_transaction_context.return_value.__enter__.side_effect = Exception(
            "Database error"
        )

        test_uuid = "123e4567-e89b-12d3-a456-426614174000"
        mock_uuid4.return_value = test_uuid

        self.mock_repository.exists.return_value = False

        response, status_code = self.session_service.generate_uuid()

        assert status_code == 500
        assert response["status"] == "error"
        assert response["uuid"] is None
        assert "Could not generate unique UUID after 10 attempts" in response["message"]

    @patch("app.services.session_service.log_audit_event")
    @patch("app.services.session_service.uuid.uuid4")
    def test_generate_uuid_max_retries_exceeded(self, mock_uuid4, mock_audit):
        """Test UUID generation when max retries are exceeded."""

        # Mock UUID generation to always return existing UUIDs
        class MockUUIDObj:
            def __init__(self, uuid_str):
                self.uuid_str = uuid_str

            def __str__(self):
                return self.uuid_str

            def __repr__(self):
                return f"MockUUIDObj('{self.uuid_str}')"

        # All UUIDs exist
        mock_uuid4.side_effect = [
            MockUUIDObj(f"123e4567-e89b-12d3-a456-42661417400{i}") for i in range(10)
        ]

        self.mock_repository.exists.return_value = True

        response, status_code = self.session_service.generate_uuid()

        assert status_code == 500
        assert response["status"] == "error"
        assert response["uuid"] is None
        assert "Could not generate unique UUID after 10 attempts" in response["message"]

        # Verify audit events - should have collision events + failure event
        assert mock_audit.call_count == 11  # 10 collisions + 1 failure
        mock_audit.assert_any_call(
            "uuid_generation_failed",
            details={"reason": "Could not generate unique UUID after 10 attempts"},
        )

    # Session Persistence Tests
    @patch("app.services.session_service.log_audit_event")
    def test_persist_session_success_new_session(self, mock_audit):
        """Test successful session persistence for new session."""
        test_uuid = str(uuid.uuid4())
        test_name = "John Doe"
        test_email = "john@example.com"

        # Mock repository to return new session
        mock_session = Mock()
        mock_session.uuid = test_uuid
        self.mock_repository.create_or_update_session.return_value = (
            mock_session,
            True,
        )

        response, status_code = self.session_service.persist_session(
            test_uuid, test_name, test_email
        )

        assert status_code == 201
        assert response["status"] == "success"
        assert response["uuid"] == test_uuid
        assert response["message"] == "Session created successfully"
        assert response["details"]["action"] == "created"

        # Verify repository was called correctly
        self.mock_repository.create_or_update_session.assert_called_once_with(
            test_uuid, name=test_name, email=test_email
        )

        # Verify audit event
        mock_audit.assert_called_once_with(
            "session_persisted",
            user_uuid=test_uuid,
            details={
                "name": test_name,
                "email": test_email,
                "attempt": 0,
                "was_created": True,
            },
        )

    @patch("app.services.session_service.log_audit_event")
    def test_persist_session_success_existing_session(self, mock_audit):
        """Test successful session persistence for existing session."""
        test_uuid = str(uuid.uuid4())
        test_name = "John Doe"
        test_email = "john@example.com"

        # Mock repository to return existing session
        mock_session = Mock()
        mock_session.uuid = test_uuid
        self.mock_repository.create_or_update_session.return_value = (
            mock_session,
            False,
        )

        response, status_code = self.session_service.persist_session(
            test_uuid, test_name, test_email
        )

        assert status_code == 200
        assert response["status"] == "success"
        assert response["uuid"] == test_uuid
        assert response["message"] == "Session updated successfully"
        assert response["details"]["action"] == "updated"

        # Verify audit event
        mock_audit.assert_called_once_with(
            "session_persisted",
            user_uuid=test_uuid,
            details={
                "name": test_name,
                "email": test_email,
                "attempt": 0,
                "was_created": False,
            },
        )

    def test_persist_session_invalid_uuid(self):
        """Test session persistence with invalid UUID."""
        invalid_uuid = "not-a-uuid"
        test_name = "John Doe"

        response, status_code = self.session_service.persist_session(
            invalid_uuid, test_name
        )

        assert status_code == 500
        assert response["status"] == "error"
        assert "Failed to persist session" in response["message"]

    def test_persist_session_empty_uuid(self):
        """Test session persistence with empty UUID."""
        empty_uuid = ""
        test_name = "John Doe"

        response, status_code = self.session_service.persist_session(
            empty_uuid, test_name
        )

        assert status_code == 500
        assert response["status"] == "error"
        assert "Failed to persist session" in response["message"]

    def test_persist_session_none_uuid(self):
        """Test session persistence with None UUID."""
        none_uuid = None
        test_name = "John Doe"

        response, status_code = self.session_service.persist_session(
            none_uuid, test_name
        )

        assert status_code == 500
        assert response["status"] == "error"
        assert "Failed to persist session" in response["message"]

    @patch("app.services.session_service.log_audit_event")
    @patch("app.services.session_service.uuid")  # Patch the module's uuid import
    def test_persist_session_uuid_collision(self, mock_uuid_module, mock_audit):
        """Test session persistence with UUID collision handling."""
        original_uuid = str(uuid.uuid4())
        new_uuid = str(uuid.uuid4())
        test_name = "John Doe"

        # Mock UUID generation for collision resolution
        mock_uuid_module.uuid4.return_value = new_uuid

        # Mock repository to raise ValueError on first call (collision), succeed on second
        mock_session = Mock()
        mock_session.uuid = new_uuid
        self.mock_repository.create_or_update_session.side_effect = [
            ValueError("UUID collision"),  # First attempt fails
            (mock_session, True),  # Second attempt succeeds
        ]

        response, status_code = self.session_service.persist_session(
            original_uuid, test_name
        )

        assert status_code == 201
        assert response["status"] == "success"
        assert response["uuid"] == new_uuid
        assert response["message"] == "Session created successfully"
        assert response["details"]["attempt"] == 1

        # Verify repository was called twice
        assert self.mock_repository.create_or_update_session.call_count == 2

        # Verify audit events
        assert mock_audit.call_count >= 2
        mock_audit.assert_any_call(
            "uuid_collision_retry",
            user_uuid=new_uuid,
            details={
                "original_uuid": original_uuid,
                "attempt": 0,
                "error": "UUID collision",
            },
        )

    # Integration Tests
    @patch("app.services.session_service.log_audit_event")
    def test_full_validation_workflow_with_mocked_repo(self, mock_audit):
        """Test full validation workflow with mocked repository."""
        with patch(
            "app.services.session_service.get_user_session_repository",
            return_value=self.mock_repository,
        ):
            session_service = SessionService()
            test_uuid = str(uuid.uuid4())

            # Test validation with active session
            mock_session = Mock()
            mock_session.name = "John"
            mock_session.email = None
            mock_session.is_email_verified = False
            mock_session.created_at = datetime.now(UTC) - timedelta(minutes=5)

            self.mock_repository.get.return_value = mock_session

            response, status_code = session_service.validate_uuid(test_uuid)

            assert status_code == 200
            assert response["status"] == "success"

    def test_service_handles_repository_exceptions_gracefully(self):
        """Test that service handles repository exceptions gracefully."""
        test_uuid = str(uuid.uuid4())
        self.mock_repository.get.side_effect = Exception("Database connection failed")

        response, status_code = self.session_service.validate_uuid(test_uuid)

        assert status_code == 500
        assert response["status"] == "error"
        assert "Database error" in response["message"]

    def test_validate_uuid_with_whitespace(self):
        """Test UUID validation with whitespace."""
        whitespace_uuid = "  123e4567-e89b-12d3-a456-426614174000  "

        response, status_code = self.session_service.validate_uuid(whitespace_uuid)

        assert status_code == 400
        assert response["status"] == "invalid"

    def test_multiple_service_instances_independent(self):
        """Test that multiple service instances are independent."""
        service1 = self.create_session_service()
        service2 = self.create_session_service()

        assert service1 is not service2
        assert service1.user_session_repository is not service2.user_session_repository

    @patch("app.services.session_service.TransactionContext")
    @patch("app.services.session_service.log_audit_event")
    @patch("app.services.session_service.uuid.uuid4")
    def test_generate_uuid_deterministic_for_testing(
        self, mock_uuid4, mock_audit, mock_transaction_context
    ):
        """Test UUID generation is deterministic for testing."""
        # Mock transaction context
        mock_transaction = Mock()
        mock_transaction_context.return_value.__enter__.return_value = mock_transaction

        # This test ensures UUID generation behavior is consistent
        mock_uuid4.return_value = "123e4567-e89b-12d3-a456-426614174000"
        self.mock_repository.exists.return_value = False

        response, status_code = self.session_service.generate_uuid()

        assert status_code == 201
        assert response["uuid"] == "123e4567-e89b-12d3-a456-426614174000"
