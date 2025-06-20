# User Session & File Upload QA Walkthrough

## 1. UUID Generation & Persistence

- On app start, the custom hook `useSessionUUID` checks `localStorage` for a `session_uuid`.
- If not found, it generates a new UUID, stores it in `localStorage` and React state.
- The UUID persists across reloads and is used for all user actions.

**QA Steps:**
- Open the app in your browser.
- Open DevTools → Application → Local Storage.
- Confirm a `session_uuid` key is present and persists across reloads.
- Delete the key and reload; a new UUID should be generated.

---

## 2. UUID Propagation

- `App.tsx` uses `useSessionUUID` and passes the UUID as a prop to `ChatContainer`.
- `ChatContainer` passes the UUID to `ChatHistory`.
- `ChatHistory` passes the UUID to `FileUpload`.
- All file uploads and API calls can now include the UUID.

**QA Steps:**
- Confirm the UUID is available as a prop in `FileUpload` (add a `console.log` if needed).
- Upload a file and inspect the network request; the `session_uuid` should be included in the form data.

---

## 3. File Upload Component

- Accepts only PDF files, up to 3 files, each ≤5MB.
- Shows progress bar, upload success, error, and allows retry/removal.
- Sends the file and `session_uuid` to the backend on upload.

**QA Steps:**
- Try uploading a non-PDF file: you should see an error.
- Try uploading more than 3 files: you should see an error.
- Try uploading a file >5MB: you should see an error.
- Upload a valid PDF: you should see progress and success.
- Simulate a network error (e.g., disconnect or mock backend): you should see an error and a retry button.

---

## 4. Automated Tests

- File type, file count, file size validation.
- Progress bar and upload success.
- Error handling and retry.
- Accessibility.
- Callback invocation.

**QA Steps:**
- Run `npm test -- src/components/FileUpload.test.tsx` and confirm all tests pass.

---

## 5. Manual Integration QA

- Upload files and check the backend receives the `session_uuid`.
- Confirm the UUID persists across page reloads and is reused for new uploads in the same browser.
- Open a new incognito window; a new UUID should be generated.

---

## 6. Code Quality

- All code follows ESLint/TypeScript best practices.
- Components are functional and type-safe.
- No hardcoded backend URLs; all are imported from config.

---

This checklist ensures the UUID session management and file upload logic are robust, testable, and ready for QA.
