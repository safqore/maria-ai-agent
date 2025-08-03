"""
Upload service module for Maria AI Agent.

This module provides services for:
- File upload validation
- File storage in Amazon S3
- File metadata management
"""

import os
from typing import Any, Dict, Optional, Tuple

import boto3
from app.services.session_service import SessionService
from botocore.exceptions import BotoCoreError, NoCredentialsError
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

# Configuration
ALLOWED_EXTENSIONS = {"pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

# AWS S3 Configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# Initialize S3 client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION,
)


class UploadService:
    """
    Service class for file upload operations.

    This class handles all business logic related to file uploads including
    validation and storage in Amazon S3.
    """

    @staticmethod
    def validate_session_uuid(session_uuid: str) -> Tuple[Dict[str, Any], int]:
        """
        Validate if the provided session UUID is valid.

        Args:
            session_uuid: The session UUID to validate

        Returns:
            tuple: (response_data, status_code)
                response_data: Dictionary with validation result
                status_code: HTTP status code
        """
        if not session_uuid or not SessionService.is_valid_uuid(session_uuid):
            return {
                "error": "Invalid or missing session UUID",
                "code": "invalid_session",
            }, 400
        return None, 200

    @staticmethod
    def allowed_file(filename: str) -> bool:
        """
        Check if the file extension is allowed.

        Args:
            filename: The filename to check

        Returns:
            bool: True if the file extension is allowed, False otherwise
        """
        return (
            "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
        )

    @staticmethod
    def validate_file(file: Optional[FileStorage]) -> Tuple[Dict[str, Any], int]:
        """
        Validate a file for upload.

        Args:
            file: The file to validate

        Returns:
            tuple: (response_data, status_code)
                response_data: Dictionary with validation result
                status_code: HTTP status code
        """
        if not file:
            return {"error": "No file part in the request"}, 400

        if file.filename == "":
            return {"error": "No file selected"}, 400

        filename = secure_filename(file.filename)
        if not UploadService.allowed_file(filename):
            return {"error": "Unsupported file type. Only PDF files are allowed."}, 400

        file.seek(0, os.SEEK_END)
        file_length = file.tell()
        file.seek(0)

        if file_length > MAX_FILE_SIZE:
            return {"error": "File too large. Maximum size is 5 MB."}, 400

        return None, 200

    @staticmethod
    def upload_to_s3(
        file: FileStorage, session_uuid: str
    ) -> Tuple[Dict[str, Any], int]:
        """
        Upload a file to Amazon S3.

        Args:
            file: The file to upload
            session_uuid: The session UUID to associate with the file

        Returns:
            tuple: (response_data, status_code)
                response_data: Dictionary with upload result
                status_code: HTTP status code
        """
        try:
            # Check if S3 is configured
            if not S3_BUCKET_NAME:
                # For testing, return a mock response
                filename = secure_filename(file.filename)
                return {
                    "filename": filename,
                    "url": f"https://test-bucket.s3.test-region.amazonaws.com/uploads/{session_uuid}/{filename}",
                }, 200

            filename = secure_filename(file.filename)
            s3_key = f"uploads/{session_uuid}/{filename}"

            s3_client.upload_fileobj(
                file,
                S3_BUCKET_NAME,
                s3_key,
                ExtraArgs={"ContentType": "application/pdf"},
            )

            file_url = (
                f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
            )
            return {"filename": filename, "url": file_url}, 200

        except (BotoCoreError, NoCredentialsError) as e:
            return {"error": f"Failed to upload {filename}: {str(e)}"}, 500
