#!/bin/bash

# Pre-push hook to run CI pipeline locally
# This script runs the same checks as the GitHub Actions CI pipeline
# If any check fails, the push is prevented

set -e  # Exit on any error

echo "🚀 Running pre-push CI checks..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to run a command and capture its output
run_check() {
    local description="$1"
    local command="$2"
    local working_dir="$3"
    
    echo -e "\n${YELLOW}Running:${NC} $description"
    echo "Command: $command"
    echo "Working directory: $working_dir"
    
    if [ -n "$working_dir" ]; then
        cd "$working_dir"
    fi
    
    if eval "$command"; then
        print_status "$description"
        cd - > /dev/null 2>&1 || true
        return 0
    else
        print_error "$description"
        cd - > /dev/null 2>&1 || true
        return 1
    fi
}

# Get the root directory of the project
PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

# Track overall success
OVERALL_SUCCESS=true

# Backend CI Checks
echo -e "\n${GREEN}=== BACKEND CI CHECKS ===${NC}"

# Check if conda environment is activated
if [[ "$CONDA_DEFAULT_ENV" != "maria-ai-agent" ]]; then
    print_warning "Conda environment 'maria-ai-agent' is not activated."
    print_warning "Please run: conda activate maria-ai-agent"
    print_warning "Continuing with system Python..."
fi

# Check Python version
python_version=$(python --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1-2)
if [[ "$python_version" != "3.13" && "$python_version" != "3.9" ]]; then
    print_warning "Python version is $python_version, CI uses 3.13"
fi

# Backend formatting check
if ! run_check "Backend formatting (Black)" "black --check ." "$PROJECT_ROOT/backend"; then
    print_error "Backend formatting check failed!"
    echo "To fix: cd backend && black ."
    OVERALL_SUCCESS=false
fi

# Backend linting
if ! run_check "Backend linting (Flake8)" "flake8 ." "$PROJECT_ROOT/backend"; then
    print_error "Backend linting failed!"
    echo "Fix the linting issues before pushing"
    OVERALL_SUCCESS=false
fi

# Backend tests
if ! run_check "Backend tests (Pytest)" "pytest -v" "$PROJECT_ROOT/backend"; then
    print_error "Backend tests failed!"
    echo "Fix the failing tests before pushing"
    OVERALL_SUCCESS=false
fi

# Frontend CI Checks
echo -e "\n${GREEN}=== FRONTEND CI CHECKS ===${NC}"

# Check Node.js version
node_version=$(node --version 2>&1 | cut -d'.' -f1 | cut -d'v' -f2)
if [[ "$node_version" != "20" ]]; then
    print_warning "Node.js version is v$node_version, CI uses v20"
fi

# Frontend formatting check
if ! run_check "Frontend formatting (Prettier)" "npx prettier --check \"src/**/*.{ts,tsx}\"" "$PROJECT_ROOT/frontend"; then
    print_error "Frontend formatting check failed!"
    echo "To fix: cd frontend && npm run format"
    OVERALL_SUCCESS=false
fi

# Frontend linting
if ! run_check "Frontend linting (ESLint)" "npm run lint" "$PROJECT_ROOT/frontend"; then
    print_error "Frontend linting failed!"
    echo "Fix the linting issues before pushing"
    OVERALL_SUCCESS=false
fi

# Frontend tests
if ! run_check "Frontend tests (Jest)" "npm test -- --watchAll=false" "$PROJECT_ROOT/frontend"; then
    print_error "Frontend tests failed!"
    echo "Fix the failing tests before pushing"
    OVERALL_SUCCESS=false
fi

# Frontend build
if ! run_check "Frontend build" "npm run build" "$PROJECT_ROOT/frontend"; then
    print_error "Frontend build failed!"
    echo "Fix the build issues before pushing"
    OVERALL_SUCCESS=false
fi

# Summary
echo -e "\n${GREEN}=== SUMMARY ===${NC}"
if [ "$OVERALL_SUCCESS" = true ]; then
    print_status "All CI checks passed! ✨"
    echo -e "${GREEN}🎉 Push will proceed...${NC}"
    exit 0
else
    print_error "Some CI checks failed! ❌"
    echo -e "${RED}🚫 Push blocked. Please fix the issues above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "• Format code: make format"
    echo "• Run tests: make test"
    echo "• Check individual issues listed above"
    exit 1
fi 