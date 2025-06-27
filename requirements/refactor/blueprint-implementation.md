# Flask Blueprint Implementation

This document outlines the implementation plan for organizing the Maria AI Agent backend using Flask Blueprints.

## Current Status (June 27, 2025)

The initial blueprint implementation has been started ahead of schedule. The `/session` routes have already been organized into a `session_bp` blueprint with rate limiting configured.

## Implementation Plan

### 1. Complete Route Migration

- [x] Create session blueprint (`session_bp`) ✅
- [ ] Create upload blueprint (`upload_bp`)
- [ ] Register all blueprints in the Flask application factory

Example structure:

```python
from flask import Flask

def create_app():
    app = Flask(__name__)
    
    # Register blueprints
    from app.routes.session import session_bp
    from app.routes.upload import upload_bp
    
    app.register_blueprint(session_bp, url_prefix='/api/v1/session')
    app.register_blueprint(upload_bp, url_prefix='/api/v1/upload')
    
    return app
```

### 2. API Versioning

Implement API versioning with URL prefixes to allow for future API changes without breaking existing clients:

```python
app.register_blueprint(session_bp, url_prefix='/api/v1/session')
```

This allows us to later add:

```python
app.register_blueprint(session_v2_bp, url_prefix='/api/v2/session')
```

### 3. Enhanced Route Documentation

Add consistent documentation to all routes:

```python
@blueprint.route("/endpoint", methods=["POST"])
@api_route
def endpoint():
    """
    Short description of the endpoint.
    
    ---
    tags:
      - Tag Name
    parameters:
      - name: body
        in: body
        schema:
          $ref: '#/definitions/Schema'
    responses:
      200:
        description: Success response
        schema:
          $ref: '#/definitions/SuccessResponse'
      400:
        description: Bad request
        schema:
          $ref: '#/definitions/ErrorResponse'
    """
    # Implementation
```

### 4. Blueprint-Specific Middleware

Add middleware that applies only to specific blueprints:

```python
def blueprint_middleware():
    # Blueprint-specific middleware logic
    pass

blueprint.before_request(blueprint_middleware)
```

### 5. Consistent Error Handling

Ensure error handling is consistent across all blueprints:

```python
@blueprint.errorhandler(SomeException)
def handle_exception(error):
    return jsonify({"error": str(error)}), 400
```

## Testing Strategy

1. Create tests for each blueprint to ensure all routes function correctly
2. Verify that URL prefixes work as expected
3. Test that middleware is applied correctly

## Timeline

1. Complete upload blueprint migration: July 2, 2025
2. Add API versioning: July 3, 2025
3. Enhance route documentation: July 5, 2025
4. Implement blueprint-specific middleware: July 7, 2025
5. Review and test: July 8-10, 2025
