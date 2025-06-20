import os
from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import BotoCoreError, NoCredentialsError
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from flask_cors import CORS
import uuid
import psycopg2

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

def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False

def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv('POSTGRES_DB'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD'),
        host=os.getenv('POSTGRES_HOST', 'localhost'),
        port=os.getenv('POSTGRES_PORT', 5432)
    )

@app.route('/upload', methods=['POST'])
def upload_file():
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

@app.route('/persist_session', methods=['POST'])
def persist_session():
    data = request.get_json()
    session_uuid = data.get('session_uuid')
    name = data.get('name')
    email = data.get('email')
    if not session_uuid or not is_valid_uuid(session_uuid):
        return jsonify({'error': 'Invalid or missing session UUID', 'code': 'invalid session'}), 400
    # Check UUID uniqueness in DB
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) FROM user_sessions WHERE uuid = %s', (session_uuid,))
    count = cur.fetchone()[0]
    if count > 0:
        # UUID collision, generate new UUID and migrate S3 files
        new_uuid = str(uuid.uuid4())
        migrate_s3_files(session_uuid, new_uuid)
        session_uuid = new_uuid
        cur.close()
        conn.close()
        return jsonify({'new_uuid': new_uuid, 'message': 'UUID collision, new UUID assigned'}), 200
    # TODO: Check S3 folder match if needed
    # Insert session into DB
    cur.execute('INSERT INTO user_sessions (uuid, name, email) VALUES (%s, %s, %s)', (session_uuid, name, email))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': 'Session persisted', 'session_uuid': session_uuid}), 200

def migrate_s3_files(old_uuid, new_uuid):
    # List all files in old_uuid folder
    paginator = s3_client.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=S3_BUCKET_NAME, Prefix=f'uploads/{old_uuid}/'):
        for obj in page.get('Contents', []):
            old_key = obj['Key']
            filename = old_key.split(f'uploads/{old_uuid}/', 1)[-1]
            new_key = f'uploads/{new_uuid}/{filename}'
            s3_client.copy_object(Bucket=S3_BUCKET_NAME, CopySource={'Bucket': S3_BUCKET_NAME, 'Key': old_key}, Key=new_key)
            s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=old_key)

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
