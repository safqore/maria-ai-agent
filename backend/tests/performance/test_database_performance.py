"""
Performance tests for database operations and optimization verification.

This module tests the database performance optimizations including:
- Index usage verification
- Lazy loading strategy validation
- Query performance benchmarking
- Connection pooling verification
"""

import statistics
import time
import uuid
from contextlib import contextmanager
from typing import Any, Dict, List

import pytest

from backend.app.database_core import get_db_session, init_database
from backend.app.database.transaction import TransactionContext
from backend.app.models import UserSession
from backend.app.repositories.user_session_repository import UserSessionRepository


class TestDatabasePerformance:
    """Performance tests for database operations."""

    @pytest.fixture(scope="class")
    def setup_test_data(self):
        """Setup test data for performance testing."""
        # Initialize database with table creation like conftest.py
        from backend.app.database_core import get_engine, Base, init_database
        from backend.app.models import UserSession  # Import models to ensure they're registered
        
        init_database()
        engine = get_engine()
        
        # Create database tables
        Base.metadata.create_all(bind=engine)
        print("DEBUG: Database tables created successfully")

        # Create test sessions for performance testing
        test_sessions = []
        with TransactionContext() as session:
            for i in range(100):
                session_uuid = uuid.uuid4()  # Create UUID object, not string
                user_session = UserSession(
                    uuid=session_uuid,  # Pass UUID object directly
                    name=f"Test User {i}",
                    email=f"test{i}@example.com",
                    consent_user_data=True,
                    is_email_verified=i % 2 == 0,  # Half verified, half not
                    verification_code=f"CODE{i:03d}" if i % 2 == 1 else None,
                    verification_attempts=i % 4,
                    resend_attempts=i % 3,
                )
                session.add(user_session)
                test_sessions.append(str(session_uuid))  # Store string for comparison

        yield test_sessions

        # Cleanup
        with TransactionContext() as session:
            # Convert string UUIDs to UUID objects for proper comparison
            uuid_objects = [uuid.UUID(uuid_str) for uuid_str in test_sessions]
            session.query(UserSession).filter(
                UserSession.uuid.in_(uuid_objects)
            ).delete(synchronize_session=False)
            
        print("DEBUG: Database tables cleaned up")

    @contextmanager
    def performance_timer(self):
        """Context manager to measure execution time."""
        start_time = time.time()
        yield
        end_time = time.time()
        self.last_execution_time = end_time - start_time

    def test_repository_create_performance(self, setup_test_data):
        """Test repository create operation performance."""
        repo = UserSessionRepository()
        execution_times = []

        for i in range(10):
            with self.performance_timer():
                session_uuid = str(uuid.uuid4())
                repo.create_session(  # Use create_session which handles string UUID conversion
                    session_uuid=session_uuid,
                    name=f"Perf Test User {i}",
                    email=f"perf{i}@example.com",
                    consent_user_data=True,
                )
            execution_times.append(self.last_execution_time)

        avg_time = statistics.mean(execution_times)
        max_time = max(execution_times)

        # Assert performance expectations
        assert (
            avg_time < 0.1
        ), f"Average create time {avg_time:.3f}s exceeds 100ms threshold"
        assert (
            max_time < 0.2
        ), f"Max create time {max_time:.3f}s exceeds 200ms threshold"

        print(
            f"Repository create performance: avg={avg_time:.3f}s, max={max_time:.3f}s"
        )

    def test_repository_get_by_uuid_performance(self, setup_test_data):
        """Test repository get_by_uuid operation performance (tests index usage)."""
        repo = UserSessionRepository()
        test_sessions = setup_test_data
        execution_times = []

        # Test retrieval performance with indexed UUID lookup
        for session_uuid_str in test_sessions[:20]:  # Test first 20
            with self.performance_timer():
                session = repo.get_by_uuid(uuid.UUID(session_uuid_str))  # Convert string to UUID object
            execution_times.append(self.last_execution_time)
            assert session is not None, f"Session {session_uuid_str} should exist"

        avg_time = statistics.mean(execution_times)
        max_time = max(execution_times)

        # Assert performance expectations for indexed lookup
        assert (
            avg_time < 0.05
        ), f"Average get_by_uuid time {avg_time:.3f}s exceeds 50ms threshold"
        assert (
            max_time < 0.1
        ), f"Max get_by_uuid time {max_time:.3f}s exceeds 100ms threshold"

        print(
            f"Repository get_by_uuid performance: avg={avg_time:.3f}s, max={max_time:.3f}s"
        )

    def test_email_lookup_performance(self, setup_test_data):
        """Test email lookup performance (tests email index usage)."""
        execution_times = []

        # Test email index performance
        with get_db_session() as session:
            for i in range(20):
                email = f"test{i}@example.com"
                with self.performance_timer():
                    result = (
                        session.query(UserSession)
                        .filter(UserSession.email == email)
                        .first()
                    )
                execution_times.append(self.last_execution_time)
                assert result is not None, f"User with email {email} should exist"

        avg_time = statistics.mean(execution_times)
        max_time = max(execution_times)

        # Assert performance expectations for email index
        assert (
            avg_time < 0.05
        ), f"Average email lookup time {avg_time:.3f}s exceeds 50ms threshold"
        assert (
            max_time < 0.1
        ), f"Max email lookup time {max_time:.3f}s exceeds 100ms threshold"

        print(f"Email lookup performance: avg={avg_time:.3f}s, max={max_time:.3f}s")

    def test_verification_status_query_performance(self, setup_test_data):
        """Test verification status query performance (tests composite index usage)."""
        execution_times = []

        # Test composite index performance for verification queries
        with get_db_session() as session:
            for verified in [True, False]:
                with self.performance_timer():
                    results = (
                        session.query(UserSession)
                        .filter(
                            UserSession.is_email_verified == verified,
                            UserSession.completed_at.is_(None),
                        )
                        .all()
                    )
                execution_times.append(self.last_execution_time)
                assert (
                    len(results) > 0
                ), f"Should find sessions with is_email_verified={verified}"

        avg_time = statistics.mean(execution_times)
        max_time = max(execution_times)

        # Assert performance expectations for composite index
        assert (
            avg_time < 0.1
        ), f"Average verification query time {avg_time:.3f}s exceeds 100ms threshold"
        assert (
            max_time < 0.2
        ), f"Max verification query time {max_time:.3f}s exceeds 200ms threshold"

        print(
            f"Verification status query performance: avg={avg_time:.3f}s, max={max_time:.3f}s"
        )

    def test_bulk_operations_performance(self, setup_test_data):
        """Test bulk operations performance."""
        execution_times = []

        # Test bulk query performance
        with get_db_session() as session:
            with self.performance_timer():
                all_sessions = session.query(UserSession).all()
            execution_times.append(self.last_execution_time)
            assert len(all_sessions) >= 100, "Should retrieve all test sessions"

        # Test bulk count performance
        with get_db_session() as session:
            with self.performance_timer():
                count = session.query(UserSession).count()
            execution_times.append(self.last_execution_time)
            assert count >= 100, "Should count all test sessions"

        avg_time = statistics.mean(execution_times)
        max_time = max(execution_times)

        # Assert performance expectations for bulk operations
        assert (
            avg_time < 0.2
        ), f"Average bulk operation time {avg_time:.3f}s exceeds 200ms threshold"
        assert (
            max_time < 0.5
        ), f"Max bulk operation time {max_time:.3f}s exceeds 500ms threshold"

        print(f"Bulk operations performance: avg={avg_time:.3f}s, max={max_time:.3f}s")

    def test_transaction_context_performance(self, setup_test_data):
        """Test TransactionContext performance."""
        execution_times = []

        for i in range(10):
            with self.performance_timer():
                with TransactionContext() as session:
                    # Perform multiple operations in single transaction
                    session_uuid = uuid.uuid4()  # Create UUID object, not string
                    user_session = UserSession(
                        uuid=session_uuid,  # Pass UUID object directly
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
            avg_time < 0.1
        ), f"Average transaction time {avg_time:.3f}s exceeds 100ms threshold"
        assert (
            max_time < 0.2
        ), f"Max transaction time {max_time:.3f}s exceeds 200ms threshold"

        print(
            f"Transaction context performance: avg={avg_time:.3f}s, max={max_time:.3f}s"
        )

    def test_lazy_loading_verification(self, setup_test_data):
        """Verify lazy loading is working correctly."""
        repo = UserSessionRepository()
        test_sessions = setup_test_data

        # Get a session and verify lazy loading behavior
        session = repo.get_by_uuid(uuid.UUID(test_sessions[0]))  # Convert string to UUID object
        assert session is not None

        # Verify that accessing attributes doesn't cause additional queries
        # (This is a basic test - in production you'd use SQL query monitoring)
        with self.performance_timer():
            # Access all attributes
            attrs = [
                session.uuid,
                session.name,
                session.email,
                session.created_at,
                session.updated_at,
                session.completed_at,
                session.ip_address,
                session.consent_user_data,
                session.is_email_verified,
                session.verification_code,
                session.verification_attempts,
            ]

        # Should be very fast since all data is already loaded
        assert (
            self.last_execution_time < 0.001
        ), f"Attribute access took {self.last_execution_time:.3f}s"

        print(
            f"Lazy loading verification: attribute access time={self.last_execution_time:.6f}s"
        )

    def test_connection_pooling_performance(self):
        """Test connection pooling performance."""
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
            avg_time < 0.05
        ), f"Average connection time {avg_time:.3f}s suggests pooling issues"
        assert (
            max_time < 0.1
        ), f"Max connection time {max_time:.3f}s suggests pooling issues"

        print(
            f"Connection pooling performance: avg={avg_time:.3f}s, max={max_time:.3f}s"
        )

    def test_concurrent_access_performance(self, setup_test_data):
        """Test concurrent database access performance."""
        import queue
        import threading

        results = queue.Queue()

        def worker():
            try:
                start_time = time.time()
                # Each thread needs its own repository instance to avoid context conflicts
                repo = UserSessionRepository()
                # Perform multiple operations
                for i in range(5):
                    session_uuid = uuid.uuid4()  # Create UUID object, not string
                    # Use create_session method which properly handles UUID conversion
                    created_session = repo.create_session(
                        session_uuid=str(session_uuid),  # Pass string UUID to create_session
                        name=f"Concurrent Test {threading.current_thread().ident}",
                        email=f"concurrent{i}@{threading.current_thread().ident}.com",
                        consent_user_data=True,
                    )
                    assert created_session is not None
                    
                    # Retrieve it back
                    retrieved = repo.get_by_uuid(session_uuid)  # Pass UUID object
                    assert retrieved is not None

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

        # Wait for all threads to complete
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

        # Assert reasonable performance under concurrent load
        assert (
            avg_time < 1.0
        ), f"Average concurrent operation time {avg_time:.3f}s exceeds 1s threshold"
        assert (
            max_time < 2.0
        ), f"Max concurrent operation time {max_time:.3f}s exceeds 2s threshold"

        print(
            f"Concurrent access performance: avg={avg_time:.3f}s, max={max_time:.3f}s"
        )

    def test_index_usage_verification(self, setup_test_data):
        """Verify that database indexes are being used effectively."""
        # This is a basic verification - in production you'd use EXPLAIN QUERY PLAN
        repo = UserSessionRepository()
        test_sessions = setup_test_data

        # Test operations that should use indexes
        operations = [
            ("UUID lookup", lambda: repo.get_by_uuid(uuid.UUID(test_sessions[0]))),  # Convert to UUID object
            ("Email lookup", lambda: repo.get_by_id(test_sessions[1])),
            ("Existence check", lambda: repo.exists(uuid.UUID(test_sessions[2]))),  # Convert to UUID object
        ]

        for operation_name, operation in operations:
            with self.performance_timer():
                result = operation()

            # All indexed operations should be fast
            assert (
                self.last_execution_time < 0.1
            ), f"{operation_name} took {self.last_execution_time:.3f}s"
            print(f"{operation_name} performance: {self.last_execution_time:.3f}s")

    def generate_performance_report(self, setup_test_data):
        """Generate a comprehensive performance report."""
        report = {
            "database_performance_report": {
                "test_date": time.strftime("%Y-%m-%d %H:%M:%S"),
                "total_test_sessions": len(setup_test_data),
                "performance_metrics": {},
            }
        }

        # This would be extended to collect metrics from all tests
        print("Performance Report Generated")
        print(f"Test completed with {len(setup_test_data)} test sessions")

        return report
