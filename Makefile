.PHONY: help install-dev format lint test run-backend run-frontend clean git-commit git-status git-add

help:
	@echo "Available commands:"
	@echo "  install-dev   - Install development dependencies"
	@echo "  format        - Format code (Python and JavaScript/TypeScript)"
	@echo "  lint          - Run linters (Python and JavaScript/TypeScript)"
	@echo "  test          - Run tests (Python and JavaScript/TypeScript)"
	@echo "  run-backend   - Run the Flask backend server"
	@echo "  run-frontend  - Run the React frontend development server"
	@echo "  clean         - Clean temporary files and caches"
	@echo "  git-status    - Run git status with correct locale settings"
	@echo "  git-add       - Run git add with correct locale settings (use: make git-add FILES='file1 file2')"
	@echo "  git-commit    - Run git commit with correct locale settings (use: make git-commit MESSAGE='commit message')"

install-dev:
	pip install -r requirements.txt
	cd frontend && npm install

format:
	black backend/
	isort backend/
	cd frontend && npm run format

lint:
	flake8 backend/
	mypy backend/
	cd frontend && npm run lint

test:
	pytest backend/
	cd frontend && npm test

run-backend:
	python backend/wsgi.py

run-frontend:
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
