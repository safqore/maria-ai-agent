from flask import render_template, request, jsonify
import boto3
import os
from botocore.exceptions import BotoCoreError, NoCredentialsError
from werkzeug.utils import secure_filename

def index():
    return render_template("index.html")

def upload_file_to_s3(file_obj, bucket_name, s3_key):
    """
    Uploads a file object to the specified S3 bucket.
    Returns the S3 file URL if successful, else raises an exception.
    """
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
        region_name=os.environ.get('AWS_REGION')
    )
    try:
        s3_client.upload_fileobj(file_obj, bucket_name, s3_key)
        file_url = f"https://{bucket_name}.s3.{os.environ.get('AWS_REGION')}.amazonaws.com/{s3_key}"
        return file_url
    except (BotoCoreError, NoCredentialsError) as e:
        raise Exception(f"S3 upload failed: {str(e)}")

def handle_file_upload(request):
    """
    Handles file upload from a Flask request and uploads to S3.
    Returns a dict with file metadata and S3 URL.
    """
    if 'file' not in request.files:
        return {"error": "No file part in the request."}, 400
    file = request.files['file']
    if file.filename == '':
        return {"error": "No selected file."}, 400
    if not file.filename.lower().endswith('.pdf'):
        return {"error": "Only PDF files are allowed."}, 400
    if file.content_length and file.content_length > 5 * 1024 * 1024:
        return {"error": "File size exceeds 5 MB limit."}, 400
    filename = secure_filename(file.filename)
    s3_key = f"uploads/{filename}"
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    if not bucket_name:
        return {"error": "S3_BUCKET_NAME not configured in environment."}, 500
    try:
        file_url = upload_file_to_s3(file, bucket_name, s3_key)
        return jsonify({"filename": filename, "url": file_url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500