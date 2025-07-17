"""
Email Verification API routes.

This module provides API endpoints for email verification functionality
including sending verification codes, verifying codes, and resending codes.
"""

from flask import Blueprint, jsonify, request
from flask_cors import cross_origin

from app.services.verification_service import VerificationService
from app.utils.auth import require_api_key
from app.errors import api_route

# Create blueprint
email_verification_bp = Blueprint('email_verification', __name__)

# Initialize service
verification_service = VerificationService()


@email_verification_bp.route('/api/v1/email-verification/verify-email', methods=['POST'])
@cross_origin()
@require_api_key
@api_route
def verify_email():
    """
    Send verification code to the provided email address.
    
    Request body:
        email: Email address to send verification code to
        
    Returns:
        JSON response with status and nextTransition
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'error': 'Request body is required',
                'nextTransition': 'EMAIL_INPUT'
            }), 400

        email = data.get('email')
        if not email:
            return jsonify({
                'status': 'error',
                'error': 'Email address is required',
                'nextTransition': 'EMAIL_INPUT'
            }), 400

        session_id = request.headers.get('X-Session-ID')
        if not session_id:
            return jsonify({
                'status': 'error',
                'error': 'Session ID is required',
                'nextTransition': 'SESSION_ERROR'
            }), 400

        # Call service
        result = verification_service.send_verification_code(session_id, email)
        
        if result['status'] == 'success':
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': 'An unexpected error occurred',
            'nextTransition': 'EMAIL_INPUT'
        }), 500


@email_verification_bp.route('/api/v1/email-verification/verify-code', methods=['POST'])
@cross_origin()
@require_api_key
@api_route
def verify_code():
    """
    Verify the provided verification code.
    
    Request body:
        code: 6-digit verification code
        
    Returns:
        JSON response with status and nextTransition
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'error': 'Request body is required',
                'nextTransition': 'CODE_INPUT'
            }), 400

        code = data.get('code')
        if not code:
            return jsonify({
                'status': 'error',
                'error': 'Verification code is required',
                'nextTransition': 'CODE_INPUT'
            }), 400

        # Validate code format
        if not code.isdigit() or len(code) != 6:
            return jsonify({
                'status': 'error',
                'error': 'Please enter a valid 6-digit verification code',
                'nextTransition': 'CODE_INPUT'
            }), 400

        session_id = request.headers.get('X-Session-ID')
        if not session_id:
            return jsonify({
                'status': 'error',
                'error': 'Session ID is required',
                'nextTransition': 'SESSION_ERROR'
            }), 400

        # Call service
        result = verification_service.verify_code(session_id, code)
        
        if result['status'] == 'success':
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': 'An unexpected error occurred',
            'nextTransition': 'CODE_INPUT'
        }), 500


@email_verification_bp.route('/api/v1/email-verification/resend-code', methods=['POST'])
@cross_origin()
@require_api_key
@api_route
def resend_code():
    """
    Resend verification code for the current session.
    
    Returns:
        JSON response with status and nextTransition
    """
    try:
        session_id = request.headers.get('X-Session-ID')
        if not session_id:
            return jsonify({
                'status': 'error',
                'error': 'Session ID is required',
                'nextTransition': 'SESSION_ERROR'
            }), 400

        # Call service
        result = verification_service.resend_code(session_id)
        
        if result['status'] == 'success':
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': 'An unexpected error occurred',
            'nextTransition': 'CODE_INPUT'
        }), 500 