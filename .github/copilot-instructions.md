# Custom Instructions for GitHub Copilot

## Code Generation Instructions
- Always use descriptive variable names.
- Follow PEP 8 style guidelines for Python code.
- Use functional components for React development.
- For React, use TypeScript and ensure type safety.
- For backend development, adhere to Flask best practices and modularize code where possible.

## Test Generation Instructions
- Always use pytest for Python testing.
- Use Jest for JavaScript/TypeScript testing.
- Ensure all tests include edge cases and cover both frontend and backend functionality.
- Mock external dependencies like APIs or databases during testing.

## Code Review Instructions
- Check for adherence to coding standards (PEP 8 for Python, ESLint for React/TypeScript).
- Ensure proper error handling is implemented in both frontend and backend.
- Verify that all functions and components have appropriate docstrings or comments.
- Ensure React components are optimized and reusable.

## Commit Message Generation Instructions
- Use imperative mood in commit messages (e.g., "Add feature" instead of "Added feature").
- Include a brief description of the change and its purpose.
- Reference related issues or tasks where applicable.

## Pull Request Description Generation Instructions
- Summarize the changes made in the pull request.
- Include references to any related issues or tasks.
- Provide testing instructions if applicable.

## Documentation Instructions
- All project documentation must be consolidated in the root `README.md` file.
- Do not create or update additional README files in subdirectories (e.g., backend/README-api-session.md).
- When updating documentation, always refer to and update the main `README.md`.
- Remove or migrate any new documentation from other locations to the main `README.md` as part of your changes.

## Project-Specific Notes
- **Frontend**: The frontend is built using React with TypeScript. It includes components for chat functionality, state management using a finite state machine with React Context integration, and file upload capabilities.
- **Backend**: The backend uses Flask with a service-oriented architecture, centralized error handling, and request validation using Marshmallow.
- **Frontend/Backend Integration**: The frontend and backend will be deployed to different servers/services. All backend URLs in the frontend code must be specified via configuration (e.g., environment variables or config files), not hardcoded. There must be no hard dependencies between frontend and backend code.
- **Development Workflow**: Use the incremental approach for refactoring, making small changes that are easy to debug. Test thoroughly after each change. Follow the refactoring plan documented in the project.
- **Environment Setup**: Use the provided requirements.txt and package.json files to set up the Python and Node.js environments, respectively. Follow the README for detailed setup instructions.

## Environment Configuration Best Practices
- Maintain separate configuration files for frontend (`frontend/.env`) and backend (`backend/.env`) services
- Use standard naming conventions for each platform (e.g., `PORT` for backend, `REACT_APP_` prefix for React)
- For React applications, set the development server port in package.json scripts using cross-env
- Ensure all environment variables are documented in the main README.md
- Keep example .env.example files updated in both frontend/ and backend/ directories
- Remember that the frontend and backend will be deployed separately, so their configurations should be independent

## Project Folder Structure
The project is organized into the following structure:

Maria AI Agent Project
├── .env                                   # Environment variables for the project
├── .github/                               # GitHub-related configuration
├── .gitignore                             # Git ignore file
├── Makefile                               # Development and build commands
├── README.md                              # Project overview and setup instructions
├── pyproject.toml                         # Python project configuration
├── refactor/                              # Refactoring documentation and planning
├── requirements.txt                       # Python dependencies for the backend
├── requirements/                          # Requirements documentation and images
├── backend/                               # Flask backend
│   ├── config.py                          # Backend configuration
│   ├── wsgi.py                            # WSGI application entrypoint
│   ├── app/                               # Main application package
│   │   ├── __init__.py                    # App initialization
│   │   ├── db.py                          # Database connections
│   │   ├── errors.py                      # Centralized error handling
│   │   ├── routes/                        # API routes
│   │   ├── schemas/                       # Request/response validation schemas
│   │   ├── services/                      # Business logic services
│   │   └── utils/                         # Utility functions
│   ├── migrations/                        # Database migrations
│   └── tests/                             # Backend tests
└── frontend/                              # React frontend (TypeScript)
    ├── package.json                       # Node.js dependencies and scripts
    ├── tsconfig.json                      # TypeScript configuration
    ├── jest.config.js                     # Jest test configuration
    ├── public/                            # Public assets
    └── src/                               # Source code
        ├── App.tsx                        # Main React app component
        ├── index.tsx                      # Application entry point
        ├── api/                           # API service layer
        ├── components/                    # Reusable React components
        ├── contexts/                      # React Context providers
        ├── hooks/                         # Custom React hooks
        │   └── adapters/                  # State machine adapters
        ├── state/                         # State management logic
        ├── types/                         # TypeScript type definitions
        └── utils/                         # Utility functions
