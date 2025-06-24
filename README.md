# Maria AI Agent Project

Maria is an AI agent that autonomously creates and orchestrates other AI agents. The system features a modern React + TypeScript frontend and a modular Flask backend, enabling collaborative, multi-agent workflows through an interactive web interface.

## Project Structure

- **backend/**: Modular Flask backend (see `backend/app/` for routes, utils, and db logic)
- **frontend/**: React + TypeScript client
- **requirements.txt**: Python dependencies
- **package.json**: Node.js dependencies for frontend

## Setup Instructions

### 1. Environment Setup

- **Python**: Install Python >=3.10 <3.13
- **Node.js & NPM**: Install Node.js and npm

```bash
sudo apt install nodejs npm
node -v
npm -v
```

### 2. Backend Setup

Create and activate a Python virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

- Add your `OPENAI_API_KEY` and other environment variables to a `.env` file in the project root:

```
MODEL=gpt-4o-mini
OPENAI_API_KEY=<REPLACE WITH API KEY>
AWS_ACCESS_KEY_ID=<REPLACE WITH AWS KEY>
AWS_SECRET_ACCESS_KEY=<REPLACE WITH AWS SECRET>
AWS_REGION=<REPLACE WITH REGION>
S3_BUCKET_NAME=<REPLACE WITH BUCKET>
```

- To run the backend Flask app:

```bash
# Using the wsgi entry point
cd backend
python wsgi.py

# Or using the Makefile
make run-backend
```

### 3. Frontend Setup

Install dependencies and start the development server:

```bash
cd frontend
npm install
npm start

# Or using the Makefile from project root
make run-frontend
```

The frontend will be available at http://localhost:3000.

### 4. Development Tools

This project uses several tools to maintain code quality:

#### Code Formatting and Linting

- **Backend**: Black, isort, flake8
- **Frontend**: ESLint, Prettier

You can run formatters and linters using:

```bash
# Format code
make format

# Run linters
make lint
```

#### Testing

- **Backend**: pytest for unit and integration tests
- **Frontend**: Jest for component and hook tests

Run tests with:

```bash
# Run backend tests
cd backend && pytest

# Run frontend tests
cd frontend && npm test

# Or run all tests using the Makefile
make test
```

#### Pre-commit Hooks

The project uses pre-commit hooks to ensure code quality. Install them with:

```bash
pip install pre-commit
pre-commit install
```

This will run formatting and linting checks automatically before each commit.
```

- The backend supports CORS for both `http://localhost:3000` and `http://127.0.0.1:3000` for frontend integration.

- To run backend tests:

```bash
PYTHONPATH=backend pytest
```
- Tests are located in `backend/tests/` and use pytest with all external dependencies mocked.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

- To check for outdated packages:

```bash
npm outdated
```

- To update all packages to the latest compatible versions:

```bash
npm update
```

- To start the React app:

```bash
npm start
```

- Useful NPM Scripts:
  - `npm test` — Run tests with Jest
  - `npm run build` — Build for production

## Environment Variables

To configure the backend API URL for the frontend, create a `.env` file in the `frontend/` directory with the following content:

```
REACT_APP_API_BASE_URL=https://your-backend-url.com
```

- Do not commit your `.env` file to version control; it is already listed in `.gitignore`.
- The frontend will use this variable to connect to the backend for file uploads and other API requests.

## Customizing & Extending

- Modify backend logic in `backend/app/`
- Update frontend React components in `frontend/src/components/`

## Documentation & Support

- [React Docs](https://reactjs.org/)

---

For detailed requirements and user stories, see `requirements/EPIC Requirements.md` and `requirements/Story Requirements.md`.

---

## Backend API Endpoints: UUID Validation & Generation

### POST /generate-uuid
- Generates a new unique UUID (retries up to 3 times on collision).
- Response:
  - status: 'success' | 'error'
  - uuid: string or null
  - message: string
  - details: object

### POST /validate-uuid
- Validates a provided UUID for format and uniqueness.
- Response:
  - status: 'success' | 'collision' | 'invalid'
  - uuid: string or null
  - message: string
  - details: object

### Rate Limiting
- Configurable via `SESSION_RATE_LIMIT` environment variable (default: 10/minute per IP).
- Change the value in `.env` to adjust without code changes.

### Audit Logging
- All validation and generation attempts are logged with timestamp, event type, user UUID, and details.

### Security
- CORS restricts access to frontend domain.
- Rate limiting prevents abuse and DDoS attacks.

---

## Local PostgreSQL Setup Guide

Follow these steps to set up a local PostgreSQL database and connect the application:

### 1. Install PostgreSQL

On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

Start and enable the PostgreSQL service:
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Set the `postgres` User Password
Switch to the `postgres` user and set a password (if not already set):
```bash
sudo -i -u postgres
psql
\password postgres
# Enter a secure password (e.g., 123456 for local dev)
\q
exit
```

### 3. Create Application Database and User
Connect to PostgreSQL as the `postgres` user:
```bash
psql -U postgres -h localhost
# Enter the password you set above
```
Then run:
```sql
CREATE DATABASE maria_db;
CREATE USER maria_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE maria_db TO maria_user;
GRANT ALL ON SCHEMA public TO maria_user;
```
Replace `'your_secure_password'` with a strong password.

### 4. Configure Environment Variables
Edit the `.env` file in the project root:
```
POSTGRES_DB=maria_db
POSTGRES_USER=maria_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### 5. Run Database Migrations
Run the migration script to create required tables:
```bash
psql -U maria_user -h localhost -d maria_db -f backend/migrations/001_create_user_sessions.sql
# Enter the password for maria_user
```

### 6. Troubleshooting
- If you do not see the database in DBeaver, ensure "Show all databases" is enabled and refresh the connection.
- If you get permission errors, ensure you have granted privileges on both the database and the `public` schema.
- To list all databases:
  ```bash
  psql -U postgres -h localhost -l
  ```
- To grant connect privilege:
  ```sql
  GRANT CONNECT ON DATABASE maria_db TO maria_user;
  ```

---

## Orphaned File Cleanup Utility

The backend includes a utility script to clean up orphaned files and folders in the S3 `uploads/` bucket. This script:

- Deletes folders under `uploads/{uuid}/` that are older than 30 minutes and have no matching session in the `user_sessions` table.
- Deletes legacy files directly under `uploads/` (not in a UUID folder) if they are older than 30 minutes.
- Supports a dry-run mode for safe testing (default: enabled).
- Logs all actions for audit and recovery.

### Configuration

Set the following environment variables in your `.env` file:

```
ORPHANED_CLEANUP_DRY_RUN=true   # Set to 'false' to actually delete files
ORPHANED_CLEANUP_AGE_MINUTES=30 # Age threshold in minutes
S3_BUCKET_NAME=safqores-maria   # S3 bucket name
```

### Running the Script

From the project root:

```bash
python backend/app/utils/orphaned_file_cleanup.py
```

- In dry-run mode, the script will only log what would be deleted.
- To perform actual deletions, set `ORPHANED_CLEANUP_DRY_RUN=false` in your `.env` file.

### Scheduling Cleanup

To automate cleanup every 30 minutes, add a cron job or use a task scheduler (e.g., APScheduler, Celery beat). Example cron entry:

```
*/30 * * * * cd /path/to/maria-ai-agent && /path/to/venv/bin/python backend/app/utils/orphaned_file_cleanup.py >> /path/to/cleanup.log 2>&1
```

### Safety & Troubleshooting

- Always test in dry-run mode before enabling actual deletions.
- Review logs for any errors or unexpected deletions.
- The script double-checks UUIDs against the database before deleting folders.
- Legacy files in the base of `uploads/` are also cleaned up if old.

---

For full requirements and rationale, see `prompts/user_session.md`.
