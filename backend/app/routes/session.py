"""
Session management endpoints for the Maria AI Agent application.

This module provides routes for:
- UUID validation and generation
- Session persistence
- User consent management
"""

import os
import functools

from app.errors import api_route
from app.schemas.session_schemas import SessionPersistSchema, UUIDSchema
from app.services.session_service import SessionService
from flask import Blueprint, jsonify, request, g
from flask_cors import cross_origin
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from marshmallow import ValidationError

# Create the session blueprint
session_bp = Blueprint("session", __name__)

# Get rate limit from environment variable or default to 10/minute
SESSION_RATE_LIMIT = os.getenv("SESSION_RATE_LIMIT", "10/minute")

# Limiter will be initialized in app factory and attached to app
limiter = Limiter(key_func=get_remote_address, default_limits=[SESSION_RATE_LIMIT])

# Create a service instance for each request
def with_session_service(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        g.session_service = SessionService()
        return f(*args, **kwargs)
    return wrapper

# Apply the with_session_service decorator to all route handlers in this blueprint
session_bp.before_request(lambda: setattr(g, 'session_service', SessionService()))


@session_bp.route("/validate-uuid", methods=["POST"])
@cross_origin()
@limiter.limit(SESSION_RATE_LIMIT)
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


@session_bp.route("/generate-uuid", methods=["POST"])
@cross_origin()
@limiter.limit(SESSION_RATE_LIMIT)
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
    response_data, status_code = g.session_service.generate_uuid()
    return jsonify(response_data), status_code


@session_bp.route("/persist_session", methods=["POST"])
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
