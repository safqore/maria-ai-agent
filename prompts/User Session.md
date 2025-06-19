# User Session & File Association Strategy

## 1. User/Session Identifier

- **Approach:**  
  Each user interaction (from the point they provide their name, email, and upload files) is tied to a unique session or user identifier (UUID).
- **Rationale:**  
  This ensures all files and data are associated with the correct user, even in a multi-user environment.
- **Clarification & Best Practices:**  
  - The session/user ID should persist across browser reloads. Store the UUID in localStorage to uniquely identify the same user every time they return to the application from the same browser. The frontend should read the UUID from localStorage and include it in all API requests to the backend.
  - **Handling abandoned sessions:**  
    - Incomplete sessions and their data are deleted immediately. No housekeeping jobs or user prompts are needed.
    - **Session Completion:** A session is only considered complete after the user has provided their email address and verified it by clicking a link sent to their email. Until this point, all sessions are considered partial/incomplete and are deleted immediately if abandoned.
    - **S3 Storage Management:** Incomplete sessions that have uploaded files to S3 should have those files removed immediately as part of the deletion process.

## 2. Frontend & Backend Integration

- **Frontend:**  
  - Generate a UUID at the start of the workflow if one does not already exist in localStorage.
  - Store the UUID in React state and in localStorage for persistence.
  - Send the UUID with every file upload and API request.
- **Backend:**  
  - Require the UUID in all relevant endpoints.
  - Namespace file storage and user data by UUID.

## 3. Data Persistence (Database)

- **Preferred Option:**  
  Use PostgreSQL to persist user sessions, file metadata, and user information.
- **Persistence Strategy:**  
  - Only persist sessions that are either pending email verification or complete (i.e., email has been verified).
  - If a user leaves a session before providing their email address, immediately delete any uploaded files from S3 and do not persist the session in the database.
  - When a user provides their email address, store the session as pending verification. Once the user clicks the unique verification link (which expires after use or after 30 minutes), update the session to complete. If the link expires before use, delete the user's files from S3 and remove their record from the users table. If a user tries to verify after the link has expired, inform them that the link has expired and they must start again.
  - There is no need to track or sync multiple session statuses between frontend and backend; the workflow is simple enough to start fresh if a user abandons a session.
  - No housekeeping jobs are required, as incomplete sessions and their data are deleted immediately.
- **Data Fields to Store:**
  - `uuid` (unique identifier for the session/user)
  - `name` (user's name)
  - `email` (user's email address)
  - `timestamps` (created_at, updated_at, completed_at)
  - `ip_address` (user's IP address)
  - `consent_personal_data` (explicit consent for storing personal data)
  - `consent_ai_training` (explicit consent for using uploaded files to train AI agent)
  - **Note:** File URLs are not stored; all files are stored in S3 under a folder named after the UUID, tying all files to the user/session.
- **Benefits:**  
  - Enables querying for analytics, lead tracking, and licensing/subscription management.
  - Scalable and robust for production use.
- **Data Retention Policy:**
  - Incomplete sessions and their data are deleted immediately.
  - Sessions that are pending email verification or complete are retained indefinitely as user records.
  - Users are not notified of incomplete session deletion.

## 4. Workflow Summary

1. Frontend generates and stores a UUID at workflow start.
2. All uploads and API calls include this UUID.
3. Backend namespaces files and persists user data in PostgreSQL using the UUID.
4. All user actions and files are queryable and auditable by UUID.

## 5. Security & Privacy

- **Authentication & Authorization:**
  - No authentication or authorization is required for users. A session starts when the user provides their name in the chatbot interface.
- **Security Measures:**
  - All data transmission should use standard encryption protocols (e.g., SSL/TLS).
- **GDPR Compliance:**
  - Explicit user consent is collected for storing personal data and for using uploaded files to train the AI agent. Users can withdraw consent or delete their account at any time via the chatbot interface provided after verification. The timestamp of consent is logged in the database.
  - On the user’s bot webpage, options will be available to withdraw consent, request data access, request a copy, or request correction. These requests will be emailed to a designated address and fulfilled as soon as possible.
  - Data minimization: Only essential data is collected and stored.
  - Data access: Users can request access to the data stored about them.
  - Data portability: Users can request a copy of their data in a portable format.
  - Data rectification: Users can request corrections to their stored data if inaccurate.
  - Data retention: Data is only retained for as long as necessary for the stated purposes.

---

## Open Questions & Next Steps

- Session persistence: If a user does not complete their session, they will start from the beginning on their next visit. Users cannot delete or reset their session manually.
- UUID uniqueness: The UUID is a required, unique key for each session. The system must ensure that UUIDs are never duplicated and are always generated for every session.
- Error handling: If an error occurs (e.g., on the chatbot frontend), display a user-friendly message such as: "The system has encountered an error, which has been notified to the administrator to investigate. Please try again later." An email with relevant logs will be sent to a configurable admin address for review.
- Multi-device/browser support: Session resumption is not supported. If a user joins from a different device or browser, a new session will be started.
- Define the exact schema for PostgreSQL (fields, relationships).
- Pending-verification sessions will be deleted after 30 minutes if not completed.
- IP addresses are stored for analytics purposes to understand geographic interest in the software. No explicit disclosure is currently planned, but this can be revisited if needed.
- Proceed with a draft PostgreSQL schema and refine as needed.

---

This document will guide the implementation and ensure clarity for all contributors. Please review and provide feedback or further requirements.
