# Maria AI Agent Makefile
# 
# IMPORTANT: Activate conda environment before running backend commands:
#   conda activate maria-ai-agent
#
# This is required for all backend operations (tests, server, database, etc.)

.PHONY: help install-dev format lint test run-backend run-frontend clean git-commit git-status git-add

help: ## Show help message
	@echo "Maria AI Agent - Development Commands"
	@echo ""
	@echo "⚠️  IMPORTANT: Run 'conda activate maria-ai-agent' before backend commands"
	@echo ""
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-dev:
	pip install -r requirements.txt
	cd frontend && npm install
	@echo "\nConfiguration Setup:"
	@echo "  - Copy backend/.env.example to backend/.env and customize"
	@echo "  - Copy frontend/.env.example to frontend/.env and customize"

format:
	black backend/
	isort backend/
	cd frontend && npm run format

lint:
	flake8 backend/
	mypy backend/
	cd frontend && npm run lint

test: ## Run all tests (requires: conda activate maria-ai-agent)
	pytest backend/
	cd frontend && npm test

run-backend: ## Run Flask backend server (requires: conda activate maria-ai-agent)
	cd backend && python wsgi.py

run-frontend: ## Run React frontend development server
	cd frontend && npm start

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name .pytest_cache -exec rm -rf {} +
	find . -type d -name .mypy_cache -exec rm -rf {} +
	rm -rf .coverage
	rm -rf htmlcov
	rm -rf frontend/node_modules
	rm -rf frontend/build

# Git commands with proper locale settings
git-status:
	LC_ALL=C.UTF-8 LANG=C.UTF-8 git status

git-add:
	LC_ALL=C.UTF-8 LANG=C.UTF-8 git add $(FILES)

git-commit:
	LC_ALL=C.UTF-8 LANG=C.UTF-8 git commit -m "$(MESSAGE)"
