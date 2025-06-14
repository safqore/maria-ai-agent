# File Upload Functionality: User Story & Implementation Guide

## User Story

**Title:** As a user, I want to upload multiple PDF files to create a personalized AI agent.

**Description:**  
The file upload feature allows users to select and upload up to 3 PDF files, each with a maximum size of 5 MB. Uploaded files are displayed in a list showing their names and sizes. Users can access the upload functionality via a button and receive feedback if the upload fails. A progress bar indicates the upload status, and files are marked as uploaded once the process is complete. Users can also remove files from the list if needed. The feature should be intuitive, efficient, and visually consistent with the application's design, particularly the chat interface.

---

## React Frontend Structure & Artifacts (for Copilot Context)

The frontend is a React app (TypeScript) located in the `frontend/` folder. Key files and components related to file upload and chat UI:

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

---

## File Upload Workflow

Explaining the file upload workflow in the chat interface:

Step 1:

|[Upload Files]                         	    |  ← Existing button
|-------------------------------------------- |
| [Type message…            |  Send]          |  ← *DISABLED*
----------------------------------------------

Step 2: After user clicks upload files button in step 1, they start uploading files 

| [dummy.pdf ✅] [X]                            |  ← File is uploaded successfully and displays a green tick 
| [plan.doc 40% ▓▓▓░] [X]                      |  ← File is uploading and displays upload percentage progress
| [contract.pdf ❌ Network error] [Retry] [X]   |  ← File encountered upload error and can be retried
| + Add more files                             |
|--------------------------------------------  |
|[Done & Continue]                      	     |  ← Button ENABLED if at least 1 file finished uploading
|--------------------------------------------  |
| [Type message…            |  Send]           |  ← *STILL DISABLED*
----------------------------------------------

Step 3: Once user has uploaded all files, they click Done & Continue. Chat transitions to next state

| Chat continues to next state…                 |
|--------------------------------------------   |
| [Type message…            |  Send]            |  ← *ENABLED*
----------------------------------------------

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
