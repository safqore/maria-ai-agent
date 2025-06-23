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
- **Frontend**: The frontend is built using React with TypeScript. It includes components for chat functionality, state management using a finite state machine, and file upload capabilities.
- **Backend**: The backend uses Flask.
- **Frontend/Backend Integration**: The frontend and backend will be deployed to different servers/services. All backend URLs in the frontend code must be specified via configuration (e.g., environment variables or config files), not hardcoded. There must be no hard dependencies between frontend and backend code.
- **Development Workflow**: Ensure that the frontend and backend are developed in parallel, with clear integration points. After frontend development, prioritize code cleanup and optimization.
- **Environment Setup**: Use the provided requirements.txt and package.json files to set up the Python and Node.js environments, respectively. Follow the README for detailed setup instructions.

## Project Folder Structure
The project is organized into the following structure:

Maria AI Agent Project
.env                                       # Environment variables for the project
.gitignore                                 # Git ignore file to exclude specific files/folders from version control
README.md                                  # Project overview and setup instructions
requirements.txt                           # Python dependencies for the backend
requirements/                              # Requirements documentation and images
backend/                                   # Flask backend
    app.py                                 # Main Flask app entry point
frontend/                                  # React frontend (TypeScript)
    package.json                           # Node.js dependencies and scripts
    tsconfig.json                          # TypeScript configuration
    public/                                # Public assets for the React frontend
    src/                                   # Source code for React frontend
        App.tsx                            # Main React app component
        components/                        # Reusable React components
        hooks/                             # Custom React hooks
        state/                             # State management logic
        utils/                             # Utility functions
        ...                                # Other frontend files