import os
from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import BotoCoreError, NoCredentialsError
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION')
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME')

ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    """
    Handle single PDF file upload to S3. Accepts multipart/form-data with 'file' field.
    Validates file type and size, uploads to S3, and returns file URL or error.
    """
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
        s3_key = f"uploads/{filename}"
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

@app.route('/delete', methods=['POST'])
def delete_file():
    """
    Delete a file from S3. Expects JSON body with 'filename' field.
    """
    data = request.get_json()
    filename = data.get('filename')
    if not filename:
        return jsonify({'error': 'Filename is required.'}), 400
    s3_key = f"uploads/{secure_filename(filename)}"
    try:
        s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
        return jsonify({'message': f'{filename} deleted successfully.'}), 200
    except (BotoCoreError, NoCredentialsError) as e:
        return jsonify({'error': f'Failed to delete {filename}: {str(e)}'}), 500

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Run Flask app with custom port.')
    parser.add_argument('--port', type=int, default=5000, help='Port to run the Flask app on')
    args = parser.parse_args()
    app.run(host='0.0.0.0', port=args.port, debug=True)
