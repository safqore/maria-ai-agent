"""
File upload endpoints for the Maria AI Agent application.

This module provides routes for:
- Uploading files associated with a user session
- Storing files in Amazon S3
- Validating file types and sizes
"""

import os
import uuid

import boto3
from botocore.exceptions import BotoCoreError, NoCredentialsError
from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {"pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION,
)

upload_bp = Blueprint("upload", __name__)


@upload_bp.route("/upload", methods=["POST", "OPTIONS"])
def upload_file():
    if request.method == "OPTIONS":
        return ("", 200)
    session_uuid = request.form.get("session_uuid")
    if not session_uuid or not is_valid_uuid(session_uuid):
        return (
            jsonify(
                {"error": "Invalid or missing session UUID", "code": "invalid session"}
            ),
            400,
        )
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    filename = secure_filename(file.filename)
    if not allowed_file(filename):
        return (
            jsonify({"error": "Unsupported file type. Only PDF files are allowed."}),
            400,
        )
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)
    if file_length > MAX_FILE_SIZE:
        return jsonify({"error": "File too large. Maximum size is 5 MB."}), 400
    try:
        s3_key = f"uploads/{session_uuid}/{filename}"
        s3_client.upload_fileobj(
            file, S3_BUCKET_NAME, s3_key, ExtraArgs={"ContentType": "application/pdf"}
        )
        file_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        return jsonify({"filename": filename, "url": file_url}), 200
    except (BotoCoreError, NoCredentialsError) as e:
        return jsonify({"error": f"Failed to upload {filename}: {str(e)}"}), 500


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def is_valid_uuid(val):
    """
    Validate if a string is a valid UUID.

    Args:
        val: The value to validate, will be converted to string

    Returns:
        bool: True if the value is a valid UUID, False otherwise
    """
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False
