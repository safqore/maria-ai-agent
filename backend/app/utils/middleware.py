"""
Middleware module for Maria AI Agent.

This module provides middleware functions for Flask request/response processing.
"""

import time
import logging
import uuid
import json
from flask import request, g, current_app, jsonify, Blueprint
from functools import wraps

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_request_id():
    """Generate a unique request ID."""
    return str(uuid.uuid4())

def extract_correlation_id():
    """
    Extract correlation ID from request headers.
    
    If the client provides a correlation ID, use it.
    Otherwise, generate a new one.
    
    Returns:
        str: The correlation ID for the request
    """
    # Check if client provided a correlation ID
    client_correlation_id = request.headers.get('X-Correlation-ID')
    
    if client_correlation_id:
        # Validate the format (assuming UUID format)
        try:
            uuid.UUID(client_correlation_id)
            return client_correlation_id
        except ValueError:
            logger.warning(f"Invalid correlation ID format: {client_correlation_id}")
    
    # Generate a new correlation ID if none provided or invalid
    return generate_request_id()

def log_request_middleware():
    """
    Middleware to log request information.
    
    This middleware logs the request method, path, status code, and time taken.
    It also adds a correlation ID to each request for tracing purposes.
    
    Returns:
        function: A function that can be used as before_request and after_request
    """
    def before_request():
        """Set up request context before handling a request."""
        # Add request start time to measure duration
        g.request_start_time = time.time()
        
        # Extract or generate correlation ID for request tracking
        g.correlation_id = extract_correlation_id()
        
        # Capture request information for logging
        request_info = {
            "method": request.method,
            "path": request.path,
            "correlation_id": g.correlation_id,
            "client_ip": request.remote_addr,
            "user_agent": request.headers.get('User-Agent', 'Unknown'),
            "content_type": request.headers.get('Content-Type', 'Unknown')
        }
        
        # Store request info for later logging
        g.request_info = request_info
        
        # Log request information
        logger.info(
            f"Request started: {request.method} {request.path} "
            f"| Correlation ID: {g.correlation_id} "
            f"| Client IP: {request.remote_addr}"
        )

    def after_request(response):
        """Process response after request handling."""
        # Calculate request duration
        duration = time.time() - g.get('request_start_time', time.time())
        duration_ms = round(duration * 1000, 2)
        
        # Get stored request info
        request_info = getattr(g, 'request_info', {})
        
        # Add response information
        response_info = {
            **request_info,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
            "response_size": len(response.get_data(as_text=True)) if hasattr(response, 'get_data') else 0
        }
        
        # Log more detailed response information based on status code
        if 400 <= response.status_code < 600:
            log_level = logging.WARNING if response.status_code < 500 else logging.ERROR
            logger.log(
                log_level,
                f"Request failed: {request.method} {request.path} "
                f"| Status: {response.status_code} "
                f"| Time: {duration_ms}ms "
                f"| Correlation ID: {g.get('correlation_id', 'unknown')}"
            )
        else:
            logger.info(
                f"Request completed: {request.method} {request.path} "
                f"| Status: {response.status_code} "
                f"| Time: {duration_ms}ms "
                f"| Correlation ID: {g.get('correlation_id', 'unknown')}"
            )
        
        # Add correlation ID to response headers
        response.headers['X-Correlation-ID'] = g.get('correlation_id', 'unknown')
        
        return response

    return before_request, after_request

def validate_json_middleware():
    """
    Middleware to validate JSON requests.
    
    This middleware checks if the request is a JSON request and validates that
    it can be parsed correctly.
    
    Returns:
        tuple: Functions for before_request
    """
    def before_request():
        """Validate JSON content before handling the request."""
        # Skip validation for non-JSON content types
        content_type = request.headers.get('Content-Type', '')
        if not content_type.startswith('application/json'):
            return None
            
        # Skip validation for GET, OPTIONS, HEAD requests
        if request.method in ['GET', 'OPTIONS', 'HEAD']:
            return None
            
        # Try to parse JSON content
        try:
            if request.data:
                _ = request.get_json()
        except Exception as e:
            logger.warning(f"Invalid JSON in request: {str(e)}")
            return jsonify({
                "error": "Invalid JSON format",
                "message": "The request body could not be parsed as JSON",
                "correlation_id": getattr(g, 'correlation_id', 'unknown')
            }), 400
    
    return before_request

def versioning_middleware(api_version):
    """
    Middleware to add API versioning information.
    
    This middleware adds the API version to the response headers and provides
    version-specific handling if needed.
    
    Args:
        api_version: The current API version (e.g., 'v1')
        
    Returns:
        function: A function that can be used as after_request
    """
    def after_request(response):
        """Add versioning information to response."""
        response.headers['X-API-Version'] = api_version
        return response
    
    return after_request

def error_handling_middleware(blueprint_name):
    """
    Middleware to provide consistent error handling for a blueprint.
    
    Args:
        blueprint_name: Name of the blueprint for logging purposes
        
    Returns:
        function: A function that can be used as error_handler
    """
    def error_handler(error):
        """Handle errors consistently."""
        status_code = getattr(error, 'code', 500)
        
        # Get error message
        if hasattr(error, 'description'):
            message = error.description
        else:
            message = str(error)
        
        # Log the error
        logger.error(
            f"Error in {blueprint_name}: {message} "
            f"| Status: {status_code} "
            f"| Path: {request.path} "
            f"| Correlation ID: {getattr(g, 'correlation_id', 'unknown')}"
        )
        
        # Return JSON response with error details
        return jsonify({
            "error": error.__class__.__name__,
            "message": message,
            "correlation_id": getattr(g, 'correlation_id', 'unknown')
        }), status_code
    
    return error_handler

def setup_request_logging(app):
    """
    Set up request logging for a Flask application.
    
    Args:
        app: Flask application object
    """
    before_request, after_request = log_request_middleware()
    
    # Add before_request handler for correlation ID extraction
    @app.before_request
    def extract_correlation_id_handler():
        g.correlation_id = extract_correlation_id()
    
    app.before_request(before_request)
    app.after_request(after_request)

def setup_request_validation(app):
    """
    Set up request validation for a Flask application.
    
    Args:
        app: Flask application object
    """
    before_request = validate_json_middleware()
    app.before_request(before_request)

def apply_middleware_to_blueprint(blueprint, api_version=None):
    """
    Apply middleware to a blueprint.
    
    This function applies standard middleware to a Flask blueprint,
    ensuring consistent behavior across all endpoints.
    
    Args:
        blueprint: The Flask blueprint to apply middleware to
        api_version: Optional API version for versioning middleware
    """
    # Add request logging
    before_request, after_request = log_request_middleware()
    blueprint.before_request(before_request)
    blueprint.after_request(after_request)
    
    # Add JSON validation
    blueprint.before_request(validate_json_middleware())
    
    # Add API versioning if version is provided
    if api_version:
        blueprint.after_request(versioning_middleware(api_version))
    
    # Add error handling
    error_handler = error_handling_middleware(blueprint.name)
    for err in [400, 401, 403, 404, 405, 429, 500]:
        blueprint.errorhandler(err)(error_handler)
    
    logger.info(f"Applied middleware to blueprint: {blueprint.name}")
    
    return blueprint
