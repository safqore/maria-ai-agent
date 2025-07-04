"""
Application factory for Maria AI Agent.

This module creates and configures the Flask application with all necessary
extensions, blueprints, and middleware.
"""

import os
from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from app.routes.session import session_bp, setup_session_service
from app.routes.upload import upload_bp
from app.utils.middleware import setup_request_logging, setup_request_validation
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

    # Enable CORS
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Initialize rate limiting (disabled for tests)
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"],
        storage_uri="memory://",
        enabled=not app.config.get('TESTING', False)
    )

    # Setup middleware (check for SKIP_MIDDLEWARE config)
    skip_middleware = app.config.get("SKIP_MIDDLEWARE", False)

    if not skip_middleware:
        setup_request_logging(app)
        setup_request_validation(app)
        setup_auth_middleware(app)
    else:
        # For tests, we still want basic logging but skip auth
        setup_request_logging(app)

    # Register blueprints
    app.register_blueprint(session_bp, url_prefix="/api/v1")
    app.register_blueprint(upload_bp, url_prefix="/api/v1")

    # Setup request context
    @app.before_request
    def setup_request_context():
        setup_session_service()

    return app
