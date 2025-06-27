"""
Application factory for Maria AI Agent backend.

This module provides a function to create a Flask application instance
with all the necessary configuration and blueprint registrations.
"""

import os
from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from app.routes.session import session_bp
# Import the upload blueprint after it's created
# from app.routes.upload import upload_bp


def create_app(test_config=None):
    """
    Create and configure the Flask application.
    
    Args:
        test_config: Configuration dictionary for testing
        
    Returns:
        A configured Flask application instance
    """
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    
    # Configure CORS
    CORS(app, supports_credentials=True)
    
    # Configure rate limiting
    limiter = Limiter(key_func=get_remote_address)
    limiter.init_app(app)
    
    # Load configuration
    if test_config is None:
        # Load the instance config if it exists
        app.config.from_pyfile('config.py', silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)
    
    # Register blueprints with API versioning
    app.register_blueprint(session_bp, url_prefix='/api/v1/session')
    # Register upload blueprint when it's ready
    # app.register_blueprint(upload_bp, url_prefix='/api/v1/upload')
    
    # Create instance directory if it doesn't exist
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    # Register error handlers
    register_error_handlers(app)
    
    # Simple route for testing
    @app.route('/ping')
    def ping():
        return {'message': 'pong'}
    
    return app


def register_error_handlers(app):
    """Register error handlers with the Flask application."""
    # Add error handlers here
    @app.errorhandler(404)
    def not_found(e):
        return {'error': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def server_error(e):
        return {'error': 'Server error'}, 500
