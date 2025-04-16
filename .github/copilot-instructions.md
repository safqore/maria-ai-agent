# Custom Instructions for GitHub Copilot

## Code Generation Instructions
- Always use descriptive variable names.
- Follow PEP 8 style guidelines for Python code.
- Use functional components for React development.
- For React, use TypeScript and ensure type safety.
- For backend development, adhere to Flask best practices and modularize code where possible.
- For agentic capabilities, leverage crewAI's tools and configurations effectively.

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
- Confirm that crewAI configurations (agents.yaml, tasks.yaml) are well-documented and logically structured.

## Commit Message Generation Instructions
- Use imperative mood in commit messages (e.g., "Add feature" instead of "Added feature").
- Include a brief description of the change and its purpose.
- Reference related issues or tasks where applicable.

## Pull Request Description Generation Instructions
- Summarize the changes made in the pull request.
- Include references to any related issues or tasks.
- Provide testing instructions if applicable.

## Project-Specific Notes
- **Frontend**: The frontend is built using React with TypeScript. It includes components for chat functionality, state management using a finite state machine, and file upload capabilities. Once development is complete, a code cleanup will be performed to ensure maintainability.
- **Backend**: The backend uses Flask and crewAI for agentic capabilities. It includes configurations for agents and tasks, as well as a modular structure for controllers, models, and routes.
- **Agentic Capabilities**: The project leverages crewAI to define agents and tasks. Configurations are stored in YAML files, and the crew.py file orchestrates the agents and tasks.
- **Development Workflow**: Ensure that the frontend and backend are developed in parallel, with clear integration points. After frontend development, prioritize code cleanup and optimization.
- **Environment Setup**: Use the provided requirements.txt and package.json files to set up the Python and Node.js environments, respectively. Follow the README for detailed setup instructions.