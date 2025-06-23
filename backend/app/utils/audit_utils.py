import datetime
import json
import os

def log_audit_event(event_type, user_uuid=None, details=None):
    """
    Log an audit event with timestamp, event type, user UUID, and details.
    This is a simple file-based logger for demonstration. Replace with DB or external logging as needed.
    """
    log_entry = {
        "timestamp": datetime.datetime.utcnow().isoformat() + 'Z',
        "event_type": event_type,
        "user_uuid": user_uuid,
        "details": details or {}
    }
    log_dir = os.path.join(os.path.dirname(__file__), '../../logs')
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, 'audit.log')
    with open(log_file, 'a') as f:
        f.write(json.dumps(log_entry) + '\n')
