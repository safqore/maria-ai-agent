"""
Main application factory for the Maria AI Agent backend.

This module initializes the Flask application, sets up configuration,
registers blueprints, and configures middleware like CORS and rate limiting.
"""

import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Initialize rate limiter with remote address as the key function
limiter = Limiter(key_func=get_remote_address)


def create_app():
    """
    Application factory function that creates and configures the Flask app.

    Returns:
        Flask: The configured Flask application instance
    """
    # Load environment variables from .env file
    load_dotenv(
        dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    )

    # Create Flask app
    app = Flask(__name__)

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

    # Register blueprints
    from app.routes.session import session_bp
    from app.routes.upload import upload_bp

    app.register_blueprint(session_bp)
    app.register_blueprint(upload_bp)
    # Add other blueprints as needed

    return app
