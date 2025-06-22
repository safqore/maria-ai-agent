# User Session & File Association Strategy

## 1. Session Lifecycle Overview
- **Session Start:**
  - A session begins when the frontend generates a UUID (if one does not exist in localStorage) before any user interaction.
  - The UUID is stored in both localStorage and React state for persistence across reloads.
- **Session Completion:**
  - A session is only considered complete after the user provides and verifies their email address.
  - Incomplete sessions and their data (including uploaded files) are deleted immediately if abandoned.
- **Session Reset:**
  - If the UUID is missing or tampered with (e.g., deleted or changed in localStorage), the frontend immediately generates a new UUID, starts a new session, and shows: “Your session has been reset due to a technical issue. Please start again.”
  - No attempt is made to recover or tie back previously uploaded files to a new UUID. Orphaned files are subject to backend cleanup policy.

## 2. UUID Management & Integrity
- **Generation & Storage:**
  - The frontend is responsible for UUID generation, except in the case of backend-detected collisions.
  - The UUID is generated at app start if not present, and is used for all user actions and file uploads.
  - The UUID persists across browser reloads via localStorage.
- **Validation & Tampering Detection:**
  - The frontend checks for a valid UUID before every user action (chat, button click, file upload, API call).
  - If the UUID is missing or invalid, a new UUID is generated and a new session is started immediately, with the reset message shown to the user.
  - The backend validates the UUID on all endpoints. If a tampered or invalid UUID is detected, the backend returns an error, prompting the frontend to reset the session and show the reset message.
- **Backend Uniqueness & Migration:**
  - On session persistence (when the user provides their name/email), the backend checks if the UUID is unique and matches the S3 folder for uploaded files.
  - If a collision is detected (but not tampering), the backend generates a new unique UUID, migrates files, and returns the new UUID to the frontend, which updates localStorage and state.

## 3. File Handling & Namespacing
- **S3 Storage:**
  - All file uploads are immediately namespaced as `uploads/{uuid}/filename`.
  - No support for legacy or flat uploads is required.
- **Orphaned Files:**
  - Files uploaded under a previous or invalid UUID become orphaned and are subject to backend cleanup policy.
  - Incomplete sessions that have uploaded files to S3 have those files removed immediately as part of the deletion process.

## 4. Frontend & Backend Integration
- **Frontend:**
  - Generates and stores a UUID at workflow start if not present.
  - Sends the UUID with every file upload and API request.
  - Handles session reset and messaging on UUID loss/tampering.
- **Backend:**
  - Requires and validates the UUID on all relevant endpoints.
  - Namespaces file storage and user data by UUID.
  - Provides an endpoint to generate/validate UUIDs, ensuring uniqueness before use.

## 5. Data Persistence (Database)
- **Database:**
  - PostgreSQL is used to persist user sessions, file metadata, and user information.
- **Persistence Strategy:**
  - Only sessions pending email verification or complete (email verified) are persisted.
  - If a user leaves before providing their email, uploaded files are deleted from S3 and the session is not persisted.
  - When a user provides their email, the session is stored as pending verification. After verification, the session is marked complete. Expired or unverified sessions are deleted along with their files.
- **Data Fields:**
  - `uuid`, `name`, `email`, `timestamps` (created_at, updated_at, completed_at), `ip_address`, `consent_user_data`.
  - File URLs are not stored; all files are in S3 under the UUID folder.
- **Audit Logging:**
  - All significant user and system events are logged with timestamp, event type, user UUID, and relevant metadata for traceability and compliance.

## 6. Security & Privacy
- **Authentication:**
  - No authentication/authorization is required; a session starts when the user provides their name.
- **Security:**
  - All data transmission uses SSL/TLS.
- **GDPR Compliance:**
  - Explicit user consent is collected for storing personal data and using uploaded files to train the AI agent.
  - Users can withdraw consent or delete their account at any time via the chatbot interface after verification. Deletion is immediate and irreversible.
  - Users are informed that their IP address is collected for analytics. The privacy notice is accessible in the chatbot UI and must be agreed to explicitly.
  - Data minimization, access, portability, rectification, and retention policies are enforced as described.

## 7. Error Handling & User Messaging
- **Session Reset:**
  - On UUID loss/tampering, the frontend shows: “Your session has been reset due to a technical issue. Please start again.”
- **Backend Errors:**
  - If the backend detects a tampered/invalid session, the frontend resets the session and shows the reset message.
- **General Errors:**
  - On other errors, show: "The system has encountered an error, which has been notified to the administrator to investigate. Please try again later."
  - An email with relevant logs (user UUID, error logs, timestamp, user actions, truncated to 200 chars, with a reference to the full log) is sent to a configurable admin address immediately.

## 8. Testing & Coverage
- **Unit Tests:**
  - Basic tampering detection is sufficient; no need to simulate rapid/advanced tampering scenarios.
- **Test Coverage:**
  - Ensure all edge cases for session reset, UUID loss/tampering, and file orphaning are covered.

## 9. Open Questions & Future Considerations
- **Session Persistence:**
  - Users cannot delete or reset their session manually; incomplete sessions start fresh on next visit.
- **UUID Uniqueness:**
  - The backend ensures UUIDs are never duplicated and always unique for every session.
- **Multi-Device/Tab Support:**
  - No synchronization of UUIDs across devices/tabs; each is independent.
- **Session Recovery:**
  - If session resumption or merging is needed in the future, new flows and rules must be defined.
- **Orphaned File Cleanup:**
  - Backend policy for orphaned file cleanup must be clearly defined and implemented.
- **Schema Definition:**
  - Define the exact schema for PostgreSQL (user session and audit tables).

---

This document guides implementation and ensures clarity for all contributors. Please review and provide feedback or further requirements.
