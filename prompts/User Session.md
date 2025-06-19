# User Session & File Association Strategy

## 1. User/Session Identifier

- **Approach:**  
  Each user interaction (from the point they provide their name, email, and upload files) is tied to a unique session or user identifier (UUID).
- **Rationale:**  
  This ensures all files and data are associated with the correct user, even in a multi-user environment.
- **Clarification & Best Practices:**  
  - The session/user ID should persist across browser reloads. Store the UUID in localStorage to uniquely identify the same user every time they return to the application from the same browser. The frontend should read the UUID from localStorage and include it in all API requests to the backend.
  - **Handling abandoned sessions:**  
    - **Session Expiry:** Implement a timeout (e.g., 7 or 30 days) after which inactive sessions are considered abandoned and can be cleaned up.
    - **Soft Deletion/Archival:** Mark incomplete or abandoned sessions in the database for potential later cleanup, rather than deleting immediately.
    - **User Prompt on Return:** When a user returns with an incomplete session, prompt them to continue or discard the previous session.
    - **Periodic Cleanup Job:** Schedule a background job to remove or archive sessions that have been inactive past a certain threshold.
    - **Analytics:** Track abandonment rates to inform UX improvements.
    - **Session Completion:** A session is only considered complete after the user has provided their email address and verified it by clicking a link sent to their email. Until this point, all sessions are considered partial/incomplete. Partial sessions are not treated differently, but must be cleaned up to avoid unnecessary storage usage.
    - **S3 Storage Management:** Incomplete sessions that have uploaded files to S3 should have those files removed during housekeeping to free up storage space.

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
  - Incrementally persist session data as the user progresses through each step (e.g., after uploading a file, entering their name, etc.).
  - Track session status with a field such as `incomplete`, `pending_verification`, or `complete`.
  - When the user verifies their email, update the session status to `complete`.
  - Allow users to resume incomplete sessions by retrieving their session data using the UUID.
  - Implement housekeeping routines to periodically clean up sessions with `incomplete` or `pending_verification` status that have been inactive for a defined period.
- **Data Fields to Store:**
  - `uuid` (unique identifier for the session/user)
  - `name` (user's name)
  - `email` (user's email address)
  - `timestamps` (created_at, updated_at, completed_at)
  - `workflow_state` (e.g., incomplete, pending_verification, complete)
  - `ip_address` (user's IP address)
  - `consent_personal_data` (explicit consent for storing personal data)
  - `consent_ai_training` (explicit consent for using uploaded files to train AI agent)
  - **Note:** File URLs are not stored; all files are stored in S3 under a folder named after the UUID, tying all files to the user/session.
- **Benefits:**  
  - Enables querying for analytics, lead tracking, and licensing/subscription management.
  - Scalable and robust for production use.
- **Clarification Needed:**  
  - What is the expected data retention policy?

## 4. Workflow Summary

1. Frontend generates and stores a UUID at workflow start.
2. All uploads and API calls include this UUID.
3. Backend namespaces files and persists user data in PostgreSQL using the UUID.
4. All user actions and files are queryable and auditable by UUID.

## 5. Security & Privacy

- To be reviewed at implementation time.
- Open questions:
  - How do we authenticate/authorize users (if at all)?
  - What measures are needed for GDPR or similar compliance?

---

## Open Questions & Next Steps

- Confirm session persistence requirements and data retention policy.
- Define the exact schema for PostgreSQL (fields, relationships).
- Decide on user authentication/authorization needs.
- Plan for error handling and session cleanup.

---

This document will guide the implementation and ensure clarity for all contributors. Please review and provide feedback or further requirements.
