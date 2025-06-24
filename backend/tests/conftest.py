"""
Configuration file for pytest.
This file is automatically recognized by pytest and allows sharing fixtures and setup.
"""

import os
import sys

# Add the parent directory to the Python path to allow importing from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
