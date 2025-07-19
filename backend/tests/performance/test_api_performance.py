"""
API Performance tests for Maria AI Agent backend.

This module tests API endpoint performance including:
- Response time benchmarking
- Throughput testing
- Concurrent request handling
- Rate limiting validation
"""

import queue
import statistics
import threading
import time
import uuid
from contextlib import contextmanager

import pytest
from app import create_app


class TestAPIPerformance:
    """Performance tests for API endpoints."""

    @pytest.fixture(scope="class")
    def app(self):
        """Create test application."""
        # Create app with rate limiting completely disabled
        config = {
            "TESTING": True,
            "RATELIMIT_ENABLED": False,  # Explicitly disable rate limiting
            "REQUIRE_AUTH": False,  # Disable auth for performance tests
            "SKIP_MIDDLEWARE": True,  # Skip most middleware for performance
            "RATELIMIT_STORAGE_URL": "memory://",  # Use in-memory storage
            "SESSION_RATE_LIMIT": "1000/minute",  # Set very high limit as fallback
        }

        app = create_app(config)

        # Verify rate limiting is disabled
        with app.app_context():
            # Double-check that rate limiting is disabled
            assert not app.config.get(
                "RATELIMIT_ENABLED", True
            ), "Rate limiting should be disabled"

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

        for i in range(50):
            with self.performance_timer():
                response = client.post("/api/v1/generate-uuid")
            execution_times.append(self.last_execution_time)
            assert response.status_code == 200

        avg_time = statistics.mean(execution_times)
        max_time = max(execution_times)

        # API should respond quickly
        assert avg_time < 0.1, f"Average response time {avg_time:.3f}s exceeds 100ms"
        assert max_time < 0.2, f"Max response time {max_time:.3f}s exceeds 200ms"

        print(f"UUID generation performance: avg={avg_time:.3f}s, max={max_time:.3f}s")

    def test_validate_uuid_performance(self, client):
        """Test UUID validation endpoint performance."""
        test_uuid = str(uuid.uuid4())
        execution_times = []

        for i in range(50):
            with self.performance_timer():
                response = client.post(
                    "/api/v1/validate-uuid",
                    json={"uuid": test_uuid},
                    content_type="application/json",
                )
            execution_times.append(self.last_execution_time)
            assert response.status_code == 200

        avg_time = statistics.mean(execution_times)
        max_time = max(execution_times)

        # Validation should be fast
        assert avg_time < 0.05, f"Average validation time {avg_time:.3f}s exceeds 50ms"
        assert max_time < 0.1, f"Max validation time {max_time:.3f}s exceeds 100ms"

        print(f"UUID validation performance: avg={avg_time:.3f}s, max={max_time:.3f}s")

    @pytest.mark.sqlite_incompatible
    @pytest.mark.performance
    def test_concurrent_api_requests(self, app):
        """Test concurrent API request handling."""
        results = queue.Queue()

        def worker():
            try:
                start_time = time.time()
                # Each thread needs its own test client with proper context
                with app.test_client() as thread_client:
                    # Make multiple API calls
                    for i in range(10):
                        response = thread_client.post("/api/v1/generate-uuid")
                        assert response.status_code == 200
                end_time = time.time()
                results.put(end_time - start_time)
            except Exception as e:
                results.put(f"Error: {e}")

        # Start multiple threads
        threads = []
        for i in range(5):
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
        assert avg_time < 2.0, f"Average concurrent time {avg_time:.3f}s exceeds 2s"
        assert max_time < 5.0, f"Max concurrent time {max_time:.3f}s exceeds 5s"

        print(f"Concurrent API performance: avg={avg_time:.3f}s, max={max_time:.3f}s")

    @pytest.mark.performance
    def test_api_throughput(self, client):
        """Test API throughput under load."""
        start_time = time.time()
        successful_requests = 0

        # Make requests for 5 seconds
        while time.time() - start_time < 5:
            response = client.post("/api/v1/generate-uuid")
            if response.status_code == 200:
                successful_requests += 1

        total_time = time.time() - start_time
        throughput = successful_requests / total_time

        # Should handle reasonable throughput
        assert throughput > 10, f"Throughput {throughput:.1f} req/s is too low"

        print(
            f"API throughput: {throughput:.1f} requests/second over {total_time:.1f}s"
        )
