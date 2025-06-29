"""
Configuration file for backend tests.
This file is automatically recognized by pytest and allows sharing fixtures and setup.
"""

import os
import sys
import pytest
from flask import Flask

# Ensure we can import from backend.app
# This adds the project root to sys.path if it's not already there
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

@pytest.fixture
def test_app(request):
    """
    Create a test-specific Flask app with minimal configuration.
    
    This can be used when you need more control over the app creation
    process than the standard create_app function provides.
    """
    app = Flask("test_app")
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["REQUIRE_AUTH"] = False  # Disable auth for testing
    
    # Set the database URL to use SQLite in-memory database for testing
    try:
        # Patch the get_database_url function to return SQLite URL
        import backend.app.database
        original_get_database_url = backend.app.database.get_database_url
        backend.app.database.get_database_url = lambda: "sqlite:///:memory:"
        
        # Keep track of the original function to restore later
        app.original_get_database_url = original_get_database_url
    except ImportError:
        # If database module is not imported yet, that's okay
        pass
    
    yield app
    
    # Clean up - restore the original get_database_url function if it was patched
    if hasattr(app, 'original_get_database_url'):
        import backend.app.database
        backend.app.database.get_database_url = app.original_get_database_url
