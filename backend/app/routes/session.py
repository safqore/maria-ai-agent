"""
Session management endpoints for the Maria AI Agent application.

This module provides routes for:
- UUID validation and generation
- Session persistence
- User consent management
- API information
"""

import functools
import os

from flask import Blueprint, g, jsonify, request, current_app
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from marshmallow import ValidationError

from app.errors import api_route
from app.schemas.session_schemas import SessionPersistSchema, UUIDSchema
from app.services.session_service import SessionService

# Create the session blueprint
session_bp = Blueprint("session", __name__)

# Get rate limit from environment variable or default to 10/minute
SESSION_RATE_LIMIT = os.getenv("SESSION_RATE_LIMIT", "10/minute")

# Create limiter instance that will be initialized by app factory
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[SESSION_RATE_LIMIT],
    storage_uri="memory://",  # Use in-memory storage for tests
    # Note: enabled status will be set during init_app() based on app config
)


def is_rate_limiting_enabled():
    """Check if rate limiting is enabled in config."""
    # Check app config first, then default to enabled unless in testing
    ratelimit_enabled = current_app.config.get("RATELIMIT_ENABLED")

    if ratelimit_enabled is not None:
        return ratelimit_enabled

    # Default: disable in test mode, enable in production
    return not current_app.config.get("TESTING", False)


def cors_options_response():
    """Return a response with proper CORS headers for OPTIONS requests."""
    response = jsonify({"status": "success"})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add(
        "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"
    )
    response.headers.add(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-API-Key, X-Correlation-ID",
    )
    response.headers.add(
        "Access-Control-Expose-Headers", "X-API-Version, X-Correlation-ID"
    )
    return response, 200


# Create a service instance for each request
def with_session_service(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        g.session_service = SessionService()
        return f(*args, **kwargs)

    return wrapper


def setup_session_service():
    """Set up session service for requests. Called by app factory."""
    g.session_service = SessionService()


@session_bp.route("/info", methods=["GET"])
@api_route
def api_info():
    """
    Get API information.

    This endpoint provides information about the API including version,
    name, and available endpoints.

    Returns:
        JSON response with:
        - name: API name
        - version: API version
        - endpoints: List of available endpoints
    """
    return (
        jsonify(
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
        ),
        200,
    )


def conditional_rate_limit(rate_limit_string):
    """
    Decorator that conditionally applies rate limiting based on config.

    Args:
        rate_limit_string: The rate limit string (e.g., "10/minute")

    Returns:
        Decorator that applies rate limiting only if enabled
    """

    def decorator(f):
        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            # Check if rate limiting is enabled
            if not is_rate_limiting_enabled():
                # Rate limiting is disabled, call function directly
                return f(*args, **kwargs)

            # Check if this is an OPTIONS request (always allow)
            if request.method == "OPTIONS":
                return f(*args, **kwargs)

            # Apply rate limiting using Flask-Limiter
            # Create a temporary view function with limiter applied
            try:
                limited_func = limiter.limit(rate_limit_string)(f)
                return limited_func(*args, **kwargs)
            except Exception as e:
                # If rate limiting fails, log and continue without rate limiting
                current_app.logger.warning(f"Rate limiting error: {e}")
                return f(*args, **kwargs)

        return wrapper

    return decorator


@session_bp.route("/validate-uuid", methods=["POST", "OPTIONS"])
@conditional_rate_limit(SESSION_RATE_LIMIT)
@api_route
def validate_uuid():
    """
    Validate a session UUID.

    This endpoint validates the format of a UUID and checks if it exists
    in the database.

    Request JSON:
    - uuid: String containing the UUID to validate

    Returns:
        JSON response with:
        - status: 'success', 'invalid', or 'collision'
        - uuid: The validated UUID or None if invalid
        - message: Description of the validation result
        - details: Additional information about the validation result

        HTTP status codes:
        - 200: Successful validation
        - 400: Invalid UUID format
        - 409: UUID already exists in the database
    """
    # Handle OPTIONS requests separately
    if request.method == "OPTIONS":
        return cors_options_response()

    data = request.get_json()

    # Validate request data
    try:
        schema = UUIDSchema()
        validated_data = schema.load(data)
    except ValidationError as err:
        return (
            jsonify(
                {
                    "status": "invalid",
                    "uuid": None,
                    "message": "Invalid UUID format",
                    "details": err.messages,
                }
            ),
            400,
        )

    session_uuid = validated_data["uuid"]
    response_data, status_code = g.session_service.validate_uuid(session_uuid)
    return jsonify(response_data), status_code


@session_bp.route("/generate-uuid", methods=["POST", "OPTIONS"])
@conditional_rate_limit(SESSION_RATE_LIMIT)
@api_route
def generate_uuid():
    """
    Generate a unique UUID.

    This endpoint attempts to generate a unique UUID that doesn't exist in the database.

    Returns:
        JSON response with:
        - status: 'success' or 'error'
        - uuid: The generated UUID or None if generation failed
        - message: Description of the generation result
        - details: Additional information about the generation result

        HTTP status codes:
        - 200: Successfully generated UUID
        - 500: Failed to generate unique UUID after multiple attempts
    """
    # Handle OPTIONS requests separately
    if request.method == "OPTIONS":
        return cors_options_response()

    response_data, status_code = g.session_service.generate_uuid()
    return jsonify(response_data), status_code


@session_bp.route("/persist_session", methods=["POST", "OPTIONS"])
@api_route
def persist_session():
    """
    Persist a user session with name, email, and session_uuid.

    This endpoint checks UUID uniqueness in the database. If there is a collision,
    it generates a new UUID and migrates files in S3.

    Request JSON:
    - session_uuid: The session UUID
    - name: The user's name
    - email: The user's email

    Returns:
        JSON response with:
        - message: Description of the persistence result
        - session_uuid: The session UUID (or new_uuid if generated)

        HTTP status codes:
        - 200: Successfully persisted or assigned new UUID
        - 400: Invalid UUID format
    """
    # Handle OPTIONS requests separately
    if request.method == "OPTIONS":
        return cors_options_response()

    data = request.get_json()

    # Validate request data
    try:
        schema = SessionPersistSchema()
        validated_data = schema.load(data)
    except ValidationError as err:
        return jsonify({"error": "Invalid request data", "details": err.messages}), 400

    session_uuid = validated_data["session_uuid"]
    name = validated_data.get("name", "")
    email = validated_data.get("email", "")

    response_data, status_code = g.session_service.persist_session(
        session_uuid, name, email
    )
    return jsonify(response_data), status_code


# is_valid_uuid moved to SessionService
