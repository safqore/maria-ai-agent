"""
Comprehensive unit tests for the SessionService class.

This module tests all business logic related to session management:
- UUID validation and generation
- Session persistence
- Error handling
- Audit logging
"""

import uuid
from typing import Any, Dict
from unittest.mock import MagicMock, Mock, call, patch

import pytest

from backend.app.models import UserSession
from backend.app.services.session_service import SessionService


class TestSessionService:
    """Test suite for SessionService class."""

    def setup_method(self):
        """Set up test fixtures before each test method."""
        # Mock the repository
        self.mock_repository = Mock()

        # Create service instance with mocked repository
        with patch(
            "backend.app.services.session_service.get_user_session_repository",
            return_value=self.mock_repository,
        ):
            self.session_service = SessionService()

    def test_init_creates_repository_instance(self):
        """Test that SessionService initializes with repository."""
        with patch(
            "backend.app.services.session_service.get_user_session_repository"
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

    def test_check_uuid_exists_delegates_to_repository(self):
        """Test that check_uuid_exists calls repository.exists."""
        test_uuid = str(uuid.uuid4())
        self.mock_repository.exists.return_value = True

        result = self.session_service.check_uuid_exists(test_uuid)

        # The repository should be called with a UUID object, not a string
        expected_uuid_obj = uuid.UUID(test_uuid)
        self.mock_repository.exists.assert_called_once_with(expected_uuid_obj)
        assert result is True

    def test_check_uuid_exists_returns_false_when_not_found(self):
        """Test check_uuid_exists returns False when UUID not found."""
        test_uuid = str(uuid.uuid4())
        self.mock_repository.exists.return_value = False

        result = self.session_service.check_uuid_exists(test_uuid)

        assert result is False

    # UUID Validation Method Tests
    @patch("backend.app.services.session_service.log_audit_event")
    def test_validate_uuid_success(self, mock_audit):
        """Test successful UUID validation."""
        test_uuid = str(uuid.uuid4())
        self.mock_repository.exists.return_value = False

        response, status_code = self.session_service.validate_uuid(test_uuid)

        assert status_code == 200
        assert response["status"] == "success"
        assert response["uuid"] == test_uuid
        assert response["message"] == "UUID is valid and unique"
        assert response["details"] == {}

        mock_audit.assert_called_once_with(
            "uuid_validation_success", user_uuid=test_uuid
        )

    @patch("backend.app.services.session_service.log_audit_event")
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

    @patch("backend.app.services.session_service.log_audit_event")
    def test_validate_uuid_empty_string(self, mock_audit):
        """Test UUID validation with empty string."""
        response, status_code = self.session_service.validate_uuid("")

        assert status_code == 400
        assert response["status"] == "invalid"
        assert response["uuid"] is None

    @patch("backend.app.services.session_service.log_audit_event")
    def test_validate_uuid_none(self, mock_audit):
        """Test UUID validation with None."""
        response, status_code = self.session_service.validate_uuid(None)

        assert status_code == 400
        assert response["status"] == "invalid"
        assert response["uuid"] is None

    @patch("backend.app.services.session_service.log_audit_event")
    def test_validate_uuid_collision(self, mock_audit):
        """Test UUID validation when UUID already exists."""
        test_uuid = str(uuid.uuid4())
        self.mock_repository.exists.return_value = True

        response, status_code = self.session_service.validate_uuid(test_uuid)

        assert status_code == 409
        assert response["status"] == "collision"
        assert response["uuid"] == test_uuid
        assert response["message"] == "UUID already exists"
        assert response["details"]["reason"] == "UUID already exists"

        mock_audit.assert_called_once_with(
            "uuid_validation_collision",
            user_uuid=test_uuid,
            details={"reason": "UUID already exists"},
        )

    # UUID Generation Tests
    @patch("backend.app.services.session_service.log_audit_event")
    @patch("backend.app.services.session_service.uuid.UUID")
    @patch("backend.app.services.session_service.uuid.uuid4")
    def test_generate_uuid_success_first_attempt(self, mock_uuid4, mock_UUID, mock_audit):
        """Test successful UUID generation on first attempt."""
        # Create a UUID string for testing
        generated_uuid_str = str(uuid.uuid4())
        
        # Mock uuid4 to return a mock object that converts to the string
        mock_uuid_obj = Mock()
        mock_uuid_obj.__str__ = Mock(return_value=generated_uuid_str)
        mock_uuid4.return_value = mock_uuid_obj
        
        # Mock UUID constructor to return a proper UUID object
        mock_UUID.return_value = uuid.UUID(generated_uuid_str)
        
        self.mock_repository.exists.return_value = False

        response, status_code = self.session_service.generate_uuid()

        assert status_code == 200
        assert response["status"] == "success"
        assert response["uuid"] == generated_uuid_str
        assert response["message"] == "Generated unique UUID"
        assert response["details"] == {}

        mock_audit.assert_called_once_with(
            "uuid_generation_success", user_uuid=generated_uuid_str
        )
        # The repository should be called with a UUID object
        expected_uuid_obj = uuid.UUID(generated_uuid_str)
        self.mock_repository.exists.assert_called_once_with(expected_uuid_obj)

    def test_generate_uuid_success_after_collision(self):
        """Test UUID generation success after collision."""
        # Generate real UUID strings BEFORE applying any mocks
        collision_uuid_str = str(uuid.uuid4())  # This will exist 
        success_uuid_str = str(uuid.uuid4())    # This will not exist
        
        # Create mock uuid4 objects that return valid UUID strings  
        class MockUUIDObj:
            def __init__(self, uuid_str):
                self.uuid_str = uuid_str
            def __str__(self):
                return self.uuid_str
            def __repr__(self):
                return f"MockUUIDObj({self.uuid_str})"
        
        mock1 = MockUUIDObj(collision_uuid_str)
        mock2 = MockUUIDObj(success_uuid_str)
        
        # Apply patches within the test method
        with patch("backend.app.services.session_service.log_audit_event") as mock_audit, \
             patch("backend.app.services.session_service.uuid.uuid4") as mock_uuid4:
            
            mock_uuid4.side_effect = [mock1, mock2]

            # First UUID exists (collision), second doesn't
            self.mock_repository.exists.side_effect = [True, False]

            response, status_code = self.session_service.generate_uuid()

            assert status_code == 200
            assert response["status"] == "success"
            assert response["uuid"] == success_uuid_str

            # Should check both UUIDs - repository expects UUID objects
            expected_calls = [call(uuid.UUID(collision_uuid_str)), call(uuid.UUID(success_uuid_str))]
            self.mock_repository.exists.assert_has_calls(expected_calls)
            assert self.mock_repository.exists.call_count == 2

    def test_generate_uuid_max_retries_exceeded(self):
        """Test UUID generation failure after max retries."""
        # Generate real UUID strings BEFORE applying any mocks
        collision_uuid_strs = [str(uuid.uuid4()) for _ in range(3)]
        
        # Create mock objects that return valid UUID strings
        class MockUUIDObj:
            def __init__(self, uuid_str):
                self.uuid_str = uuid_str
            def __str__(self):
                return self.uuid_str
        
        # Apply patches within the test method
        with patch("backend.app.services.session_service.log_audit_event") as mock_audit, \
             patch("backend.app.services.session_service.uuid.uuid4") as mock_uuid4:
            
            mock_uuid4.side_effect = [MockUUIDObj(uuid_str) for uuid_str in collision_uuid_strs]

            # All UUIDs already exist
            self.mock_repository.exists.return_value = True

            response, status_code = self.session_service.generate_uuid()

            assert status_code == 500
            assert response["status"] == "error"
            assert response["uuid"] is None
            assert response["message"] == "Could not generate unique UUID"
            assert (
                response["details"]["reason"]
                == "Could not generate unique UUID after 3 attempts"
            )

            # Should try 3 times
            assert self.mock_repository.exists.call_count == 3
            mock_audit.assert_called_once_with(
                "uuid_generation_failed",
                details={"reason": "Could not generate unique UUID after 3 attempts"},
            )

    # Session Persistence Tests
    @patch("backend.app.services.session_service.log_audit_event")
    def test_persist_session_success(self, mock_audit):
        """Test successful session persistence."""
        test_uuid = str(uuid.uuid4())
        test_name = "John Doe"
        test_email = "john@example.com"

        # Mock repository responses
        self.mock_repository.exists.return_value = False
        mock_user_session = Mock()
        mock_user_session.uuid = test_uuid
        self.mock_repository.create_session.return_value = mock_user_session

        response, status_code = self.session_service.persist_session(
            test_uuid, test_name, test_email
        )

        assert status_code == 201
        assert response["message"] == "Session created successfully"
        assert response["uuid"] == test_uuid

        # The repository should be called with a UUID object, not a string
        expected_uuid_obj = uuid.UUID(test_uuid)
        self.mock_repository.exists.assert_called_once_with(expected_uuid_obj)
        self.mock_repository.create_session.assert_called_once_with(
            session_uuid=test_uuid, name=test_name, email=test_email
        )

        mock_audit.assert_called_once_with(
            "session_persisted",
            user_uuid=test_uuid,
            details={"name": test_name, "email": test_email},
        )

    def test_persist_session_invalid_uuid(self):
        """Test session persistence with invalid UUID."""
        invalid_uuid = "not-a-uuid"

        response, status_code = self.session_service.persist_session(
            invalid_uuid, "John", "john@test.com"
        )

        assert status_code == 400
        assert response["error"] == "Invalid or missing session UUID"
        assert response["code"] == "invalid session"

        # Repository should not be called
        self.mock_repository.exists.assert_not_called()
        self.mock_repository.create_session.assert_not_called()

    def test_persist_session_empty_uuid(self):
        """Test session persistence with empty UUID."""
        response, status_code = self.session_service.persist_session(
            "", "John", "john@test.com"
        )

        assert status_code == 400
        assert response["error"] == "Invalid or missing session UUID"

    def test_persist_session_none_uuid(self):
        """Test session persistence with None UUID."""
        response, status_code = self.session_service.persist_session(
            None, "John", "john@test.com"
        )

        assert status_code == 400
        assert response["error"] == "Invalid or missing session UUID"

    @patch("backend.app.services.session_service.migrate_s3_files")
    @patch(
        "backend.app.services.session_service.uuid"
    )  # Patch the module's uuid import
    def test_persist_session_uuid_collision(self, mock_uuid_module, mock_migrate):
        """Test session persistence with UUID collision."""
        # Generate a real UUID for testing (not mocked)
        import uuid as real_uuid

        existing_uuid = str(real_uuid.uuid4())

        # Mock the uuid.uuid4() call inside the service
        new_uuid_obj = real_uuid.uuid4()
        new_uuid_str = str(new_uuid_obj)
        mock_uuid_module.uuid4.return_value = new_uuid_obj

        # Ensure the UUID is valid format
        assert SessionService.is_valid_uuid(
            existing_uuid
        ), f"UUID {existing_uuid} should be valid"

        self.mock_repository.exists.return_value = True
        
        # Mock the create_session to return a proper session with the new UUID
        mock_session = Mock()
        mock_session.uuid = new_uuid_str
        mock_session.name = "John"
        mock_session.email = "john@test.com"
        mock_session.created_at = None
        self.mock_repository.create_session.return_value = mock_session

        response, status_code = self.session_service.persist_session(
            existing_uuid, "John", "john@test.com"
        )

        # Debug output if test fails
        if status_code != 201:
            print(f"UUID: {existing_uuid}")
            print(f"Is valid: {SessionService.is_valid_uuid(existing_uuid)}")
            print(f"Response: {response}")
            print(f"Status: {status_code}")

        assert status_code == 201
        assert response["uuid"] == new_uuid_str
        assert response["message"] == "Session created successfully"

        # Should migrate S3 files from old to new UUID
        mock_migrate.assert_called_once_with(existing_uuid, new_uuid_str)

        # Should create session with the new UUID
        self.mock_repository.create_session.assert_called_once_with(
            session_uuid=new_uuid_str, name="John", email="john@test.com"
        )

    # Integration Tests
    @patch("backend.app.services.session_service.log_audit_event")
    def test_full_validation_workflow_with_mocked_repo(self, mock_audit):
        """Test complete validation workflow with mocked repository."""
        test_uuid = str(uuid.uuid4())

        # First validation - UUID doesn't exist (success)
        self.mock_repository.exists.return_value = False
        response1, status1 = self.session_service.validate_uuid(test_uuid)

        assert status1 == 200
        assert response1["status"] == "success"

        # Now simulate UUID exists
        self.mock_repository.exists.return_value = True
        response2, status2 = self.session_service.validate_uuid(test_uuid)

        assert status2 == 409
        assert response2["status"] == "collision"

    def test_service_handles_repository_exceptions_gracefully(self):
        """Test that service handles repository exceptions gracefully."""
        test_uuid = str(uuid.uuid4())

        # Mock repository to raise exception
        self.mock_repository.exists.side_effect = Exception("Database error")

        # The service should let the exception propagate (for now)
        # In future iterations, we might want to handle this more gracefully
        with pytest.raises(Exception, match="Database error"):
            self.session_service.check_uuid_exists(test_uuid)

    # Edge Cases and Error Conditions
    def test_validate_uuid_with_whitespace(self):
        """Test UUID validation with whitespace."""
        uuid_with_spaces = f"  {str(uuid.uuid4())}  "

        # Current implementation converts to string, so this should be invalid
        response, status_code = self.session_service.validate_uuid(uuid_with_spaces)
        assert status_code == 400
        assert response["status"] == "invalid"

    def test_multiple_service_instances_independent(self):
        """Test that multiple service instances are independent."""
        with patch(
            "backend.app.services.session_service.get_user_session_repository"
        ) as mock_factory:
            mock_repo1 = Mock()
            mock_repo2 = Mock()
            mock_factory.side_effect = [mock_repo1, mock_repo2]

            service1 = SessionService()
            service2 = SessionService()

            assert service1.user_session_repository == mock_repo1
            assert service2.user_session_repository == mock_repo2
            assert service1.user_session_repository != service2.user_session_repository

    # Performance and Concurrency Considerations
    def test_generate_uuid_deterministic_for_testing(self):
        """Test that UUID generation can be mocked for deterministic testing."""
        with patch("uuid.uuid4") as mock_uuid4:
            expected_uuid = uuid.UUID("12345678-1234-5678-1234-567812345678")
            mock_uuid4.return_value = expected_uuid
            self.mock_repository.exists.return_value = False

            response, status_code = self.session_service.generate_uuid()

            assert response["uuid"] == str(expected_uuid)
            assert status_code == 200
