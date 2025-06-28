"""
Application factory for Maria AI Agent backend.

This module provides a function to create a Flask application instance
with all the necessary configuration and blueprint registrations.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Path constants
FRONTEND_ENV_PATH = Path(__file__).parent.parent.parent / "frontend" / ".env"

# Import the blueprints
from backend.app.routes.session import session_bp
from backend.app.routes.upload import upload_bp

# Initialize rate limiter with remote address as the key function
limiter = Limiter(key_func=get_remote_address)

def read_frontend_env_file() -> dict[str, str]:
    """Read frontend .env file and return as dictionary.
    
    Returns:
        dict[str, str]: Dictionary of environment variables from frontend .env
    """
    env_vars = {}
    try:
        with open(FRONTEND_ENV_PATH, 'r') as file:
            for line in file:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    except FileNotFoundError:
        pass
    
    return env_vars

def get_frontend_port() -> str:
    """Read frontend port from frontend/.env file.
    
    Returns:
        str: The frontend port number as a string
    """
    frontend_env = read_frontend_env_file()
    
    # First try to get PORT from frontend .env
    if 'PORT' in frontend_env:
        return frontend_env['PORT']
    
    # If PORT not found in frontend .env, use backend fallback
    frontend_port_fallback = os.getenv("FRONTEND_PORT_FALLBACK", "3000")
    return frontend_port_fallback

def get_cors_origins() -> list[str]:
    """Build CORS origins list from environment configuration.
    
    Returns:
        list[str]: List of allowed CORS origins
    """
    frontend_port = get_frontend_port()
    cors_hosts_env = os.getenv("CORS_HOSTS", "localhost,127.0.0.1")
    cors_hosts = [host.strip() for host in cors_hosts_env.split(",") if host.strip()]
    
    cors_origins_list = []
    for host in cors_hosts:
        cors_origins_list.append(f"http://{host}:{frontend_port}")
    
    return cors_origins_list

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
    from backend.app.database import init_database, get_engine, get_session_local
    import backend.app.database as database
    init_database()
    database.engine = get_engine()
    database.SessionLocal = get_session_local()
    
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
    limiter.init_app(app)
    
    # Load configuration
    if test_config is None:
        # Load the instance config if it exists
        app.config.from_pyfile('config.py', silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)
    
    # Register blueprints with proper URL prefixes
    app.register_blueprint(session_bp, url_prefix='')  # Keep root level for backward compatibility
    app.register_blueprint(upload_bp, url_prefix='')
    
    # Create instance directory if it doesn't exist
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    # Register error handlers
    from backend.app.errors import register_error_handlers
    register_error_handlers(app)
    
    # Add a general OPTIONS route to handle CORS preflight requests
    @app.route('/<path:path>', methods=['OPTIONS'])
    def options_handler(path):
        response = app.make_default_options_response()
        return response
    
    @app.after_request
    def after_request_func(response):
        """Add additional headers or process responses if needed"""
        return response
    
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
