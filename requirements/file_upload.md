# File Upload Functionality: User Story & Implementation Guide

## User Story

**Title:** As a user, I want to upload multiple PDF files to create a personalized AI agent.

**Description:**
The file upload feature allows users to select and upload up to 3 PDF files, each with a maximum size of 5 MB. Uploaded files are displayed in a list showing their names and sizes. Users can access the upload functionality via a button and receive feedback if the upload fails. A progress bar indicates the upload status, and files are marked as uploaded once the process is complete. Users can also remove files from the list if needed. The feature should be intuitive, efficient, and visually consistent with the application's design, particularly the chat interface.

---

## React Frontend Structure & Artifacts (for Copilot Context)

The frontend is a React app (TypeScript) located in the `frontend/` folder. Key files and components related to file upload and chat UI. This is located in `src/`:

- `App.tsx`: Main app entry point.
- `components/ChatContainer.tsx`: Manages chat state, input, and history.
- `components/ChatHistory.tsx`: Renders chat messages and file upload UI.
- `components/ChatInputArea.tsx`: User text input.
- `components/ButtonGroup.tsx`: Renders button options for user actions.
- `components/FileUpload.tsx`: Main file upload component (to be updated to meet requirements).
- `components/TypingEffect.tsx`: Simulates bot typing.
- `state/FiniteStateMachine.ts`: Manages workflow states.
- `hooks/useChatStateMachine.ts`: Orchestrates chat logic and state transitions.
- `utils/chatUtils.ts`: Defines message types and chat utilities.

The file upload feature is implemented in `components/FileUpload.tsx` and is integrated into the chat interface for a seamless user experience.

---

## Acceptance Criteria (Simplified)

1. Only PDF files can be uploaded (max 3 files, each ≤ 5 MB).
2. Selected files are listed with name and size; users can remove files before/after upload.
3. Alerts are shown for invalid file type, size, or count.
4. Files are uploaded to `/upload` via POST; progress bar and upload status are shown per file.
5. Users receive feedback on upload success/failure.
6. UI is visually consistent with the chat interface.
7. **Frontend and backend must be fully decoupled:**
   - All backend URLs (such as `/upload`) must be specified via configuration (e.g., environment variables or config files) in the frontend code, never hardcoded.
   - The frontend and backend will be deployed to different servers/services.
   - There must be no hard dependencies between frontend and backend code.

---

## File Upload Workflow

This section explains the file upload workflow in the chat interface.

### Step 1: Initial State

| Button/Field          | State/Description           |
| --------------------- | --------------------------- |
| Upload Files          | Existing button             |
| Type message… | Send | Send button is **disabled** |

---

### Step 2: Uploading Files

- After clicking **Upload Files**, users can upload files. The UI displays each file's status:

| File Example                       | Status Description                 | Actions     |
| ---------------------------------- | ---------------------------------- | ----------- |
| dummy.pdf ✅                       | Uploaded successfully (green tick) | [X] Remove  |
| plan.doc 40% ▓▓▓░                  | Uploading, shows progress bar      | [X] Cancel  |
| contract.pdf ❌ Network error      | Upload error (network), can retry  | [Retry] [X] |
| dummy2.pdf ❌ File too large       | File too large, can retry          | [Retry] [X] |
| plan2.doc ❌ Unsupported file type | Unsupported type, can remove       | [Remove]    |
| dummy3.pdf ❌ Failed to upload     | Failed to upload, can retry        | [Retry] [X] |
| + Add more files                   | Add more files button              |             |

- **Done & Continue** button is **enabled** if at least one file finished uploading.
- **Send** button remains **disabled**.

---

### Step 3: After Upload

- Once all files are uploaded, user clicks **Done & Continue**.
- Chat transitions to the next state.

| Button/Field          | State/Description          |
| --------------------- | -------------------------- |
| Chat continues…       | Next state is active       |
| Type message… | Send | Send button is **enabled** |

---

## Implementation Steps for File Upload to S3

This guide explains how to implement backend file upload functionality to AWS S3, tailored to your current project structure.

### 1. Install Required Python Packages

- Ensure the following packages are listed in requirements.txt (already present):
  - `boto3` (AWS S3 integration)
  - `python-multipart` (file upload handling)
  - `flask` (web framework)
- Install dependencies:
  ```bash
  pip install -r requirements.txt
  ```

### 2. Project Structure

- The backend code should be placed in the backend directory.
- There is no need for an MVC pattern, controllers, or routes subfolders.
- All logic can be implemented in a single Flask app file, e.g., `backend/app.py`.

### 3. S3 Upload Logic

- In `backend/app.py`, implement:
  - A Flask app with a `/upload` POST endpoint.
  - File validation: only accept PDFs, max size 5 MB, max 3 files per request.
  - Use `boto3` to upload files to S3 using credentials from environment variables.
  - Return a JSON response with the uploaded file URLs or error messages.

### 4. Environment Variables

- Ensure the following are set in your .env file (in the project root):
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - `S3_BUCKET_NAME`
- Use `python-dotenv` to load these variables in your Flask app.

### 5. Error Handling and Validation

- The backend should:
  - Check that files are present in the request.
  - Validate file type and size.
  - Enforce a maximum of 3 files per upload.
  - Return clear error messages and appropriate HTTP status codes.

### 6. Integration with Frontend

- The `/upload` endpoint should accept POST requests with files from the React frontend.
- **Frontend/Backend Integration Requirements:**
  - The frontend and backend will be deployed to different servers/services.
  - All backend URLs (such as `/upload`) must be specified via configuration (e.g., environment variables or config files) in the frontend code, never hardcoded.
  - There must be no hard dependencies between frontend and backend code.
- On success, return:
  ```json
  { "files": [ { "filename": "...", "url": "..." }, ... ] }
  ```
- On failure, return:
  ```json
  { "error": "..." }
  ```
  with an appropriate status code.

### 7. Next Steps

- Once implemented, the backend will be ready for integration with the frontend file upload component.
- Additional features (e.g., progress tracking, file removal) can be added later as needed.

---

## Additional Implementation Clarifications

1. **/upload Endpoint Request Format**

   - The `/upload` endpoint should accept a single file per request (not batch uploads).
   - Use `multipart/form-data` as the request format, with the file field named `file`.
   - The endpoint will be provided by a Flask application.

2. **Progress Bar Behavior**

   - Progress bar is shown per file.
   - Progress reflects both frontend upload progress and backend processing (i.e., file is only marked as uploaded when successfully stored in S3).

3. **File Removal**

   - Users can remove files both before and after upload.
   - Removing an uploaded file should also trigger a backend delete request to remove the file from S3.

4. **Error Feedback**

   - Error messages and feedback should follow the file upload workflow described above (see File Upload Workflow section).
   - Errors should be shown inline, next to each file, and allow retry/removal as appropriate.

5. **Accessibility & UX**

   - Accessibility: Error text and status messages must be readable by screen readers (e.g., "Upload failed: File too large, try a smaller file.").
   - UI elements should be navigable via keyboard.

6. **Integration with State Machine**

   - After clicking "Done & Continue", the chat should transition to the next state and prompt the user for their email address.

7. **Testing Requirements**
   - Begin with failing unit tests (red state) for the file upload feature.
   - Implement the feature to pass the tests (green state).
   - Tests should cover edge cases, error handling, and state transitions.

---

If further clarification is needed, specify the scenario or workflow in question for additional detail.
