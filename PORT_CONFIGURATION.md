# Port Configuration Guide for Maria AI Agent

## Port Setup

To avoid port conflicts between the backend and frontend servers, we use separate configuration files for each service.

### Backend Configuration
The backend server should run on port 5000 by default. This is configured in:
- The `backend/.env` file (via the standard `PORT` environment variable)
- Can be overridden with the `--port` command line argument when running the backend

### Frontend Configuration
The frontend React development server should run on port 3000. This is configured in:
- The `frontend/package.json` start script (via `cross-env PORT=3000`)
- The API connection URL is configured via `REACT_APP_API_BASE_URL` environment variable in `frontend/.env`

## Why Use Separate Configuration Files?

We use separate `.env` files for frontend and backend because:

1. It reflects the deployment reality (these services will be deployed separately)
2. It avoids naming conflicts (both can use standard names like `PORT` without conflicts)
3. It follows standard practices for each technology stack
4. It maintains a clean separation of concerns

## Troubleshooting Port Conflicts

If you see an error about a port already being in use:

1. Make sure your backend and frontend are using different ports
2. Check if any other applications are using the required ports
3. Modify the port settings in the respective `.env` files:
   ```
   # In backend/.env
   PORT=5000  # Change to an available port
   
   # In frontend/.env
   PORT=3000  # Change to an available port
   ```
4. Remember to update the API URL if you change the backend port
5. Check your environment variables (run `env | grep PORT` to check for any overrides)

## Frontend API Connection Issues

If you see `ERR_CONNECTION_REFUSED` errors in the console:

1. Verify the backend server is running
2. Check that `REACT_APP_API_BASE_URL` is set correctly in `frontend/.env` file
3. Make sure the port in the URL matches the port your backend is running on (default: `PORT=5000` in `backend/.env`)
4. Remember that React environment variables are only read when the server starts - restart after changes

## React Environment Variables Special Handling

React's development server has specific environment variable handling rules:

1. The `PORT` environment variable is special and is used by the development server itself
2. Variable priority in React projects follows this order:
   - System environment variables set when running the command (highest priority)
   - `.env.development.local`
   - `.env.local`
   - `.env.development`
   - `.env` (lowest priority)

Because of these rules, we've updated the `make run-frontend` command to explicitly set `PORT=3000` when running the server, ensuring it always uses the correct port regardless of environment configuration.

## Separated Environment Configuration

We've adopted a fully separated configuration approach:

1. `backend/.env` contains all backend-specific configuration
2. `frontend/.env` contains all frontend-specific configuration
3. Each service uses standard environment variable names for its platform

This approach prevents configuration conflicts and better reflects the deployment reality.

## Running Both Servers
To run both servers correctly:

```bash
# Terminal 1 - Backend
make run-backend

# Terminal 2 - Frontend
make run-frontend  # This will automatically use PORT=3000
```

This ensures that both services run on their designated ports without conflicts.
