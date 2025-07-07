# Configuration Strategy for Maria AI Agent

To simplify the project configuration and better reflect the deployment reality, we've adopted a fully separated configuration approach.

## 1. Separate Configurations for Separate Services

Each service (frontend and backend) has its own independent configuration:
- `backend/.env` for backend-specific configuration
- `frontend/.env` for frontend-specific configuration

## 2. Clear and Standard Configuration Names

- Backend uses standard environment variable names (e.g., `PORT=5000`)
- Frontend uses React standard environment variables (e.g., `PORT=3000`, `REACT_APP_*`)
- Service-specific variables are kept with their respective services

## 3. Configuration Loading

- Backend: Loads variables from its own `backend/.env` file
- Frontend: Loads variables from its own `frontend/.env` file
- No cross-service configuration sharing or propagation

## 4. Development vs Production

- Use `.env.development`, `.env.production`, etc. within each service directory as needed
- Follow the standard patterns for each technology stack
- Use command-line arguments for temporary overrides

## 5. Shared Configuration Values

Some values need to be coordinated between services:
- API URL in frontend must match the backend's host/port
- These values must be manually kept in sync during development and deployment
- This reflects the reality of deploying these services independently

## 6. Example Files

Both services have `.env.example` files showing required configuration:
- `backend/.env.example` - Template for backend configuration
- `frontend/.env.example` - Template for frontend configuration

This approach ensures a clean separation of concerns, better reflects deployment reality, and follows standard practices for each technology stack.
