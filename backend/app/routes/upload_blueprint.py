"""
Example file upload blueprint implementation for Maria AI Agent.

This file provides a blueprint template for migrating the upload routes
to a blueprint-based structure. Use this as a reference when implementing
the upload blueprint.
"""

import os
from flask import Blueprint, request, jsonify, g
from flask_cors import cross_origin
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from marshmallow import ValidationError

from backend.app.errors import api_route
from backend.app.schemas.upload_schemas import FileUploadSchema
from backend.app.services.upload_service import UploadService

# Create the upload blueprint
upload_bp = Blueprint("upload", __name__)

# Get rate limit from environment variable or default to 5/minute
UPLOAD_RATE_LIMIT = os.getenv("UPLOAD_RATE_LIMIT", "5/minute")

# Limiter will be initialized in app factory and attached to app
limiter = Limiter(key_func=get_remote_address, default_limits=[UPLOAD_RATE_LIMIT])

# Apply before_request to all routes in this blueprint
upload_bp.before_request(lambda: setattr(g, 'upload_service', UploadService()))

@upload_bp.route("/upload-file", methods=["POST"])
@cross_origin()
@limiter.limit(UPLOAD_RATE_LIMIT)
@api_route
def upload_file():
    """
    Upload a file to the server.
    
    ---
    tags:
      - Upload
    parameters:
      - name: file
        in: formData
        type: file
        required: true
        description: The file to upload
      - name: session_uuid
        in: formData
        type: string
        required: true
        description: The session UUID
    responses:
      200:
        description: File uploaded successfully
      400:
        description: Invalid request
      401:
        description: Unauthorized
    """
    # Example implementation - actual implementation will be different
    try:
        # Validate request data
        schema = FileUploadSchema()
        data = schema.load(request.form)
        
        # Process the upload
        result = g.upload_service.process_upload(
            request.files, data["session_uuid"]
        )
        
        return jsonify(result), 200
    except ValidationError as e:
        return jsonify({"error": str(e), "details": e.messages}), 400
