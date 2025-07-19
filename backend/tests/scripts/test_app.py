#!/usr/bin/env python3
"""
Simple test script to verify that the Flask application factory works correctly.
"""
import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(backend_dir))

# Now we can import from the app package
print("Importing modules...")
try:
    from app import create_app

    print("Successfully imported create_app")

    print("Creating Flask app...")
    app = create_app()
    print("App created successfully!")
except Exception as e:
    print(f"Error: {e}")
    import traceback

    traceback.print_exc()
    sys.exit(1)
