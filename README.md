# Maria AI Agent Project

Maria is an AI agent that autonomously creates and orchestrates other AI agents. The system features a modern React + TypeScript frontend and a modular Flask backend, enabling collaborative, multi-agent workflows through an interactive web interface.

## Project Structure

- **backend/**: Modular Flask backend (see `backend/app/` for routes, utils, and db logic)
- **frontend/**: React + TypeScript client
- **requirements.txt**: Python dependencies
- **package.json**: Node.js dependencies for frontend

## Recent Updates

- **API Versioning**: All endpoints are now available at `/api/v1/` prefix while maintaining backward compatibility
- **Rate Limiting**: Configured Redis-backed rate limiting with development environment fallback
- **Import Structure**: Fixed import structure throughout the codebase
- **SQLAlchemy ORM**: Implemented SQLAlchemy ORM with repository pattern
- **Blueprint Organization**: Improved route organization using Flask blueprints

## Setup Instructions

### 1. Environment Setup

- **Python**: Install Python >=3.10 <3.13
- **Node.js & NPM**: Install Node.js and npm

```bash
sudo apt install nodejs npm
node -v
npm -v
```

### 2. Configuration

We use a separated configuration approach, with each service maintaining its own environment files:

#### Backend Configuration
```bash
# Copy the example configuration
cp backend/.env.example backend/.env

# Edit the backend configuration
nano backend/.env
```

Key backend configuration options:
```
# Server Configuration
PORT=5000

# API Keys
OPENAI_API_KEY=<YOUR_API_KEY_HERE>
# ... other backend-specific config
```

#### Frontend Configuration
```bash
# Copy the example configuration
cp frontend/.env.example frontend/.env

# Edit the frontend configuration
nano frontend/.env
```

Key frontend configuration options:
```
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:5000  # Should match backend's PORT
# ... other frontend-specific config
```

Note: The frontend development server runs on port 3000 by default, configured in `package.json`.

### 3. Backend Setup

Create and activate a Python virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

- To run the backend Flask app:

```bash
# Using the wsgi entry point
cd backend
python wsgi.py

# Or using the Makefile
make run-backend
```

### 4. Frontend Setup

Install dependencies and start the development server:

```bash
cd frontend
npm install
npm start

# Or using the Makefile from project root
make run-frontend
```

The frontend will be available at http://localhost:3000.

### 5. Development Tools

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

---

## Configuration Guide

### Configuration Strategy

To simplify project configuration and better reflect deployment reality, our project uses a fully separated configuration approach:

1. **Separate Configurations for Separate Services**
   - `backend/.env` contains all backend-specific configuration
   - `frontend/.env` contains all frontend-specific configuration
   - Each service manages its own environment independently

2. **Standard Naming Conventions**
   - Backend uses standard environment variable names (e.g., `PORT=5000`)
   - Frontend uses React standard variables (with `REACT_APP_` prefix)
   - Service-specific variables are kept with their respective services

3. **Shared Configuration Values**
   - API URL in frontend must match the backend's host/port
   - These values must be manually kept in sync during development
   - This reflects the reality of deploying services independently

### Port Configuration

To avoid port conflicts between the backend and frontend servers:

#### Backend Port Configuration
- The backend server runs on port 5000 by default
- Configured in `backend/.env` via the `PORT` environment variable
- Can be overridden by modifying this value
- **IMPORTANT**: Never hardcode this port value in application code

#### Frontend Port Configuration
- The frontend React development server runs on port 3000 by default
- Configured in `frontend/package.json` via the start script
- Uses cross-env to ensure consistent port usage: `"start": "cross-env PORT=3000 react-scripts start"`
- Can also be set in `frontend/.env` via the `PORT` environment variable

#### Cross-Origin Resource Sharing (CORS)
- The backend automatically configures CORS based on environment variables
- Reads the frontend port from frontend/.env or uses a fallback value
- Dynamically generates allowed origins list for both HTTP and HTTPS
- Allows frontend to connect from any configured port without manual adjustments

#### API URL Configuration
- Frontend must use `REACT_APP_API_BASE_URL` to reference the backend API
- This value should include the backend port: `http://localhost:5000`
- When backend port changes, this value must be updated accordingly
- **IMPORTANT**: Never hardcode API URLs directly in component code

#### Why Separate Configuration Files?
- Reflects deployment reality (services will be deployed separately)
- Avoids naming conflicts (both can use standard names like `PORT`)
- Follows standard practices for each technology stack
- Maintains clean separation of concerns

### Troubleshooting Configuration Issues

#### Port Conflicts
If you see an error about a port already being in use:

1. Make sure backend and frontend are using different ports
2. Check if other applications are using your ports
3. Modify the port settings in the respective files:
   ```
   # In backend/.env
   PORT=5000  # Change to an available port
   
   # In frontend/.env
   PORT=3000  # Change to an available port
   
   # OR in frontend/package.json
   "start": "cross-env PORT=3000 react-scripts start"  # Change port number
   ```
4. Remember to update the API URL in frontend/.env if you change the backend port:
   ```
   # In frontend/.env after changing backend port to 5001
   REACT_APP_API_BASE_URL=http://localhost:5001
   ```

#### Frontend API Connection Issues
If you see `ERR_CONNECTION_REFUSED` errors in the console:

1. Verify the backend server is running
2. Check that `REACT_APP_API_BASE_URL` is set correctly in `frontend/.env`
3. Make sure the port in the URL matches the backend's port
4. Remember that React environment variables are only read when the server starts

#### CORS Issues
If you see CORS errors in the browser console:

1. Check that your frontend port is correctly configured in backend's CORS settings
2. Verify that the backend is reading the frontend port correctly
3. Try setting the `FRONTEND_PORT_FALLBACK` value in `backend/.env` to match your frontend port
4. Ensure you're accessing the frontend via a URL that matches the allowed origins

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

## Frontend Architecture

The frontend is built with React and TypeScript, structured for maintainability and scalability.

### Directory Structure

```
frontend/
├── src/
│   ├── api/                 # API service layer
│   │   ├── config.ts        # API configuration and error handling
│   │   ├── sessionApi.ts    # Session management API
│   │   ├── fileApi.ts       # File upload API
│   │   └── chatApi.ts       # Chat interaction API
│   ├── components/          # React components
│   │   ├── chat/            # Chat-related components
│   │   ├── fileUpload/      # File upload components
│   │   └── shared/          # Shared components
│   ├── contexts/            # React contexts for state management
│   │   ├── ChatContext.tsx  # Chat state management
│   │   └── FileUploadContext.tsx # File upload state management
│   ├── hooks/               # Custom React hooks
│   │   ├── api/             # API-related hooks
│   │   └── adapters/        # Legacy code adapters
│   ├── state/               # State management
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
```

### Key Features

#### 1. Centralized API Service Layer

- Separate modules for different API features (session, chat, file)
- Consistent error handling with ApiError class
- TypeScript interfaces for API requests and responses

#### 2. Component Architecture

- Components split by feature and responsibility
- Shared components for reusability
- Error boundaries for fault tolerance

#### 3. State Management

- Context-based state management with useReducer
- Custom hooks for isolating logic
- TypeScript for type safety

#### 4. Error Handling

- ErrorBoundary component for catching and displaying errors
- Consistent API error handling
- User-friendly error messages and recovery options

#### 5. Testing

- Jest for unit and integration tests
- Component tests with React Testing Library
- Mock services for isolated testing

#### 6. API Versioning

- Versioned API endpoints with `/api/v1/` prefix
- Backward compatibility with legacy routes
- Consistent URL structure across all endpoints
- Environment variable configuration for version and prefix

#### 7. Rate Limiting

- Redis-backed rate limiting for production environments
- In-memory fallback for development environments
- Configurable rate limits via environment variables
- Proper client notification for rate limit errors

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

## Environment Variables

### Backend Environment Variables

Key backend configuration variables include:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Backend server port | 5000 | No |
| API_VERSION | API version for versioned endpoints | v1 | No |
| API_PREFIX | API URL prefix for versioned endpoints | /api | No |
| REDIS_URL | Redis connection URL for rate limiting | redis://localhost:6379/0 | No |
| SESSION_RATE_LIMIT | Rate limit for session endpoints | 10/minute | No |
| FRONTEND_PORT_FALLBACK | Frontend port fallback if not specified in frontend/.env | 3000 | No |
| CORS_HOSTS | Comma-separated list of allowed CORS hosts | localhost,127.0.0.1 | No |
| POSTGRES_DB | PostgreSQL database name | - | Yes |
| POSTGRES_USER | PostgreSQL username | - | Yes |
| POSTGRES_PASSWORD | PostgreSQL password | - | Yes |
| POSTGRES_HOST | PostgreSQL host | localhost | No |
| POSTGRES_PORT | PostgreSQL port | 5432 | No |

### Frontend Environment Variables

Key frontend configuration variables include:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| REACT_APP_API_BASE_URL | Backend API base URL | http://localhost:5000 | Yes |
| REACT_APP_API_VERSION | API version for versioned endpoints | v1 | No |
| REACT_APP_API_PREFIX | API URL prefix for versioned endpoints | /api | No |
| REACT_APP_MOCK_API | Whether to use mock API | false | No |
| REACT_APP_SKIP_SESSION_VALIDATION | Skip session validation | false | No |
| REACT_APP_VERBOSE_LOGGING | Enable verbose logging | false | No |
| REACT_APP_USE_DEV_FALLBACKS | Use development fallbacks | false | No |

**Note:** React environment variables must be prefixed with `REACT_APP_` to be accessible in the application.

---

For full requirements and rationale, see `prompts/user_session.md`.
