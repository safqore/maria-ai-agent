import os
from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import BotoCoreError, NoCredentialsError
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION')
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME')

ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_FILES = 3

app = Flask(__name__)

s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({'error': 'No files part in the request'}), 400
    files = request.files.getlist('files')
    if not files or len(files) == 0:
        return jsonify({'error': 'No files provided'}), 400
    if len(files) > MAX_FILES:
        return jsonify({'error': f'Maximum {MAX_FILES} files allowed per upload'}), 400

    uploaded_files = []
    for file in files:
        filename = secure_filename(file.filename)
        if not allowed_file(filename):
            return jsonify({'error': f'File {filename} is not a valid PDF'}), 400
        file.seek(0, os.SEEK_END)
        file_length = file.tell()
        file.seek(0)
        if file_length > MAX_FILE_SIZE:
            return jsonify({'error': f'File {filename} exceeds 5 MB size limit'}), 400
        try:
            s3_key = f"uploads/{filename}"
            s3_client.upload_fileobj(
                file,
                S3_BUCKET_NAME,
                s3_key,
                ExtraArgs={'ContentType': 'application/pdf'}
            )
            file_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
            uploaded_files.append({'filename': filename, 'url': file_url})
        except (BotoCoreError, NoCredentialsError) as e:
            return jsonify({'error': f'Failed to upload {filename}: {str(e)}'}), 500

    return jsonify({'files': uploaded_files}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
