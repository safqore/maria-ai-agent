# Current Tasks (June 27, 2025)

This document outlines the immediate next steps for the Maria AI Agent refactoring project, focusing on Phase 4 Backend Improvements.

## Priority Tasks

### 1. Update Repository Pattern to Handle Sessions

**Status**: In Progress
**Priority**: High
**Target Date**: June 28, 2025

#### Tasks:

1. ✅ Created standalone TransactionContext implementation with proper transaction handling
2. ✅ Tested TransactionContext with working example
3. ✅ Documented transaction context implementation and usage patterns
4. Integrate TransactionContext with BaseRepository (avoiding circular imports)
5. Update related service classes to use the repository pattern consistently
6. Add integration tests for the repository pattern

### 2. Complete Upload Blueprint Implementation

**Status**: In Progress
**Priority**: High
**Target Date**: June 29, 2025

#### Tasks:

1. Convert the current `upload.py` routes to use the blueprint pattern from `upload_blueprint.py`
   - Merge functionality from both files into a single file
   - Ensure all routes use proper decorators (cross_origin, api_route, rate limits)
   - Add comprehensive docstrings with OpenAPI-style documentation

2. Update upload service to work with the repository pattern
   - Update `validate_session_uuid` method to use UserSessionRepository
   - Ensure proper error handling and service initialization

#### Implementation Plan:

```python
# In app/routes/upload.py - Complete blueprint implementation
"""
File upload endpoints for the Maria AI Agent application.

This module provides routes for:
- Uploading files associated with a user session
- Storing files in Amazon S3
- Validating file types and sizes
"""

import os
from flask import Blueprint, request, jsonify, g
from flask_cors import cross_origin
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from marshmallow import ValidationError

from app.errors import api_route
from app.schemas.upload_schemas import FileUploadSchema, UploadSchema
from app.services.upload_service import UploadService

# Create the upload blueprint
upload_bp = Blueprint("upload", __name__)

# Get rate limit from environment variable or default to 5/minute
UPLOAD_RATE_LIMIT = os.getenv("UPLOAD_RATE_LIMIT", "5/minute")

# Limiter will be initialized in app factory and attached to app
limiter = Limiter(key_func=get_remote_address, default_limits=[UPLOAD_RATE_LIMIT])

# Apply before_request to all routes in this blueprint
upload_bp.before_request(lambda: setattr(g, 'upload_service', UploadService()))

@upload_bp.route("/upload", methods=["POST", "OPTIONS"])
@cross_origin()
@limiter.limit(UPLOAD_RATE_LIMIT)
@api_route
def upload_file():
    """
    Upload a file associated with a user session.
    
    ---
    tags:
      - Upload
    parameters:
      - name: file
        in: formData
        type: file
        required: true
        description: The file to upload
      - name: session_uuid
        in: formData
        type: string
        required: true
        description: The session UUID
    responses:
      200:
        description: File uploaded successfully
      400:
        description: Invalid request data
      401:
        description: Unauthorized
    """
    if request.method == "OPTIONS":
        return ("", 200)

    # Validate session UUID
    session_uuid = request.form.get("session_uuid")

    # Validate request data using schema
    try:
        schema = UploadSchema()
        schema.load({"session_uuid": session_uuid})
    except ValidationError as err:
        return jsonify({"error": "Invalid request data", "details": err.messages}), 400

    # Use the service from the flask g object
    error_response, status_code = g.upload_service.validate_session_uuid(session_uuid)
    if error_response:
        return jsonify(error_response), status_code

    # Validate file
    file = request.files.get("file")
    error_response, status_code = g.upload_service.validate_file(file)
    if error_response:
        return jsonify(error_response), status_code

    # Upload file to S3
    response_data, status_code = g.upload_service.upload_to_s3(file, session_uuid)
    return jsonify(response_data), status_code
```

### 2. Consolidate Application Factory

**Status**: Completed ✅
**Priority**: High
**Completed Date**: June 27, 2025

#### Tasks:

1. ✅ Reviewed both `app/__init__.py` and `app/app_factory.py` to determine the differences
2. ✅ Chose `app_factory.py` as the primary application factory
3. ✅ Updated `app/__init__.py` to import from `app_factory`
4. ✅ Fixed import path consistency issues (changed from relative `app.` imports to absolute `backend.app.` imports)
5. ✅ Verified application creation with test script

#### Implementation Plan:

```python
# In app/__init__.py - Updated to use app_factory
"""
Main application factory for the Maria AI Agent backend.

This module provides the entry point for the Flask application by importing
and using the application factory from app_factory.py.
"""

from app.app_factory import create_app

__all__ = ["create_app"]
```

```python
# In app/app_factory.py (already mostly implemented)
# Just ensure blueprints are registered with proper URL prefixes
```

### 3. Add API Versioning to All Endpoints

**Status**: Completed ✅
**Priority**: Medium
**Completion Date**: June 27, 2025

#### Tasks:

1. Ensure all blueprints are registered with proper API version prefixes
2. Update any direct route references in frontend code
3. Add documentation about API versioning strategy

#### Implementation Plan:

```python
# In app_factory.py
# Register blueprints with API versioning
app.register_blueprint(session_bp, url_prefix='/api/v1/session')
app.register_blueprint(upload_bp, url_prefix='/api/v1/upload')
```

### 4. Update Tests for Blueprint Structure

**Status**: Not Started
**Priority**: Medium
**Target Date**: July 1, 2025

#### Tasks:

1. Update session and upload tests to work with the blueprint structure
2. Add tests for API versioning
3. Ensure all existing tests pass with the new structure

## Testing Plan

1. Manual testing of each endpoint with the new structure
2. Run existing tests and update as needed
3. Add new tests for blueprint-specific functionality

## Validation Checklist

- [ ] All routes are properly organized into blueprints
- [x] Application uses a single application factory
- [x] All endpoints are accessible via API versioning prefixes
- [x] Rate limiting is properly applied to all endpoints
- [x] Documentation is updated to reflect the new structure
- [x] TransactionContext works as expected in standalone tests
- [ ] All tests pass with the new structure
