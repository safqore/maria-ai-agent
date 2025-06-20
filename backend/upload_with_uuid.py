import os
import uuid
from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import BotoCoreError, NoCredentialsError
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from flask_cors import CORS

# ...existing code...

@app.route('/upload', methods=['POST'])
def upload_file():
    """
    Handle single PDF file upload to S3. Accepts multipart/form-data with 'file' and 'session_uuid' fields.
    Validates file type, size, and UUID, uploads to S3 under uploads/{uuid}/filename, and returns file URL or error.
    """
    session_uuid = request.form.get('session_uuid')
    if not session_uuid or not is_valid_uuid(session_uuid):
        return jsonify({'error': 'Invalid or missing session UUID', 'code': 'invalid session'}), 400
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    filename = secure_filename(file.filename)
    if not allowed_file(filename):
        return jsonify({'error': 'Unsupported file type. Only PDF files are allowed.'}), 400
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)
    if file_length > MAX_FILE_SIZE:
        return jsonify({'error': 'File too large. Maximum size is 5 MB.'}), 400
    try:
        s3_key = f"uploads/{session_uuid}/{filename}"
        s3_client.upload_fileobj(
            file,
            S3_BUCKET_NAME,
            s3_key,
            ExtraArgs={'ContentType': 'application/pdf'}
        )
        file_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        return jsonify({'filename': filename, 'url': file_url}), 200
    except (BotoCoreError, NoCredentialsError) as e:
        return jsonify({'error': f'Failed to upload {filename}: {str(e)}'}), 500

def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False
