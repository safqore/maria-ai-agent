### User Story: File Upload Functionality

**Title:** As a user, I want to upload multiple PDF files to create a personalized AI agent.

**Description:**  
The file upload feature allows users to select and upload up to 3 PDF files, each with a maximum size of 5 MB. Uploaded files are displayed in a list showing their names and sizes. Users can access the upload functionality via a button and receive feedback if the upload fails. A progress bar indicates the upload status, and files are marked as uploaded once the process is complete. Users can also remove files from the list if needed. The feature should be intuitive, efficient, and visually consistent with the application's design, particularly the chat interface.

**Acceptance Criteria:**
1. Users can upload only PDF files.
2. A maximum of 3 files can be uploaded at a time.
3. Each file must not exceed 5 MB in size.
4. Selected files are displayed in a list with their names and sizes.
5. Users are alerted if they attempt to upload more than 3 files or files larger than 5 MB.
6. Files are uploaded to the server endpoint (`/upload`) via a POST request.
7. Users receive feedback on upload success or failure.
8. Users can remove files from the list before or after uploading.