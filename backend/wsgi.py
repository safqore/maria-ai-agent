"""
WSGI entry point for the Maria AI Agent backend application.
"""

import os
from app import create_app

app = create_app()

if __name__ == "__main__":
    # Get port from environment variable or use default 5000
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
