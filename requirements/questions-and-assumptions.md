# Project Questions and Assumptions

This document is the single source of truth for all current, actively relevant questions and assumptions across the Maria AI Agent project. It is intended to be updated as requirements and features evolve.

**How to use this file:**

- Add new questions and assumptions as they arise during feature planning or implementation.
- Update answers/status as they are resolved.
- Remove items that are no longer relevant or have been superseded.
- Keep this file focused on the present state of the project—do not use it as a historical log.
- Organize by feature/area for clarity.

---

## Table of Contents

- [Session](#session)
- [Email Verification](#email-verification)
- [File Upload](#file-upload)
- [Other Features](#other-features)

---

## Session

### Questions

| #   | Question                                              | Answer/Status                                                                               | Notes                                        |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | How is a session started and tracked?                 | A session starts when the frontend generates a UUID (if not in localStorage).               | See README.md, plan.md                       |
| 2   | Where is the session UUID stored?                     | In both localStorage and React state for persistence across reloads.                        | README.md                                    |
| 3   | When is a session considered complete?                | Only after the user provides and verifies their email address.                              | README.md                                    |
| 4   | What happens if the UUID is missing or tampered with? | The frontend generates a new UUID and shows a reset message.                                | README.md, plan.md                           |
| 5   | How are incomplete sessions and their data handled?   | They are deleted if abandoned (including uploaded files).                                   | README.md                                    |
| 6   | How are orphaned files cleaned up?                    | Files in S3 with UUIDs not in the database and older than 30 minutes are deleted.           | README.md, plan.md                           |
| 7   | How is session reset communicated to the user?        | Via a modal and toast notification: "Your session has been reset due to a technical issue." | README.md, SessionContext, SessionResetModal |
| 8   | How is session security and privacy enforced?         | SSL/TLS, GDPR compliance, explicit consent, and user data controls.                         | README.md, plan.md                           |
| 9   | How is session UUID uniqueness enforced?              | Backend validates and retries up to 3 times on collision.                                   | plan.md, README.md                           |
| 10  | How is session state shared in the frontend?          | Through React Context and custom hooks (no props drilling).                                 | README.md, plan.md                           |
| 11  | How is session reset triggered programmatically?      | By removing the UUID from localStorage and generating a new one, then reloading the app.    | sessionUtils.ts, SessionContext              |
| 12  | How is session persistence tested?                    | With comprehensive backend and frontend tests, including edge cases and error scenarios.    | testing.md                                   |

### Assumptions

| #   | Assumption                                                              | Status/Validation | Notes                              |
| --- | ----------------------------------------------------------------------- | ----------------- | ---------------------------------- |
| 1   | Session UUIDs are always stored in localStorage and React state.        | Validated         | sessionUtils.ts, useSessionUUID.ts |
| 2   | Session reset should clear all user data, including uploaded files.     | Validated         | README.md, plan.md                 |
| 3   | Session reset triggers a full reload of the app.                        | Validated         | sessionUtils.ts, SessionContext    |
| 4   | Backend and frontend session timeouts are synchronized.                 | Validated         | plan.md                            |
| 5   | All session data transmission is over SSL/TLS.                          | Validated         | README.md                          |
| 6   | GDPR and privacy requirements are enforced for all session data.        | Validated         | README.md                          |
| 7   | Orphaned file cleanup is safe and double-checks UUIDs before deletion.  | Validated         | README.md, plan.md                 |
| 8   | All session events are logged for audit and debugging.                  | Validated         | plan.md, README.md                 |
| 9   | Session reset UI is always available to the user via modal and toast.   | Validated         | SessionResetModal, SessionContext  |
| 10  | SessionContext and hooks eliminate the need for props drilling.         | Validated         | README.md, plan.md                 |
| 11  | Rate limiting (10 requests/minute) is sufficient for session endpoints. | Validated         | plan.md                            |
| 12  | All error handling is consistent between frontend and backend.          | Validated         | plan.md, README.md, testing.md     |

---

## Email Verification

### Questions

| #   | Question | Answer/Status | Notes |
| --- | -------- | ------------- | ----- |
|     |          |               |       |

### Assumptions

| #   | Assumption | Status/Validation | Notes |
| --- | ---------- | ----------------- | ----- |
|     |            |                   |       |

---

## File Upload

### Questions

| #   | Question | Answer/Status | Notes |
| --- | -------- | ------------- | ----- |
|     |          |               |       |

### Assumptions

| #   | Assumption | Status/Validation | Notes |
| --- | ---------- | ----------------- | ----- |
|     |            |                   |       |

---

## Other Features

_Add new sections as new features are added to the project._
