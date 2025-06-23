from flask import Blueprint, request, jsonify
import uuid
from app.utils.s3_utils import migrate_s3_files
from app.db import get_db_connection
from app.utils.audit_utils import log_audit_event
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import cross_origin
import os

session_bp = Blueprint('session', __name__)

# Get rate limit from environment variable or default to 10/minute
SESSION_RATE_LIMIT = os.getenv('SESSION_RATE_LIMIT', '10/minute')

# Limiter will be initialized in app factory and attached to app
limiter = Limiter(key_func=get_remote_address, default_limits=[SESSION_RATE_LIMIT])

@session_bp.route('/validate-uuid', methods=['POST'])
@cross_origin()
@limiter.limit(SESSION_RATE_LIMIT)
def validate_uuid():
    data = request.get_json()
    session_uuid = data.get('uuid')
    if not session_uuid or not is_valid_uuid(session_uuid):
        log_audit_event('uuid_validation_failed', user_uuid=session_uuid, details={'reason': 'invalid format'})
        return jsonify({
            'status': 'invalid',
            'uuid': None,
            'message': 'Invalid or missing UUID',
            'details': {'reason': 'invalid format'}
        }), 400
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) FROM user_sessions WHERE uuid = %s', (session_uuid,))
    count = cur.fetchone()[0]
    cur.close()
    conn.close()
    if count > 0:
        log_audit_event('uuid_validation_collision', user_uuid=session_uuid, details={'reason': 'UUID already exists'})
        return jsonify({
            'status': 'collision',
            'uuid': session_uuid,
            'message': 'UUID already exists',
            'details': {'reason': 'UUID already exists'}
        }), 409
    log_audit_event('uuid_validation_success', user_uuid=session_uuid)
    return jsonify({
        'status': 'success',
        'uuid': session_uuid,
        'message': 'UUID is valid and unique',
        'details': {}
    }), 200

@session_bp.route('/generate-uuid', methods=['POST'])
@cross_origin()
@limiter.limit(SESSION_RATE_LIMIT)
def generate_uuid():
    attempts = 0
    max_attempts = 3
    new_uuid = None
    while attempts < max_attempts:
        candidate = str(uuid.uuid4())
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM user_sessions WHERE uuid = %s', (candidate,))
        count = cur.fetchone()[0]
        cur.close()
        conn.close()
        if count == 0:
            new_uuid = candidate
            break
        attempts += 1
    if new_uuid:
        log_audit_event('uuid_generation_success', user_uuid=new_uuid)
        return jsonify({
            'status': 'success',
            'uuid': new_uuid,
            'message': 'Generated unique UUID',
            'details': {}
        }), 200
    else:
        log_audit_event('uuid_generation_failed', details={'reason': 'Could not generate unique UUID after 3 attempts'})
        return jsonify({
            'status': 'error',
            'uuid': None,
            'message': 'Could not generate unique UUID',
            'details': {'reason': 'Could not generate unique UUID after 3 attempts'}
        }), 500

@session_bp.route('/persist_session', methods=['POST'])
def persist_session():
    """
    Persist a user session with name, email, and session_uuid.
    Checks UUID uniqueness in DB. If collision, generates new UUID and migrates files in S3.
    """
    data = request.get_json()
    session_uuid = data.get('session_uuid')
    name = data.get('name')
    email = data.get('email')
    if not session_uuid or not is_valid_uuid(session_uuid):
        return jsonify({'error': 'Invalid or missing session UUID', 'code': 'invalid session'}), 400
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) FROM user_sessions WHERE uuid = %s', (session_uuid,))
    count = cur.fetchone()[0]
    if count > 0:
        new_uuid = str(uuid.uuid4())
        migrate_s3_files(session_uuid, new_uuid)
        session_uuid = new_uuid
        cur.close()
        conn.close()
        return jsonify({'new_uuid': new_uuid, 'message': 'UUID collision, new UUID assigned'}), 200
    cur.execute('INSERT INTO user_sessions (uuid, name, email) VALUES (%s, %s, %s)', (session_uuid, name, email))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': 'Session persisted', 'session_uuid': session_uuid}), 200

def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False
