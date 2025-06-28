"""
Middleware module for Maria AI Agent.

This module provides middleware functions for Flask request/response processing.
"""

import time
import logging
import uuid
from flask import request, g, current_app
from functools import wraps

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_request_id():
    """Generate a unique request ID."""
    return str(uuid.uuid4())

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
        
        # Generate correlation ID for request tracking
        g.correlation_id = generate_request_id()
        
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
        
        # Log response information
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

def setup_request_logging(app):
    """
    Set up request logging for a Flask application.
    
    Args:
        app: Flask application object
    """
    before_request, after_request = log_request_middleware()
    app.before_request(before_request)
    app.after_request(after_request)
