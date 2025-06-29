"""
Root level pytest configuration.
This file ensures that the project root is added to the Python path.
"""

import os
import sys

# Add the project root to the Python path to allow importing 'backend' as a top-level package
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
