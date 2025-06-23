# API Endpoints: UUID Validation & Generation

## Endpoints

### POST /generate-uuid
- Generates a new unique UUID (retries up to 3 times on collision).
- Response:
  - status: 'success' | 'error'
  - uuid: string or null
  - message: string
  - details: object

### POST /validate-uuid
- Validates a provided UUID for format and uniqueness.
- Response:
  - status: 'success' | 'collision' | 'invalid'
  - uuid: string or null
  - message: string
  - details: object

## Rate Limiting
- Configurable via `SESSION_RATE_LIMIT` environment variable (default: 10/minute per IP).
- Change the value in `.env` to adjust without code changes.

## Audit Logging
- All validation and generation attempts are logged with timestamp, event type, user UUID, and details.

## Security
- CORS restricts access to frontend domain.
- Rate limiting prevents abuse and DDoS attacks.

---

See `prompts/user_session.md` for full requirements and rationale.
