"""
Test Flask application for SQLAlchemy ORM testing.

This script creates a minimal Flask application to test the SQLAlchemy ORM
implementation in an appropriate environment.
"""

import os
import uuid
from flask import Flask, jsonify

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Set up SQLAlchemy in the app context
with app.app_context():
    # Import after app creation to avoid circular imports
    from backend.app.models import UserSession
    from backend.app.repositories.factory import get_user_session_repository
    from backend.app.database import Base, engine

    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Get repository instance
    user_repo = get_user_session_repository()


# Define routes for testing
@app.route('/test-orm', methods=['GET'])
def test_orm():
    """Test the SQLAlchemy ORM implementation."""
    results = []
    
    # Create a test session
    session_uuid = str(uuid.uuid4())
    results.append(f"Creating session with UUID: {session_uuid}")
    
    # Get repository instance
    user_repo = get_user_session_repository()
    
    try:
        # Create session
        user_session = user_repo.create_session(
            session_uuid=session_uuid,
            name="Test User",
            email="test@example.com",
            consent_user_data=True
        )
        results.append(f"Created session: {user_session}")
        results.append(f"Session dict: {user_session.to_dict()}")
        
        # Get session by UUID
        retrieved = user_repo.get_by_uuid(session_uuid)
        results.append(f"Retrieved session: {retrieved}")
        
        # Update session
        updated = user_repo.update_session(
            session_uuid,
            {"name": "Updated User", "email": "updated@example.com"}
        )
        results.append(f"Updated session: {updated.to_dict()}")
        
        # Delete session
        deleted = user_repo.delete_session(session_uuid)
        results.append(f"Deleted session: {deleted}")
        
        return jsonify({
            "success": True,
            "results": results
        })
    except Exception as e:
        # Clean up in case of error
        try:
            user_repo.delete_session(session_uuid)
        except Exception:
            pass
            
        return jsonify({
            "success": False,
            "error": str(e),
            "results": results
        })


if __name__ == '__main__':
    app.run(debug=True, port=5050)
