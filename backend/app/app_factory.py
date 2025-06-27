"""
Application factory for Maria AI Agent backend.

This module provides a function to create a Flask application instance
with all the necessary configuration and blueprint registrations.
"""

import os
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Import the blueprints
from backend.app.routes.session import session_bp
from backend.app.routes.upload import upload_bp

# Initialize rate limiter with remote address as the key function
limiter = Limiter(key_func=get_remote_address)

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
    
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    
    # Configure CORS for frontend access
    CORS(
        app,
        origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        supports_credentials=True,
    )
    
    # Initialize rate limiter with config from env
    session_rate_limit = os.getenv("SESSION_RATE_LIMIT", "10/minute")
    limiter.default_limits = [session_rate_limit]
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
    app.register_blueprint(upload_bp, url_prefix='/api/v1/upload')
    
    # Create instance directory if it doesn't exist
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    # Register error handlers
    from backend.app.errors import register_error_handlers
    register_error_handlers(app)
    
    # Create database tables if they don't exist
    from backend.app.database import Base, engine
    Base.metadata.create_all(bind=engine)
    
    # Simple route for testing
    @app.route('/ping')
    def ping():
        return {'message': 'pong'}
    
    return app


def register_error_handlers(app):
    """Register error handlers with the Flask application.
    
    Args:
        app: The Flask application instance
    """
    from backend.app.errors import register_error_handlers as reg_errors
    reg_errors(app)
    """Register error handlers with the Flask application."""
    # Add error handlers here
    @app.errorhandler(404)
    def not_found(e):
        return {'error': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def server_error(e):
        return {'error': 'Server error'}, 500
