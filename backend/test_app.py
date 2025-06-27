"""
Simple debug script to test if the Flask application factory works correctly.
"""

import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app import create_app

app = create_app()
print('App created successfully!')
