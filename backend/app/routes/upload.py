"""
File upload endpoints for the Maria AI Agent application.

This module provides routes for:
- Uploading files associated with a user session
- Storing files in Amazon S3
- Validating file types and sizes
"""

from app.errors import api_route
from app.schemas.upload_schemas import UploadSchema
from app.services.upload_service import UploadService
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from marshmallow import ValidationError

upload_bp = Blueprint("upload", __name__)


@upload_bp.route("/upload", methods=["POST", "OPTIONS"])
@cross_origin()
@api_route
def upload_file():
    """
    Upload a file associated with a user session.

    This endpoint validates the file and session UUID, then uploads
    the file to Amazon S3.

    Request form data:
    - session_uuid: The session UUID
    - file: The file to upload

    Returns:
        JSON response with:
        - filename: The name of the uploaded file
        - url: The URL of the uploaded file

        HTTP status codes:
        - 200: Successfully uploaded file
        - 400: Invalid request data
        - 500: Failed to upload file
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

    # Validate session UUID using service
    error_response, status_code = UploadService.validate_session_uuid(session_uuid)
    if error_response:
        return jsonify(error_response), status_code

    # Validate file
    file = request.files.get("file")
    error_response, status_code = UploadService.validate_file(file)
    if error_response:
        return jsonify(error_response), status_code

    # Upload file to S3
    response_data, status_code = UploadService.upload_to_s3(file, session_uuid)
    return jsonify(response_data), status_code
