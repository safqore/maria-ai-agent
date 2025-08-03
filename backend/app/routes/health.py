"""
Health check endpoint for Fly.io monitoring.
"""

from flask import Blueprint, jsonify
from app.config import Config

health_bp = Blueprint('health', __name__)

@health_bp.route('/api/v1/health')
def health_check():
    """
    Health check endpoint for container orchestration.
    
    Returns:
        JSON response with application status
    """
    return jsonify({
        "status": "healthy",
        "environment": Config.ENVIRONMENT,
        "database": "connected" if Config.get_database_url() else "disconnected",
        "version": "1.0.0"
    }) 