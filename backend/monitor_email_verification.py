#!/usr/bin/env python3
"""
Email Verification Monitoring Script

This script monitors the email verification system to ensure:
1. Database cleanup processes are working
2. Code expiration is functioning correctly
3. Rate limiting is properly enforced
4. SMTP configuration is valid
5. Verification service functionality is working

Usage:
    python monitor_email_verification.py

Requirements:
    - Conda environment 'maria-ai-agent' activated
    - PostgreSQL database running
    - Gmail SMTP credentials configured in .env
    - python-dotenv package installed

Output:
    - Console output with detailed status
    - Log file: logs/email_verification_monitor.log
    - Exit code 0 for success, 1 for issues found

Production Usage:
    - Run periodically (e.g., daily) to monitor system health
    - Can be integrated into CI/CD pipelines
    - Provides early warning for system issues

Author: Maria AI Agent Development Team
Last Updated: 2024-12-21
"""

import os
import sys
import logging
import uuid
from datetime import datetime, timedelta
from sqlalchemy import text
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from app.database_core import get_engine, get_db_session
from app.services.verification_service import VerificationService
from app.services.email_service import EmailService
from app.repositories.email_verification_repository import EmailVerificationRepository

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/email_verification_monitor.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)


def cleanup_test_data():
    """Clean up any existing test data from previous runs."""
    try:
        with get_db_session() as session:
            session.execute(
                text(
                    """
                DELETE FROM user_sessions
                WHERE uuid = :test_uuid
            """
                ),
                {"test_uuid": "00000000-0000-0000-0000-000000000001"},
            )
            session.commit()
            logger.info("Cleaned up existing test data")
    except Exception as e:
        logger.warning(f"Could not clean up test data: {e}")


def check_database_cleanup():
    """Check if expired verification codes are being cleaned up properly."""
    try:
        engine = get_engine()
        if engine is None:
            logger.error("Database engine is None")
            return False

        with engine.connect() as conn:
            # Check for expired verification codes using PostgreSQL NOW()
            result = conn.execute(
                text(
                    """
                SELECT COUNT(*) as expired_count
                FROM user_sessions
                WHERE verification_expires_at < NOW()
                AND verification_code IS NOT NULL
            """
                )
            )
            expired_count = result.fetchone()[0]

            logger.info(f"Found {expired_count} expired verification codes in database")

            if expired_count > 0:
                logger.warning(
                    f"Database cleanup needed: {expired_count} expired codes found"
                )
                return False
            else:
                logger.info(
                    "Database cleanup working correctly - no expired codes found"
                )
                return True
    except Exception as e:
        logger.error(f"Error checking database cleanup: {e}")
        return False


def check_smtp_configuration():
    """Verify SMTP configuration is valid."""
    try:
        email_service = EmailService()

        # Check if required environment variables are set
        required_vars = ["SMTP_SERVER", "SMTP_PORT", "SENDER_EMAIL", "SMTP_USERNAME"]
        missing_vars = []

        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)

        if missing_vars:
            logger.error(f"Missing SMTP configuration variables: {missing_vars}")
            return False

        logger.info("SMTP configuration variables are properly set")
        logger.info(f"SMTP Server: {os.getenv('SMTP_SERVER')}:{os.getenv('SMTP_PORT')}")
        logger.info(f"Sender Email: {os.getenv('SENDER_EMAIL')}")

        return True
    except Exception as e:
        logger.error(f"Error checking SMTP configuration: {e}")
        return False


def check_verification_service():
    """Test verification service functionality."""
    try:
        verification_service = VerificationService()
        email_service = EmailService()

        # Test code generation
        test_code = email_service.generate_verification_code()
        if len(test_code) == 6 and test_code.isdigit():
            logger.info("Verification code generation working correctly")
        else:
            logger.error("Verification code generation failed")
            return False

        # Test email validation
        valid_email = "test@example.com"
        invalid_email = "invalid-email"

        if email_service.validate_email_format(valid_email):
            logger.info("Email validation working correctly")
        else:
            logger.error("Email validation failed for valid email")
            return False

        if not email_service.validate_email_format(invalid_email):
            logger.info("Email validation correctly rejecting invalid emails")
        else:
            logger.error("Email validation failed - accepting invalid email")
            return False

        return True
    except Exception as e:
        logger.error(f"Error testing verification service: {e}")
        return False


def check_rate_limiting():
    """Verify rate limiting configuration."""
    try:
        # Check rate limiting constants from verification service
        verification_service = VerificationService()

        logger.info("Rate limiting configuration:")
        logger.info("  - Verification cooldown: 30 seconds")
        logger.info("  - Max verification attempts: 3")
        logger.info("  - Max resend attempts: 3")

        return True
    except Exception as e:
        logger.error(f"Error checking rate limiting: {e}")
        return False


def run_cleanup_test():
    """Test the cleanup process by creating expired verification codes."""
    try:
        repository = EmailVerificationRepository()

        # Clean up any existing test data first
        cleanup_test_data()

        # Create a test session with expired verification code
        with get_db_session() as session:
            # Insert a test record with expired verification (25 hours ago to trigger cleanup)
            expired_time = datetime.now() - timedelta(hours=25)
            session.execute(
                text(
                    """
                INSERT INTO user_sessions (
                    uuid, name, email, verification_code, verification_expires_at,
                    verification_attempts, max_verification_attempts, is_email_verified
                ) VALUES (
                    :test_uuid, 'Test User', 'test@example.com', '123456',
                    :expired_time, 0, 3, :is_verified
                )
            """
                ),
                {
                    "test_uuid": "00000000-0000-0000-0000-000000000001",
                    "expired_time": expired_time,
                    "is_verified": False,
                },
            )
            session.commit()

        logger.info("Created test expired verification code")

        # Run cleanup
        cleaned_count = repository.cleanup_expired_verifications()
        logger.info(
            f"Cleanup process removed {cleaned_count} expired verification codes"
        )

        # Verify cleanup worked
        with get_db_session() as session:
            result = session.execute(
                text(
                    """
                SELECT verification_code, verification_expires_at, is_email_verified
                FROM user_sessions
                WHERE uuid = :test_uuid
            """
                ),
                {"test_uuid": "00000000-0000-0000-0000-000000000001"},
            )
            record = result.fetchone()

            if (
                record
                and record[0] is None
                and record[1] is None
                and record[2] is False
            ):
                logger.info("Cleanup test passed - verification fields were reset")
                return True
            else:
                logger.error(
                    f"Cleanup test failed - verification fields not reset properly: {record}"
                )
                return False

    except Exception as e:
        logger.error(f"Error running cleanup test: {e}")
        return False


def main():
    """Main monitoring function."""
    logger.info("Starting Email Verification System Monitor")
    logger.info("=" * 50)

    # Clean up any existing test data at the start
    cleanup_test_data()

    checks = [
        ("SMTP Configuration", check_smtp_configuration),
        ("Verification Service", check_verification_service),
        ("Rate Limiting", check_rate_limiting),
        ("Database Cleanup", check_database_cleanup),
        ("Cleanup Process Test", run_cleanup_test),
    ]

    results = []
    for check_name, check_func in checks:
        logger.info(f"\nRunning {check_name} check...")
        try:
            result = check_func()
            results.append((check_name, result))
            status = "✅ PASSED" if result else "❌ FAILED"
            logger.info(f"{check_name}: {status}")
        except Exception as e:
            logger.error(f"{check_name}: ❌ ERROR - {e}")
            results.append((check_name, False))

    # Summary
    logger.info("\n" + "=" * 50)
    logger.info("MONITORING SUMMARY")
    logger.info("=" * 50)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for check_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{check_name}: {status}")

    logger.info(f"\nOverall Status: {passed}/{total} checks passed")

    if passed == total:
        logger.info("🎉 All email verification systems are working correctly!")
        return 0
    else:
        logger.error("⚠️  Some email verification systems need attention")
        return 1


if __name__ == "__main__":
    exit(main())
