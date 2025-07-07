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
- [Architecture](#architecture)
- [Database/Testing](#databasetesting)
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

| #   | Question                                                   | Answer/Status                                                                                  | Notes                                 |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1   | What email service provider will be used?                  | Gmail SMTP with App Password (smtp.gmail.com:587)                                              | Company email hosted on Google        |
| 2   | Should email templates be HTML or plain text?              | HTML templates with branding                                                                   | User preference                       |
| 3   | What should be the sender email address?                   | noreply@safqore.com (Maria sender name)                                                        | User specified                        |
| 4   | What is the user flow after successful email verification? | Show success message with automatic progression to next chat state (no manual continue button) | User confirmed automatic progression  |
| 5   | How should session reset integrate with verification?      | Use existing SessionContext.resetSession() pattern - no window.location.reload                | Reuse existing session reset pattern    |
| 6   | Are proposed rate limits appropriate?                      | 30-second cooldown and 3 resend attempts are acceptable                                        | User confirmed, updated to 30 seconds |
| 7   | How long should verification records be retained?          | 24-hour auto-cleanup via repository cleanup method                                             | For audit/compliance purposes         |
| 8   | Should verification codes be numeric or alphanumeric?      | 6-digit numeric confirmed for better UX (easier typing, less confusion)                        | User confirmed recommendation         |
| 9   | What tone should error messages use?                       | User-friendly with "please" and "thanks" for polite, helpful messaging                         | More courteous user experience        |
| 10  | Should email verification follow existing repository pattern? | Yes - EmailVerificationRepository must extend BaseRepository pattern                           | Architectural alignment required      |
| 11  | How should database transactions be handled?               | Use existing TransactionContext for all operations (atomic)                                    | Follow existing service patterns     |
| 12  | How should FSM integration work?                           | Use nextTransition property in API responses (not nextState)                                   | Follow existing ChatContext pattern  |
| 13  | Which database should be used for testing?                 | SQLite for all test environments (following questions-and-assumptions.md)                      | Consistency with existing setup      |
| 14  | How should session resets be triggered?                    | Use SessionContext.resetSession() and SessionResetModal (no window.reload)                     | Follow existing UX patterns          |

### Assumptions

| #   | Assumption                                                         | Status/Validation | Notes                                         |
| --- | ------------------------------------------------------------------ | ----------------- | --------------------------------------------- |
| 1   | 6-digit numeric codes are preferred over alphanumeric              | Validated         | User confirmed: easier typing, less confusion |
| 2   | 10-minute code expiration is appropriate                           | Validated         | User confirmed: brilliant, industry standard  |
| 3   | 3 verification attempts before session reset is sufficient         | Validated         | User confirmed                                |
| 4   | 30-second resend cooldown is appropriate                           | Validated         | User confirmed: better UX than 1 minute       |
| 5   | Existing session reset mechanism can be reused                     | Validated         | User confirmed - use SessionContext pattern  |
| 6   | Real-time email validation provides better user experience         | Validated         | Immediate feedback as user types              |
| 7   | Continuous prompting for correct email format is acceptable        | Validated         | User confirmed                                |
| 8   | Moving "done and continue" button to bottom won't conflict with UI | Validated         | User confirmed                                |
| 9   | Message text changes align with brand voice                        | Validated         | User confirmed                                |
| 10  | FSM integration can be added without major refactoring             | Validated         | User confirmed - follows existing patterns   |
| 11  | Database migration can be approved and deployed                    | Validated         | SQLite migration, user confirmed              |
| 12  | Backend/frontend deployment can be coordinated                     | Validated         | User referenced ci/cd folder                  |
| 13  | Repository pattern must be followed for email verification         | Validated         | Architectural consistency required            |
| 14  | TransactionContext must be used for database operations            | Validated         | Follow existing service layer patterns       |
| 15  | nextTransition property must be used for FSM integration           | Validated         | Follow existing API response patterns        |
| 16  | SQLite must be used for all testing environments                   | Validated         | Consistency with existing database strategy   |
| 17  | SessionContext pattern must be used for session resets             | Validated         | Consistency with existing UX patterns        |

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

## Architecture

_Document key architectural decisions and design patterns used in the project._

### Questions

| #   | Question                                                   | Answer/Status                                                                                     | Notes                       |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | What is the approach for SQLAlchemy relationship loading?  | Default to lazy loading, with eager loading used selectively for performance-critical paths.      | plan.md, sqlalchemy.md      |
| 2   | What strategy should be used for API retries?              | Linear backoff with a maximum of 3 retries, configurable by endpoint and error type.              | plan.md                     |
| 3   | How should correlation IDs be generated and maintained?    | Server-side generation with each request, passed to all downstream services and response headers. | plan.md, tracking.md        |
| 4   | What error handling strategy should be implemented?        | Structured error responses with environment-based detail level and consistent error codes.        | errors.py, plan.md          |
| 5   | How should database transaction boundaries be managed?     | Explicit transaction boundaries at service layer with proper error handling and rollback.         | services/, database.py      |
| 6   | What is the approach for frontend/backend integration?     | API-driven with clear contracts, separate deployment, and configuration-based endpoints.          | next-steps.md, plan.md      |
| 7   | How should application configuration be managed?           | Environment variables with sensible defaults, separate for frontend and backend.                  | config.py, frontend/.env    |
| 8   | What is the port configuration strategy?                   | Environment variables only, never hardcoded, with dynamic CORS configuration.                     | config.py, package.json     |
| 9   | How are architectural decisions documented and maintained? | In questions-and-assumptions.md with rationale and implementation notes.                          | This document               |
| 10  | What is the testing strategy for architectural components? | Unit tests for individual components, integration tests for critical paths only.                  | testing.md, plan.md         |
| 11  | How should FSM state transitions be handled via API?       | Use nextTransition property in API responses, with legacy support for nextState.                  | ChatContext.tsx, chatApi.ts |

### Assumptions

| #   | Assumption                                                                       | Status/Validation | Notes                                  |
| --- | -------------------------------------------------------------------------------- | ----------------- | -------------------------------------- |
| 1   | Lazy loading is appropriate for most database relationships in this application. | Validated         | sqlalchemy.md, plan.md                 |
| 2   | API retry with linear backoff is sufficient for handling transient failures.     | Validated         | next-steps.md                          |
| 3   | Server-side correlation ID generation provides better security and reliability.  | Validated         | tracking.md, plan.md                   |
| 4   | Environment-based error detail protects sensitive information in production.     | Validated         | errors.py, plan.md                     |
| 5   | Explicit transaction boundaries provide better control over database integrity.  | Validated         | services/, database.py                 |
| 6   | Frontend and backend will be deployed independently.                             | Validated         | README.md, plan.md                     |
| 7   | All configuration values should be overridable via environment variables.        | Validated         | config.py, frontend/.env               |
| 8   | Dynamic CORS configuration adapts to port changes automatically.                 | Validated         | config.py                              |
| 9   | Documentation is maintained alongside code changes.                              | Validated         | This document, README.md               |
| 10  | Unit tests are prioritized over integration tests for most components.           | Validated         | testing.md, plan.md                    |
| 11  | Using FSM transitions is more robust than directly setting FSM states.           | Validated         | ChatContext.tsx, FiniteStateMachine.ts |

---

## Database/Testing

### Questions

| #   | Question                                                   | Answer/Status                                                                                     | Notes                       |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | Should migrations be run automatically before tests?       | Yes, migrations should run automatically before tests to ensure consistent test environment.      | User confirmed              |
| 2   | What migration tool should be used?                        | Alembic is the standard migration tool for SQLAlchemy applications.                              | User confirmed              |
| 3   | What database should be used for all test runs?            | SQLite should be the default for all test runs (local/dev/test environments).                    | User confirmed              |
| 4   | How should database initialization be handled in CI/CD?     | Automated database setup with migrations applied before test execution.                           | To be implemented           |
| 5   | What is the strategy for handling SQLite threading issues? | Use thread-local database connections or skip concurrent tests that require thread safety.        | To be resolved              |

### Assumptions

| #   | Assumption                                                                       | Status/Validation | Notes                                  |
| --- | -------------------------------------------------------------------------------- | ----------------- | -------------------------------------- |
| 1   | SQLite is sufficient for all development and testing scenarios.                  | Validated         | User confirmed                         |
| 2   | Alembic migrations provide better version control than raw SQL scripts.         | Validated         | User confirmed                         |
| 3   | Automatic migration application before tests ensures test reliability.           | Validated         | User confirmed                         |
| 4   | Database initialization scripts should work from both project root and backend.  | To be implemented | Need to fix import path issues         |
| 5   | Test database should be separate from development database.                      | Validated         | Current setup uses maria_ai_test.db    |

---

## Other Features

_Features that will be implemented after the refactor project comes to a close._

### Questions

| #   | Question                                                   | Answer/Status                                                                                     | Notes                       |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | When will advanced email verification be implemented?      | After refactor project completion - currently in flight.                                          | Post-refactor feature       |
| 2   | When will comprehensive audit logging be implemented?      | After refactor project completion - currently in flight.                                          | Post-refactor feature       |
| 3   | When will advanced session management features be added?   | After refactor project completion - currently in flight.                                          | Post-refactor feature       |

### Assumptions

| #   | Assumption                                                                       | Status/Validation | Notes                                  |
| --- | -------------------------------------------------------------------------------- | ----------------- | -------------------------------------- |
| 1   | Core refactor architecture will support future feature additions.                | Validated         | Current architecture is extensible     |
| 2   | Post-refactor features can be implemented without major architectural changes.   | Validated         | Current design supports this           |
| 3   | Refactor completion is the priority before adding new features.                 | Validated         | User confirmed                         |
