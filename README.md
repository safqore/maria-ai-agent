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

- To run the backend Flask app (new entry point):

```bash
cd backend
python wsgi.py
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
