"""
WSGI entry point for the Maria AI Agent backend application.

This module creates and runs the Flask application using the
create_app factory function from the app module.
"""

import argparse
import os

from app import create_app

app = create_app()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run the Maria AI Agent backend Flask app."
    )
    parser.add_argument("--port", type=int, help="Port to run the server on")
    args = parser.parse_args()

    # Default back to 5000, but read from environment variable
    port = args.port or int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
