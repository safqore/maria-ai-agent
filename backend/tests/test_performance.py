"""
Performance tests for Maria AI Agent backend.

This module contains tests that verify the performance characteristics
of the application under various load conditions.
"""

import queue
import statistics
import threading
import time
import uuid
from contextlib import contextmanager
from typing import List

import pytest

from app import create_app
from app.database_core import get_db_session
from app.database.transaction import TransactionContext
from app.models import UserSession
from app.repositories.user_session_repository import UserSessionRepository


class TestPerformance:
    """Performance tests for database and API operations."""

    @contextmanager
    def performance_timer(self):
        """Context manager to measure execution time."""
        start_time = time.time()
        yield
        end_time = time.time()
        self.last_execution_time = end_time - start_time

    def test_repository_create_performance(self):
        """Test repository create operation performance."""
        repo = UserSessionRepository()
        execution_times = []

        for i in range(10):
            with self.performance_timer():
                session_uuid = str(uuid.uuid4())
                repo.create(
                    uuid=session_uuid,
                    name=f"Perf Test User {i}",
                    email=f"perf{i}@example.com",
                    consent_user_data=True,
                )
            execution_times.append(self.last_execution_time)

        avg_time = statistics.mean(execution_times)
        max_time = max(execution_times)

        # Assert performance expectations
        assert (
            avg_time < 0.2
        ), f"Average create time {avg_time:.3f}s exceeds 200ms threshold"
        assert (
            max_time < 0.5
        ), f"Max create time {max_time:.3f}s exceeds 500ms threshold"

        print(
            f"Repository create performance: avg={avg_time:.3f}s, max={max_time:.3f}s"
        )

    def test_repository_get_performance(self):
        """Test repository get operation performance."""
        repo = UserSessionRepository()

        # Create a test session first
        session_uuid = str(uuid.uuid4())
        repo.create(
            uuid=session_uuid,
            name="Performance Test User",
            email="perf@example.com",
            consent_user_data=True,
        )

        execution_times = []

        # Test retrieval performance
        for i in range(20):
            with self.performance_timer():
                # Convert string UUID to UUID object for repository method
                session = repo.get_by_uuid(uuid.UUID(session_uuid))
            execution_times.append(self.last_execution_time)
            assert session is not None, f"Session {session_uuid} should exist"

        avg_time = statistics.mean(execution_times)
        max_time = max(execution_times)

        # Assert performance expectations for retrieval
        assert (
            avg_time < 0.1
        ), f"Average get time {avg_time:.3f}s exceeds 100ms threshold"
        assert max_time < 0.2, f"Max get time {max_time:.3f}s exceeds 200ms threshold"

        print(f"Repository get performance: avg={avg_time:.3f}s, max={max_time:.3f}s")

    def test_connection_pooling_performance(self):
        """Test database connection pooling performance."""
        execution_times = []

        # Test multiple rapid database connections
        for i in range(20):
            with self.performance_timer():
                with get_db_session() as session:
                    result = session.query(UserSession).first()
            execution_times.append(self.last_execution_time)

        avg_time = statistics.mean(execution_times)
        max_time = max(execution_times)

        # Connection pooling should make connections fast
        assert (
            avg_time < 0.1
        ), f"Average connection time {avg_time:.3f}s suggests pooling issues"
        assert (
            max_time < 0.2
        ), f"Max connection time {max_time:.3f}s suggests pooling issues"

        print(
            f"Connection pooling performance: avg={avg_time:.3f}s, max={max_time:.3f}s"
        )

    def test_transaction_context_performance(self):
        """Test TransactionContext performance."""
        execution_times = []

        for i in range(10):
            with self.performance_timer():
                with TransactionContext() as session:
                    # Perform multiple operations in single transaction
                    session_uuid = uuid.uuid4()  # Use UUID object directly, not string
                    user_session = UserSession(
                        uuid=session_uuid,
                        name=f"Transaction Test {i}",
                        email=f"trans{i}@example.com",
                        consent_user_data=True,
                    )
                    session.add(user_session)
                    session.flush()

                    # Update the session
                    user_session.name = f"Updated Transaction Test {i}"
                    session.flush()

                    # Query the session
                    retrieved = (
                        session.query(UserSession)
                        .filter(UserSession.uuid == session_uuid)
                        .first()
                    )
                    assert retrieved is not None

            execution_times.append(self.last_execution_time)

        avg_time = statistics.mean(execution_times)
        max_time = max(execution_times)

        # Assert performance expectations for transaction context
        assert (
            avg_time < 0.2
        ), f"Average transaction time {avg_time:.3f}s exceeds 200ms threshold"
        assert (
            max_time < 0.5
        ), f"Max transaction time {max_time:.3f}s exceeds 500ms threshold"

        print(
            f"Transaction context performance: avg={avg_time:.3f}s, max={max_time:.3f}s"
        )


class TestAPIPerformance:
    """Performance tests for API endpoints."""

    @pytest.fixture(scope="class")
    def app(self):
        """Create test application."""
        app = create_app({"TESTING": True})
        app.config["TESTING"] = True
        app.config["RATELIMIT_ENABLED"] = False  # Disable for performance tests
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client."""
        with app.test_client() as client:
            yield client

    @contextmanager
    def performance_timer(self):
        """Context manager to measure execution time."""
        start_time = time.time()
        yield
        end_time = time.time()
        self.last_execution_time = end_time - start_time

    def test_generate_uuid_performance(self, client):
        """Test UUID generation endpoint performance."""
        execution_times = []

        for i in range(20):
            with self.performance_timer():
                response = client.post("/api/v1/generate-uuid")
            execution_times.append(self.last_execution_time)
            assert response.status_code == 200

        avg_time = statistics.mean(execution_times)
        max_time = max(execution_times)

        # API should respond quickly
        assert avg_time < 0.2, f"Average response time {avg_time:.3f}s exceeds 200ms"
        assert max_time < 0.5, f"Max response time {max_time:.3f}s exceeds 500ms"

        print(f"UUID generation performance: avg={avg_time:.3f}s, max={max_time:.3f}s")

    def test_validate_uuid_performance(self, client):
        """Test UUID validation endpoint performance."""
        test_uuid = str(uuid.uuid4())
        execution_times = []

        for i in range(20):
            with self.performance_timer():
                response = client.post(
                    "/api/v1/validate-uuid",
                    json={"uuid": test_uuid},
                    content_type="application/json",
                )
            execution_times.append(self.last_execution_time)
            # Accept both 200 (valid) and 409 (collision) as successful responses
            assert response.status_code in [200, 409]

        avg_time = statistics.mean(execution_times)
        max_time = max(execution_times)

        # Validation should be fast
        assert avg_time < 0.2, f"Average validation time {avg_time:.3f}s exceeds 200ms"
        assert max_time < 0.5, f"Max validation time {max_time:.3f}s exceeds 500ms"

        print(f"UUID validation performance: avg={avg_time:.3f}s, max={max_time:.3f}s")

    @pytest.mark.sqlite_incompatible
    @pytest.mark.performance
    def test_concurrent_api_requests(self, client):
        """Test concurrent API request handling."""
        results = queue.Queue()

        def worker():
            try:
                start_time = time.time()
                # Each thread needs its own test client with proper context
                with client as thread_client:
                    # Make multiple API calls
                    for i in range(5):
                        response = thread_client.post("/api/v1/generate-uuid")
                        assert response.status_code == 200
                end_time = time.time()
                results.put(end_time - start_time)
            except Exception as e:
                results.put(f"Error: {e}")

        # Start multiple threads
        threads = []
        for i in range(3):
            thread = threading.Thread(target=worker)
            threads.append(thread)
            thread.start()

        # Wait for completion
        for thread in threads:
            thread.join()

        # Collect results
        execution_times = []
        while not results.empty():
            result = results.get()
            if isinstance(result, str):
                pytest.fail(f"Concurrent test failed: {result}")
            execution_times.append(result)

        avg_time = statistics.mean(execution_times)
        max_time = max(execution_times)

        # Concurrent requests should complete reasonably fast
        assert avg_time < 3.0, f"Average concurrent time {avg_time:.3f}s exceeds 3s"
        assert max_time < 5.0, f"Max concurrent time {max_time:.3f}s exceeds 5s"

        print(f"Concurrent API performance: avg={avg_time:.3f}s, max={max_time:.3f}s")

    def test_api_throughput(self, client):
        """Test API throughput under load."""
        start_time = time.time()
        successful_requests = 0

        # Make requests for 3 seconds
        while time.time() - start_time < 3:
            response = client.post("/api/v1/generate-uuid")
            if response.status_code == 200:
                successful_requests += 1

        total_time = time.time() - start_time
        throughput = successful_requests / total_time

        # Should handle reasonable throughput
        assert throughput > 5, f"Throughput {throughput:.1f} req/s is too low"

        print(
            f"API throughput: {throughput:.1f} requests/second over {total_time:.1f}s"
        )
