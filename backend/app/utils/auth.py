"""
Authentication middleware for Maria AI Agent backend.

This module provides authentication-related middleware and decorators.
"""

import functools
import logging
import os

from flask import current_app, g, jsonify, request

# Configure logger
logger = logging.getLogger(__name__)

# Get API keys from environment
API_KEYS = os.getenv("API_KEYS", "").split(",") if os.getenv("API_KEYS") else []
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").lower() == "true"


def require_api_key(f):
    """
    Decorator to require a valid API key for route access.

    Args:
        f: Function to wrap

    Returns:
        Wrapped function that checks for API key
    """

    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        # Check app config first, then fall back to module-level variable
        require_auth = current_app.config.get("REQUIRE_AUTH", REQUIRE_AUTH)
        
        # Skip auth if not required (for development)
        if not require_auth:
            g.authenticated = False
            return f(*args, **kwargs)

        # Check for API key in header or query param
        api_key = request.headers.get("X-API-Key") or request.args.get("api_key")

        if not api_key or api_key not in API_KEYS:
            return (
                jsonify({"error": "Unauthorized", "message": "Valid API key required"}),
                401,
            )

        # Set authenticated flag for other middleware/routes
        g.authenticated = True
        g.api_key = api_key

        return f(*args, **kwargs)

    return decorated_function


def setup_auth_middleware(app):
    """
    Set up authentication middleware for a Flask application.

    This adds functions to be run before and after requests to handle
    authentication-related tasks.

    Args:
        app: Flask application instance
    """

    @app.before_request
    def auth_before_request():
        """Set default authentication status."""
        g.authenticated = False

        # Skip auth checks for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return None

        # Skip auth for non-API paths if they don't start with /api/
        # This preserves backwards compatibility
        if not request.path.startswith("/api/"):
            return None

        # Check app config first, then fall back to module-level variable
        require_auth = app.config.get("REQUIRE_AUTH", REQUIRE_AUTH)
        
        # Skip auth if disabled
        if not require_auth:
            return None

        # Check for API key
        api_key = request.headers.get("X-API-Key") or request.args.get("api_key")

        if api_key and api_key in API_KEYS:
            g.authenticated = True
            g.api_key = api_key
            logger.info(f"Authenticated request: {request.method} {request.path}")
        else:
            logger.warning(f"Authentication failed: {request.method} {request.path}")
            return (
                jsonify({"error": "Unauthorized", "message": "Valid API key required"}),
                401,
            )

    # Add helper to get API auth documentation
    @app.route("/api/auth-info", methods=["GET"])
    def auth_info():
        """Return information about API authentication requirements."""
        # Check app config first, then fall back to module-level variable
        require_auth = app.config.get("REQUIRE_AUTH", REQUIRE_AUTH)
        
        response = jsonify(
            {
                "authentication_required": require_auth,
                "auth_type": "API Key",
                "header_name": "X-API-Key",
                "query_param": "api_key",
                "documentation": "Add your API key as either a header or query parameter",
            }
        )

        # Add correlation ID to response if available
        if hasattr(g, "correlation_id"):
            response.headers["X-Correlation-ID"] = g.correlation_id

        return response
