# Maria AI Agent Project

Maria is an AI agent that autonomously creates and orchestrates other AI agents. The system features a modern React + TypeScript frontend and a modular Flask backend, enabling collaborative, multi-agent workflows through an interactive web interface.

## 🚨 Important Environment Setup

**CRITICAL**: Before running any backend commands, tests, or development tasks, you MUST activate the conda environment:

```bash
conda activate maria-ai-agent
```

This is required for:
- Running tests (`pytest`)
- Running the backend server
- Database operations
- Any Python-related development tasks

**Note for developers/AI assistants**: Always activate the conda environment before executing any backend commands.

## Quick Start

### Prerequisites
- Python 3.9+ with conda
- Node.js 16+ with npm
- Git

### 1. Environment Setup
```bash
# Clone the repository
git clone <repository-url>
cd maria-ai-agent

# Create and activate conda environment
conda create -n maria-ai-agent python=3.12.9
conda activate maria-ai-agent  # ← REQUIRED for all backend operations

# Install dependencies
make install-dev
```

### 2. Development Server
```bash
# Terminal 1 - Backend (ensure conda env is active)
conda activate maria-ai-agent
make run-backend

# Terminal 2 - Frontend
make run-frontend
```

### 3. Running Tests
```bash
# Backend tests (ensure conda env is active)
conda activate maria-ai-agent
make test-backend

# Frontend tests
make test-frontend

# Performance tests (requires PostgreSQL database setup)
# Configure your database in backend/.env first
make test-performance
```

### 4. Database Setup for Performance Testing
For running performance tests, you need a PostgreSQL database:

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE maria_ai;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE maria_ai TO postgres;
\q

# Configure database URL in backend/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/maria_ai
```

**Note**: Regular integration tests use SQLite and don't require PostgreSQL setup.

## Project Structure

- **backend/**: Modular Flask backend (see `backend/app/` for routes, utils, and db logic)
- **frontend/**: React + TypeScript client
- **requirements.txt**: Python dependencies
- **package.json**: Node.js dependencies for frontend

## Recent Updates

- **Frontend API Integration**: Implemented robust API client with correlation ID tracking, retry logic, and structured error handling
- **ChatContext API Integration**: Enhanced ChatContext with error handling, correlation ID tracking, and improved state transitions
- **State Machine Integration**: Fixed TypeScript integration between API responses and FSM state transitions
- **Type Safety Improvements**: Enhanced Message interface to properly support state transitions with nextState and nextTransition properties
- **Regression Testing**: Fixed TypeScript errors and improved test file structure
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

- Robust API client with versioned endpoints (/api/v1/ prefix)
- Structured error handling with specific error types
- Request retries with linear backoff (configurable, default: 3 attempts)
- Correlation ID tracking for request tracing and debugging
- Performance monitoring and logging for slow requests
- Separate modules for different API features (session, chat, file)
- TypeScript interfaces for API requests and responses
- Enhanced Message interface with nextState and nextTransition support

#### 2. Component Architecture

- Components split by feature and responsibility
- Shared components for reusability
- Error boundaries for fault tolerance

#### 3. State Management

- Context-based state management with useReducer
- Finite State Machine integration with API responses
- Support for both state and transition-based FSM updates
- API state tracking (loading, errors, correlation IDs)
- Type-safe FSM transitions with enhanced Typescript validation
- Custom hooks for isolating logic
- TypeScript for type safety throughout

#### 4. Error Handling

- Comprehensive API error handling with typed error responses
- Network, timeout, server, and authorization error differentiation
- Correlation ID tracking for error reporting and debugging
- User-friendly error messages based on error types
- ErrorBoundary component for catching and displaying errors
- Graceful degradation and recovery options

#### 5. Testing

- Jest for unit and integration tests
- Component tests with React Testing Library
- Mock services for isolated testing

### Architectural Decisions

This section documents key architectural decisions made during the development of the Maria AI Agent project.

#### API Client Architecture

1. **Versioned API Endpoints**
   - All endpoints are prefixed with `/api/v1/` for easier future versioning
   - Version headers are included in requests to support API versioning
   - Frontend configuration centralizes version information via environment variables

2. **Error Handling Strategy**
   - Structured `ApiError` class with type, status code, and details
   - Error types categorized as NETWORK, TIMEOUT, UNAUTHORIZED, SERVER, or UNKNOWN
   - User-friendly error messages based on error types
   - Error correlation IDs tracked and displayed for backend troubleshooting

3. **Request Retry Logic**
   - Linear backoff strategy with configurable attempts (default: 3)
   - Initial retry delay of 500ms with 500ms increments
   - Skip retries for 4xx errors except 429 (Too Many Requests)
   - Configurable timeout for long-running operations

4. **Correlation ID Tracking**
   - Server-generated correlation IDs extracted from API responses
   - Correlation IDs stored in context for debugging and support
   - Included in error logs and error reporting
   - Displayed to users when reporting issues

5. **Performance Monitoring**
   - Request/response timing captured and logged
   - Slow requests flagged for investigation
   - Performance metrics accessible via React DevTools

#### FSM Integration with API

1. **State Transition Approach**
   - API responses can include `nextTransition` (preferred) or `nextState` (legacy)
   - Transitions are type-safe with TypeScript validation
   - Direct state manipulation avoided to maintain FSM integrity
   - Centralized error handling for API-triggered transitions

2. **Message Interface Design**
   - Enhanced Message interface supports both direct state and transition-based updates
   - Type safety enforced for all state transitions
   - Legacy support maintained for backward compatibility

3. **Error Recovery**
   - FSM state preserved during API errors
   - User-friendly error messages provided based on error type
   - Automatic retry for transient errors
   - Manual retry options for persistent errors

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

### Email Verification Production Deployment

Maria AI Agent uses Gmail SMTP for email verification. Before deploying to production, ensure the following steps are completed:

#### 1. Configure Gmail SMTP in backend/.env
Add these lines to your `backend/.env` (see `backend/.env.example` for reference):
```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=noreply@safqore.com
SENDER_NAME=Maria AI Agent
SMTP_USERNAME=<your_gmail_address>
SMTP_PASSWORD=<your_gmail_app_password>
```

#### 2. Run Database Migration
Activate the conda environment and run:
```bash
conda activate maria-ai-agent
python backend/run_migrations.py
```
This will create the required email verification fields in the database.

#### 3. Verify Email Verification Workflow
- Test the end-to-end email verification flow in production.
- Ensure emails are sent and codes are validated correctly.

#### 4. Troubleshooting
- If emails are not sent, check SMTP credentials and Gmail app password.
- Review backend logs for error details.

### Backend Email Verification (Required for Production)
- `SMTP_SERVER=smtp.gmail.com`
- `SMTP_PORT=587`
- `SENDER_EMAIL=noreply@safqore.com`
- `SENDER_NAME=Maria AI Agent`
- `SMTP_USERNAME=<your-gmail-address>`
- `SMTP_PASSWORD=<your-gmail-app-password>`

Add these to `backend/.env` before deploying email verification to production.

### Database Migration
- Run `python backend/run_migrations.py` before production deployment to ensure email verification fields are present.

---

For full requirements and rationale, see `prompts/user_session.md`.
