"""
Application factory for Maria AI Agent backend.

This module provides a function to create a Flask application instance
with all the necessary configuration and blueprint registrations.
"""

import logging
import os
from pathlib import Path

import redis
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Path constants
FRONTEND_ENV_PATH = Path(__file__).parent.parent.parent / "frontend" / ".env"

# Import the blueprints
from backend.app.routes.session import session_bp
from backend.app.routes.upload import upload_bp
from backend.app.utils.auth import setup_auth_middleware
from backend.app.utils.middleware import (
    apply_middleware_to_blueprint,
    setup_request_logging,
    setup_request_validation,
)

# Initialize rate limiter with remote address as the key function
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=redis_url,
    storage_options={"socket_connect_timeout": 30},
    strategy="fixed-window",
)


def read_frontend_env_file() -> dict[str, str]:
    """Read frontend .env file and return as dictionary.

    Returns:
        dict[str, str]: Dictionary of environment variables from frontend .env
    """
    env_vars = {}
    try:
        with open(FRONTEND_ENV_PATH, "r") as file:
            for line in file:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key.strip()] = value.strip()
    except FileNotFoundError:
        logger.warning(f"Frontend .env file not found at {FRONTEND_ENV_PATH}")
    except Exception as e:
        logger.error(f"Error reading frontend .env file: {e}")

    return env_vars


def get_frontend_port() -> str:
    """Get the frontend port from environment or frontend .env file.

    Returns:
        str: Frontend port number as string
    """
    # Try to get from environment first
    port = os.getenv("FRONTEND_PORT")
    if port:
        return port

    # Try to get from frontend .env file
    frontend_env = read_frontend_env_file()
    port = frontend_env.get("PORT")
    if port:
        return port

    # Default port for React applications
    return "3000"


def get_cors_origins() -> list[str]:
    """Get allowed CORS origins based on frontend port configuration.

    This dynamically creates the CORS origin list based on the frontend
    port configuration, allowing for flexible development setups.

    Returns:
        list[str]: List of allowed CORS origins
    """
    frontend_port = get_frontend_port()
    # Get allowed hosts from environment, default to localhost and 127.0.0.1
    allowed_hosts = os.getenv("CORS_HOSTS", "localhost,127.0.0.1").split(",")

    # Build origins list with protocol and port
    origins = []
    for host in allowed_hosts:
        host = host.strip()
        if host:
            # Add both http and https for each host
            origins.append(f"http://{host}:{frontend_port}")
            origins.append(f"https://{host}:{frontend_port}")

    # Log the configured origins for debugging
    logger.info(f"CORS configured with origins: {origins}")

    return origins


def create_app(test_config=None):
    """
    Create and configure the Flask application.

    Args:
        test_config: Configuration dictionary for testing

    Returns:
        A configured Flask application instance
    """
    # Load environment variables from .env file
    load_dotenv(
        dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    )

    # Initialize database after environment is loaded
    from backend.app.database_core import get_engine, get_session_local, init_database, Base

    # Don't initialize database here - let it be initialized lazily when needed
    # This allows test fixtures to override the database URL before any engine is created

    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)

    # Configure CORS with dynamic origins
    cors_origins = get_cors_origins()

    CORS(
        app,
        resources={r"/*": {"origins": cors_origins, "supports_credentials": True}},
    )

    # Initialize rate limiter with config from env
    session_rate_limit = os.getenv("SESSION_RATE_LIMIT", "10/minute")
    limiter.default_limits = [session_rate_limit]

    # Handle Redis connection for rate limiter
    if app.config.get("ENV") == "development" or app.config.get("TESTING"):
        try:
            # Test Redis connection
            redis_client = redis.from_url(redis_url)
            redis_client.ping()
            logger.info("Redis connection successful, using Redis for rate limiting")
        except (redis.ConnectionError, redis.exceptions.ConnectionError):
            logger.warning("Redis unavailable, falling back to in-memory storage")
            limiter.storage_uri = "memory://"

    limiter.init_app(app)

    # Load configuration
    if test_config is None:
        # Load the instance config if it exists
        app.config.from_pyfile("config.py", silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)

    # Get API version and prefix from environment
    api_version = os.getenv("API_VERSION", "v1")
    api_prefix = os.getenv("API_PREFIX", "/api")
    versioned_prefix = f"{api_prefix}/{api_version}"

    # Skip middleware application when testing to avoid multiple registration issues
    skip_middleware = app.config.get("SKIP_MIDDLEWARE", False)

    if not skip_middleware:
        # Apply middleware to blueprints
        logger.info("Applying middleware to blueprints")
        apply_middleware_to_blueprint(session_bp)
        apply_middleware_to_blueprint(upload_bp)
    else:
        logger.info("Skipping middleware application due to SKIP_MIDDLEWARE flag")

    # Register blueprints 
    # Register with both legacy (empty prefix) and versioned prefixes
    app.register_blueprint(session_bp, url_prefix="")
    app.register_blueprint(upload_bp, url_prefix="")
    
    # Note: For versioned routes, we'll handle them within the blueprint routes
    # to avoid blueprint registration conflicts in tests

    # Set up session service for requests after blueprints are registered
    from backend.app.routes.session import setup_session_service
    app.before_request(setup_session_service)

    # Create instance directory if it doesn't exist
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Register error handlers
    from backend.app.errors import register_error_handlers

    register_error_handlers(app)

    # Set up request logging middleware
    setup_request_logging(app)

    # Set up request validation middleware
    setup_request_validation(app)

    # Set up authentication middleware
    setup_auth_middleware(app)

    # Add a general OPTIONS route to handle CORS preflight requests
    @app.route("/<path:path>", methods=["OPTIONS"])
    def options_handler(path):
        response = app.make_default_options_response()
        return response

    @app.after_request
    def after_request_func(response):
        """Add additional headers or process responses if needed"""
        # Add API version header
        response.headers["X-API-Version"] = api_version
        return response

    # Add API information endpoint
    @app.route("/api/info")
    def api_info():
        """Return API information."""
        return jsonify(
            {
                "name": "Maria AI Agent API",
                "version": api_version,
                "endpoints": {
                    "session": f"{versioned_prefix}/",
                    "upload": f"{versioned_prefix}/upload",
                    "legacy": "/",
                    "auth-info": "/api/auth-info",
                },
                "documentation": "/docs/api_endpoints.md",
            }
        )

    # Simple route for testing
    @app.route("/ping")
    def ping():
        return {"message": "pong"}

    # Create database tables if they don't exist
    from backend.app.database_core import Base, get_engine

    # Get engine lazily to allow test fixtures to override database URL
    engine = get_engine()
    Base.metadata.create_all(bind=engine)

    # Log successful app creation
    logger.info(f"Flask app created with API version {api_version}")

    return app


def register_error_handlers(app):
    """Register error handlers with the Flask application.

    Args:
        app: The Flask application instance
    """
    # Import and use the centralized error handlers
    from backend.app.errors import register_error_handlers as reg_errors

    reg_errors(app)

    # Add fallback error handlers if needed
    @app.errorhandler(404)
    def not_found(e):
        return {"error": "Resource not found"}, 404

    @app.errorhandler(500)
    def server_error(e):
        return {"error": "Server error"}, 500
