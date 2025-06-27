"""
Main application factory for the Maria AI Agent backend.

This module provides the entry point for the Flask application by importing
and using the application factory from app_factory.py.
"""

from backend.app.app_factory import create_app

__all__ = ["create_app"]
