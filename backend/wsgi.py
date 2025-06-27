"""
WSGI entry point for the Maria AI Agent backend application.
"""

import os
import sys
from pathlib import Path

# Add the project root directory to the Python path
project_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(project_dir))

# Now use absolute imports consistent with the rest of the codebase
from backend.app.app_factory import create_app

app = create_app()

if __name__ == "__main__":
    # Get port from environment variable or use default 5000
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
