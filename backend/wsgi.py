"""
WSGI entry point for the Maria AI Agent backend application.

This module creates and runs the Flask application using the
create_app factory function from the app module.
"""

from app import create_app

app = create_app()

if __name__ == "__main__":
    # Run the application in development mode when executed directly
    app.run(host="0.0.0.0", port=5000, debug=True)
