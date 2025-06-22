from flask import Blueprint, request, jsonify
import uuid
from app.utils.s3_utils import migrate_s3_files
from app.db import get_db_connection

session_bp = Blueprint('session', __name__)

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
