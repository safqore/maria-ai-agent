"""
Application factory for Maria AI Agent.

This module creates and configures the Flask application with all necessary
extensions, blueprints, and middleware.
"""

import os

from app.routes.email_verification import email_verification_bp
from app.routes.session import session_bp, setup_session_service
from app.routes.upload import upload_bp
from app.utils.auth import setup_auth_middleware
from app.utils.middleware import (
    apply_middleware_to_blueprint,
    setup_request_logging,
    setup_request_validation,
)
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


def create_app(config=None):
    """
    Create and configure the Flask application.

    Args:
        config: Optional configuration object or dict

    Returns:
        Flask: Configured Flask application
    """
    app = Flask(__name__)

    # Load configuration
    if config:
        app.config.update(config)
    else:
        # Load from environment variables
        app.config.from_object("config.Config")

    # Ensure SESSION_RATE_LIMIT and RATELIMIT_ENABLED are set in app.config
    import logging

    logging.basicConfig(level=logging.INFO)

    # Use more reasonable defaults for development
    default_rate_limit = (
        "100/minute" if app.config.get("TESTING", False) else "100/minute"
    )

    # Only set from environment if not already provided in config
    if "SESSION_RATE_LIMIT" not in app.config:
        app.config["SESSION_RATE_LIMIT"] = os.getenv(
            "SESSION_RATE_LIMIT", default_rate_limit
        )
    if "RATELIMIT_ENABLED" not in app.config:
        app.config["RATELIMIT_ENABLED"] = os.getenv("RATELIMIT_ENABLED", "True")

    logging.info(
        f"[Startup] SESSION_RATE_LIMIT: {app.config.get('SESSION_RATE_LIMIT', 'not set')}"
    )
    logging.info(
        f"[Startup] RATELIMIT_ENABLED: {app.config.get('RATELIMIT_ENABLED', 'not set')}"
    )
    logging.info(f"[Startup] TESTING: {app.config.get('TESTING', 'not set')}")

    from app.routes.session import limiter as session_limiter

    # Set default limits from config
    session_limiter._default_limits = [app.config["SESSION_RATE_LIMIT"]]
    logging.info(
        f"[Startup] SESSION_RATE_LIMIT config: {app.config['SESSION_RATE_LIMIT']}"
    )
    logging.info(
        f"[Startup] session_limiter._default_limits: {getattr(session_limiter, '_default_limits', 'unknown')}"
    )
    logging.info(
        f"[Startup] session_limiter._enabled: {getattr(session_limiter, '_enabled', 'unknown')}"
    )

    # Enable CORS with proper headers
    # Get allowed origins from environment variable, fall back to localhost:3000 for development
    cors_origins_str = os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001",
    )
    cors_origins = [
        origin.strip() for origin in cors_origins_str.split(",") if origin.strip()
    ]

    logging.info(f"[Startup] CORS origins configured: {cors_origins}")

    # Custom CORS handler to properly handle origin matching
    @app.after_request
    def after_request(response):
        origin = request.headers.get("Origin")
        if origin in cors_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = (
                "GET, POST, PUT, DELETE, OPTIONS"
            )
            response.headers["Access-Control-Allow-Headers"] = (
                "Content-Type, Authorization, X-API-Key, X-Correlation-ID, X-Session-ID"
            )
            response.headers["Access-Control-Expose-Headers"] = (
                "X-API-Version, X-Correlation-ID"
            )
            response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    # Initialize rate limiting
    # Import limiters from route modules to use the same instances
    from app.routes.session import limiter as session_limiter
    from app.routes.upload import limiter as upload_limiter

    # Set enabled status based on app config
    # Rate limiting is disabled by default in tests, but can be explicitly enabled
    # If RATELIMIT_ENABLED is explicitly set to True, honor that even in test mode
    if app.config.get("RATELIMIT_ENABLED") is True:
        # Explicitly enabled - honor this setting
        limiter_enabled = True
    elif app.config.get("RATELIMIT_ENABLED") is False:
        # Explicitly disabled - honor this setting
        limiter_enabled = False
    else:
        # Default behavior: disable in test mode, enable in production
        limiter_enabled = not app.config.get("TESTING", False)

    # Configure storage URL if specified
    storage_url = app.config.get("RATELIMIT_STORAGE_URL", "memory://")

    # Configure and initialize both limiters with the app
    session_limiter._enabled = limiter_enabled
    upload_limiter._enabled = limiter_enabled

    # Only initialize limiters if rate limiting is enabled
    if limiter_enabled:
        # Initialize session limiter first with its specific configuration
        session_limiter.init_app(app)
        # Initialize upload limiter with its own configuration
        upload_limiter.init_app(app)

        # Ensure session limiter uses the correct rate limit
        session_limiter._default_limits = [app.config["SESSION_RATE_LIMIT"]]
        logging.info(
            f"[Startup] Final session_limiter._default_limits: {getattr(session_limiter, '_default_limits', 'unknown')}"
        )
    else:
        # For disabled limiters, we still need to set up the app context
        # but with no active limiting
        try:
            session_limiter.init_app(app)
            upload_limiter.init_app(app)
            # Force disable after init
            session_limiter._enabled = False
            upload_limiter._enabled = False
        except Exception:
            # If init fails, that's ok for disabled limiters
            pass

    # Setup middleware (check for SKIP_MIDDLEWARE config)
    skip_middleware = app.config.get("SKIP_MIDDLEWARE", False)

    if not skip_middleware:
        setup_request_logging(app)
        setup_request_validation(app)
        setup_auth_middleware(app)
        # Apply middleware to blueprints with versioning
        apply_middleware_to_blueprint(session_bp, api_version="v1")
        apply_middleware_to_blueprint(upload_bp, api_version="v1")
        apply_middleware_to_blueprint(email_verification_bp, api_version="v1")
    else:
        # For tests, we still want basic logging but skip auth and request validation
        setup_request_logging(app)
        # Skip middleware on blueprints for performance tests

    # Register blueprints
    app.register_blueprint(session_bp, url_prefix="/api/v1")
    app.register_blueprint(upload_bp, url_prefix="/api/v1")
    app.register_blueprint(email_verification_bp, url_prefix="/api/v1")

    # Add main API info endpoint
    @app.route("/api/info", methods=["GET"])
    def api_info():
        """Get API information."""
        response = jsonify(
            {
                "name": "Maria AI Agent API",
                "version": "v1",
                "endpoints": [
                    "/api/v1/generate-uuid",
                    "/api/v1/validate-uuid",
                    "/api/v1/persist_session",
                    "/api/info",
                ],
            }
        )
        # Add version header for consistency
        response.headers["X-API-Version"] = "v1"
        return response, 200

    # Add a simple health check endpoint
    @app.route("/health", methods=["GET"])
    def health_check():
        """Simple health check endpoint."""
        return (
            jsonify(
                {
                    "status": "healthy",
                    "rate_limit": app.config.get("SESSION_RATE_LIMIT"),
                }
            ),
            200,
        )

    # Add OPTIONS request logging
    @app.before_request
    def log_request_info():
        if request.method == "OPTIONS":
            origin = request.headers.get("Origin", "No Origin")
            logging.info(f"OPTIONS request to {request.path}")
            logging.info(f"Origin header: {origin}")
            logging.info(
                f"Access-Control-Request-Method: {request.headers.get('Access-Control-Request-Method', 'None')}"
            )
            logging.info(
                f"Access-Control-Request-Headers: {request.headers.get('Access-Control-Request-Headers', 'None')}"
            )

    # Setup request context
    @app.before_request
    def setup_request_context():
        setup_session_service()

    return app
