"""
File upload endpoints for the Maria AI Agent application.

This module provides routes for:
- Uploading files associated with a user session
- Storing files in Amazon S3
- Validating file types and sizes
"""

import os

from app.errors import api_route
from app.schemas.upload_schemas import UploadSchema
from app.services.upload_service import UploadService
from flask import Blueprint, g, jsonify, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from marshmallow import ValidationError

# Create the upload blueprint
upload_bp = Blueprint("upload", __name__)

# Get rate limit from environment variable or default to 5/minute
UPLOAD_RATE_LIMIT = os.getenv("UPLOAD_RATE_LIMIT", "5/minute")

# Limiter will be initialized in app factory and attached to app
limiter = Limiter(key_func=get_remote_address, default_limits=None)

# Apply before_request to all routes in this blueprint
upload_bp.before_request(lambda: setattr(g, "upload_service", UploadService()))


@upload_bp.route("/upload", methods=["POST", "OPTIONS"])
@limiter.limit(UPLOAD_RATE_LIMIT)
@api_route
def upload_file():
    """
    Upload a file associated with a user session.

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
        schema:
          properties:
            filename:
              type: string
              description: The name of the uploaded file
            url:
              type: string
              description: The URL of the uploaded file
      400:
        description: Invalid request data
      401:
        description: Unauthorized
    """
    if request.method == "OPTIONS":
        return ("", 200)

    # Validate session UUID
    session_uuid = request.form.get("session_uuid")

    # Validate request data using schema
    try:
        schema = UploadSchema()
        schema.load({"session_uuid": session_uuid})
    except ValidationError as err:
        return jsonify({"error": "Invalid request data", "details": err.messages}), 400

    # Use the service from the flask g object
    error_response, status_code = g.upload_service.validate_session_uuid(session_uuid)
    if error_response:
        return jsonify(error_response), status_code

    # Validate file
    file = request.files.get("file")
    error_response, status_code = g.upload_service.validate_file(file)
    if error_response:
        return jsonify(error_response), status_code

    # Upload file to S3
    response_data, status_code = g.upload_service.upload_to_s3(file, session_uuid)
    return jsonify(response_data), status_code
