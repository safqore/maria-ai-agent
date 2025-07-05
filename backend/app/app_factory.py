"""
Application factory for Maria AI Agent.

This module creates and configures the Flask application with all necessary
extensions, blueprints, and middleware.
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from app.routes.session import session_bp, setup_session_service
from app.routes.upload import upload_bp
from app.utils.middleware import (
    setup_request_logging, 
    setup_request_validation,
    apply_middleware_to_blueprint
)
from app.utils.auth import setup_auth_middleware


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

    # Enable CORS with proper headers
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-API-Key", "X-Correlation-ID"],
            "expose_headers": ["X-API-Version", "X-Correlation-ID"]
        }
    })

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
        session_limiter.init_app(app)
        upload_limiter.init_app(app)
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
    else:
        # For tests, we still want basic logging but skip auth and request validation
        setup_request_logging(app)
        # Skip middleware on blueprints for performance tests

    # Register blueprints
    app.register_blueprint(session_bp, url_prefix="/api/v1")
    app.register_blueprint(upload_bp, url_prefix="/api/v1")

    # Add main API info endpoint
    @app.route("/api/info", methods=["GET"])
    def api_info():
        """Get API information."""
        response = jsonify({
            "name": "Maria AI Agent API",
            "version": "v1",
            "endpoints": [
                "/api/v1/generate-uuid",
                "/api/v1/validate-uuid",
                "/api/v1/persist_session",
                "/api/info"
            ]
        })
        # Add version header for consistency
        response.headers["X-API-Version"] = "v1"
        return response, 200

    # Setup request context
    @app.before_request
    def setup_request_context():
        setup_session_service()

    return app
