"""
Error handling module for Maria AI Agent.

This module provides:
- Custom exception classes
- Error handler registration for Flask app
- API route decorator for consistent error handling
"""

import traceback
from functools import wraps
from typing import Any, Callable, Dict, Tuple, TypeVar, cast

from flask import Response, current_app, jsonify, request
from werkzeug.exceptions import (
    BadRequest,
    HTTPException,
    MethodNotAllowed,
    UnsupportedMediaType,
)

# Type variable for function return type
F = TypeVar("F", bound=Callable[..., Any])


class APIError(Exception):
    """Base exception for API errors with status code and payload."""

    def __init__(
        self, message: str, status_code: int = 400, details: Dict[str, Any] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class InvalidRequestError(APIError):
    """Exception for invalid request data."""

    def __init__(
        self, message: str = "Invalid request data", details: Dict[str, Any] = None
    ):
        super().__init__(message=message, status_code=400, details=details)


class InvalidSessionError(APIError):
    """Exception for invalid session UUID."""

    def __init__(
        self, message: str = "Invalid session UUID", details: Dict[str, Any] = None
    ):
        super().__init__(message=message, status_code=400, details=details)


class ResourceNotFoundError(APIError):
    """Exception for resource not found."""

    def __init__(
        self, message: str = "Resource not found", details: Dict[str, Any] = None
    ):
        super().__init__(message=message, status_code=404, details=details)


class UnauthorizedError(APIError):
    """Exception for unauthorized access."""

    def __init__(
        self, message: str = "Unauthorized access", details: Dict[str, Any] = None
    ):
        super().__init__(message=message, status_code=401, details=details)


class ServerError(APIError):
    """Exception for server errors."""

    def __init__(
        self, message: str = "Internal server error", details: Dict[str, Any] = None
    ):
        super().__init__(message=message, status_code=500, details=details)


def handle_api_error(error: APIError) -> Tuple[Response, int]:
    """
    Handle API errors by converting them to appropriate responses.

    Args:
        error: The API error to handle

    Returns:
        tuple: (response, status_code)
    """
    response = {"error": error.message, "status": "error", "details": error.details}
    resp = jsonify(response)
    # Add CORS headers to ensure preflight requests pass even on errors
    resp.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    resp.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    resp.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    resp.headers.add("Access-Control-Allow-Credentials", "true")
    return resp, error.status_code


def handle_http_error(error: HTTPException) -> Tuple[Response, int]:
    """
    Handle HTTP errors by converting them to appropriate responses.

    Args:
        error: The HTTP error to handle

    Returns:
        tuple: (response, status_code)
    """
    # Map specific HTTP exceptions to appropriate status codes
    if isinstance(error, UnsupportedMediaType):
        # Use proper 415 status code for unsupported media type
        status_code = 415
        message = "Invalid Content-Type. Expected application/json"
    elif isinstance(error, MethodNotAllowed):
        status_code = 405
        message = "Method not allowed"
    elif isinstance(error, BadRequest):
        status_code = 400
        message = "Bad request"
    else:
        # Use the original status code for other HTTP exceptions
        status_code = error.code
        message = error.description or str(error)

    response = {"error": message, "message": message, "status": "error", "details": {}}
    resp = jsonify(response)

    # Add Allow header for 405 Method Not Allowed responses
    if isinstance(error, MethodNotAllowed):
        # Get allowed methods from the error object if available
        allowed_methods = getattr(error, "valid_methods", None)
        if allowed_methods:
            resp.headers["Allow"] = ", ".join(sorted(allowed_methods))
        else:
            # Fallback to common methods for API endpoints
            resp.headers["Allow"] = "POST, OPTIONS"

    # Add CORS headers to ensure preflight requests pass even on errors
    resp.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    resp.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    resp.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    resp.headers.add("Access-Control-Allow-Credentials", "true")
    return resp, status_code


def handle_general_error(error: Exception) -> Tuple[Response, int]:
    """
    Handle general errors by converting them to 500 error responses.

    Args:
        error: The error to handle

    Returns:
        tuple: (response, status_code)
    """
    current_app.logger.error(f"Unhandled exception: {str(error)}")
    current_app.logger.error(traceback.format_exc())

    response = {
        "error": "Internal server error",
        "status": "error",
        "details": (
            {"message": str(error)} if current_app.config.get("DEBUG", False) else {}
        ),
    }
    resp = jsonify(response)
    # Add CORS headers to ensure preflight requests pass even on errors
    resp.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    resp.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    resp.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    resp.headers.add("Access-Control-Allow-Credentials", "true")
    return resp, 500


def register_error_handlers(app):
    """
    Register error handlers for the Flask app.

    Args:
        app: The Flask application
    """
    app.register_error_handler(APIError, handle_api_error)
    app.register_error_handler(HTTPException, handle_http_error)
    app.register_error_handler(Exception, handle_general_error)


def api_route(func: F) -> F:
    """
    Decorator for API routes that catches and converts exceptions to proper responses.

    Args:
        func: The route function to wrap

    Returns:
        The wrapped function
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        # Always allow OPTIONS requests to pass through without trying to parse JSON
        if request.method == "OPTIONS":
            return func(*args, **kwargs)

        try:
            return func(*args, **kwargs)
        except APIError as e:
            return handle_api_error(e)
        except HTTPException as e:
            return handle_http_error(e)
        except Exception as e:
            return handle_general_error(e)

    return cast(F, wrapper)
