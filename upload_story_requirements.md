# Implementation Steps for File Upload to S3

This guide explains how to implement backend file upload functionality to AWS S3, tailored to your current project structure.

## 1. Install Required Python Packages

- Ensure the following packages are listed in requirements.txt (already present):
  - `boto3` (AWS S3 integration)
  - `python-multipart` (file upload handling)
  - `flask` (web framework)
- Install dependencies:
  ```bash
  pip install -r requirements.txt
  ```

## 2. Project Structure

- The backend code should be placed in the backend directory.
- There is no need for an MVC pattern, controllers, or routes subfolders.
- All logic can be implemented in a single Flask app file, e.g., `backend/app.py`.

## 3. S3 Upload Logic

- In `backend/app.py`, implement:
  - A Flask app with a `/upload` POST endpoint.
  - File validation: only accept PDFs, max size 5 MB, max 3 files per request.
  - Use `boto3` to upload files to S3 using credentials from environment variables.
  - Return a JSON response with the uploaded file URLs or error messages.

## 4. Environment Variables

- Ensure the following are set in your .env file (in the project root):
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - `S3_BUCKET_NAME`
- Use `python-dotenv` to load these variables in your Flask app.

## 5. Error Handling and Validation

- The backend should:
  - Check that files are present in the request.
  - Validate file type and size.
  - Enforce a maximum of 3 files per upload.
  - Return clear error messages and appropriate HTTP status codes.

## 6. Integration with Frontend

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

## 7. Next Steps

- Once implemented, the backend will be ready for integration with the frontend file upload component.
- Additional features (e.g., progress tracking, file removal) can be added later as needed.
