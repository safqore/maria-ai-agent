# API Endpoints Documentation

This document provides documentation for all API endpoints in the Maria AI Agent backend.

## API Versioning

The API uses URL prefixes for versioning. All endpoints are available at:
- Legacy (no prefix): `/endpoint`
- Versioned: `/api/v1/endpoint`

## Request and Response Headers

### Correlation ID

All requests can include a `X-Correlation-ID` header with a UUID value to track requests across systems. If not provided, the server will generate one.

Example:
```
X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
```

All responses will include the `X-Correlation-ID` header with either the client-provided value or the server-generated value.

### API Version

All responses include an `X-API-Version` header indicating the current API version:

```
X-API-Version: v1
```

## Authentication

API endpoints under the `/api/` prefix may require authentication using an API key.

Authentication method: API Key
- Header: `X-API-Key: your-api-key-here`
- Query parameter: `?api_key=your-api-key-here`

### Authentication Information Endpoint

- **URL**: `/api/auth-info`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "authentication_required": true,
    "auth_type": "API Key",
    "header_name": "X-API-Key",
    "query_param": "api_key",
    "documentation": "Add your API key as either a header or query parameter"
  }
  ```

## API Information Endpoint

- **URL**: `/api/info`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "name": "Maria AI Agent API",
    "version": "v1",
    "endpoints": {
      "session": "/api/v1/",
      "upload": "/api/v1/upload",
      "legacy": "/"
    },
    "documentation": "/docs/api_endpoints.md"
  }
  ```

## Session Endpoints

### Generate UUID

- **URL**: `/generate-uuid` or `/api/v1/generate-uuid`
- **Method**: `POST`
- **Rate Limit**: Configured via `SESSION_RATE_LIMIT` environment variable
- **Request Body**: None required
- **Response**:
  ```json
  {
    "uuid": "generated-uuid-string"
  }
  ```
- **Error Responses**:
  - 500 Internal Server Error: If UUID generation fails

### Validate UUID

- **URL**: `/validate-uuid` or `/api/v1/validate-uuid`
- **Method**: `POST`
- **Rate Limit**: Configured via `SESSION_RATE_LIMIT` environment variable
- **Request Body**:
  ```json
  {
    "uuid": "uuid-to-validate"
  }
  ```
- **Response**:
  ```json
  {
    "valid": true
  }
  ```
  or
  ```json
  {
    "valid": false
  }
  ```
- **Error Responses**:
  - 400 Bad Request: If UUID is not provided or invalid format
  - 500 Internal Server Error: If validation process fails

### Persist Session

- **URL**: `/persist_session` or `/api/v1/persist_session`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "session_uuid": "existing-uuid",
    "name": "User Name",
    "email": "user@example.com"
  }
  ```
- **Response**:
  ```json
  {
    "uuid": "existing-uuid",
    "status": "active"
  }
  ```
- **Error Responses**:
  - 400 Bad Request: If required fields are missing or invalid
  - 404 Not Found: If the specified UUID does not exist
  - 500 Internal Server Error: If persistence fails

## Upload Endpoints

### Upload File

- **URL**: `/upload-file` or `/api/v1/upload-file`
- **Method**: `POST`
- **Rate Limit**: Configured via `UPLOAD_RATE_LIMIT` environment variable
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: The file to upload
  - `session_uuid`: The session UUID associated with the upload
- **Response**:
  ```json
  {
    "filename": "stored-filename.ext",
    "success": true
  }
  ```
- **Error Responses**:
  - 400 Bad Request: If file or session_uuid is missing or invalid
  - 404 Not Found: If the specified UUID does not exist
  - 413 Payload Too Large: If the file exceeds the maximum allowed size

## Error Responses

All API endpoints return consistent error responses with the following structure:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "correlation_id": "correlation-uuid"
}
```

The `correlation_id` field can be used for troubleshooting and tracking issues across systems.
