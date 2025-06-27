# Maria AI Agent Refactoring Project

This document serves as the central reference for the Maria AI Agent refactoring project. Last updated on June 27, 2025.

## Documentation Structure

**This folder follows a strict 6-file structure:**
- [README.md](./README.md) - Overview and main documentation (this file)
- [index.md](./index.md) - Central entry point with navigation links
- [plan.md](./plan.md) - Implementation plans and strategies
- [next-steps.md](./next-steps.md) - Upcoming tasks and priorities
- [testing.md](./testing.md) - Testing strategies and procedures
- [tracking.md](./tracking.md) - Progress tracking and milestones

**IMPORTANT:** Do not create additional files in this folder. When adding new content, update one of the six files above based on the content type. This keeps documentation organized and prevents folder bloat.

**Code Examples:** All code examples, implementation details, and sample patterns must be included directly in these six core files. Do not create separate files or subfolders (like `/examples`) for code samples or other documentation. Include relevant sample code in the appropriate section of one of the core files.

## Goals

- Improve code organization, maintainability, and adherence to best practices
- Make the codebase more extendable and easier to understand for future development
- Maintain functional behavior throughout the refactoring process

## Implementation Phases

### Phase 1: Setup and Preparation (Weeks 1-2) ✅
- Set up linting and formatting ✅
- Improve documentation ✅
- Prepare testing infrastructure ✅

### Phase 2: Backend Improvements - Lower Risk (Weeks 3-5) ✅
- Create service layer ✅
- Implement centralized error handling ✅
- Add request validation ✅

### Phase 3: Frontend Improvements - Lower Risk (Weeks 6-8) ✅
- Refactor component structure ✅
- Implement state management ✅
- Add better error handling ✅

### Phase 4: Backend Improvements - Higher Risk (June 27 - July 10, 2025) ⏳
- SQLAlchemy ORM Implementation ✅
- Improve Route Organization ⏳

### Phase 5: Context and Global State Refinements (June 26-30, 2025) ⏳
- Finalize ChatContext and Adapters ✅
- Consolidate Context Interfaces ✅

## Major Architectural Components

### ORM and Repository Pattern
- SQLAlchemy ORM with repository pattern implementation
- Generic BaseRepository with type-safe operations
- TransactionContext for improved transaction handling

### Flask Blueprint Structure
- Session Blueprint (session_bp) with proper versioning
- Upload Blueprint (upload_bp) for file management
- API versioning support in app_factory.py

### Frontend State Management
- React Context API with state adapters
- Finite State Machine integration with React

## Current Status Summary

The project is currently in Phase 4, with SQLAlchemy ORM implementation complete and route organization improvements in progress. Phase 5 frontend improvements are also ongoing in parallel.

For detailed current status, see [tracking.md](./tracking.md).
For upcoming tasks, see [next-steps.md](./next-steps.md).
For testing information, see [testing.md](./testing.md).
For detailed implementation plans, see [plan.md](./plan.md).
