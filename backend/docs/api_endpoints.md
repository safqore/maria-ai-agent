# API Endpoints Documentation

This document provides documentation for all API endpoints in the Maria AI Agent backend.

## API Versioning

The API uses URL prefixes for versioning. All endpoints are available at:
- Legacy (no prefix): `/endpoint`
- Versioned: `/api/v1/endpoint`

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
  - 500 Internal Server Error: If upload process fails

## Health Check

### Ping

- **URL**: `/ping`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "message": "pong"
  }
  ```
