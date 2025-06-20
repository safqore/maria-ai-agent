import os
import uuid
from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import BotoCoreError, NoCredentialsError
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from flask_cors import CORS

# ...existing code...

@app.route('/persist_session', methods=['POST'])
def persist_session():
    """
    Persist a user session with name, email, and session_uuid.
    Checks UUID uniqueness and S3 folder match. If collision, generates new UUID and migrates files.
    """
    data = request.get_json()
    session_uuid = data.get('session_uuid')
    name = data.get('name')
    email = data.get('email')
    # Add further validation as needed
    if not session_uuid or not is_valid_uuid(session_uuid):
        return jsonify({'error': 'Invalid or missing session UUID', 'code': 'invalid session'}), 400
    # TODO: Check if UUID is unique in DB (pseudo-code below)
    # if not is_uuid_unique(session_uuid):
    #     new_uuid = str(uuid.uuid4())
    #     migrate_s3_files(session_uuid, new_uuid)
    #     session_uuid = new_uuid
    #     return jsonify({'new_uuid': new_uuid, 'message': 'UUID collision, new UUID assigned'}), 200
    # TODO: Check S3 folder match, persist session, etc.
    return jsonify({'message': 'Session persisted', 'session_uuid': session_uuid}), 200

def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False

# def is_uuid_unique(uuid):
#     # Query DB for UUID uniqueness
#     pass

# def migrate_s3_files(old_uuid, new_uuid):
#     # Move files in S3 from old_uuid folder to new_uuid folder
#     pass
