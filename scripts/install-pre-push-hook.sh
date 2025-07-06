#!/bin/bash

# Install pre-push hook script
# This script sets up the pre-push hook that runs CI checks locally

set -e

echo "🔧 Installing pre-push hook..."
echo "==============================="

# Get the root directory of the project
PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy the pre-push hook script
cp scripts/pre-push-hook.sh .git/hooks/pre-push

# Make the hook executable
chmod +x .git/hooks/pre-push

echo "✅ Pre-push hook installed successfully!"
echo ""
echo "The hook will now run automatically before every git push."
echo "It will:"
echo "• Run Black formatting check (backend)"
echo "• Run Flake8 linting (backend)"
echo "• Run Pytest tests (backend)"
echo "• Run Prettier formatting check (frontend)"
echo "• Run ESLint linting (frontend)"
echo "• Run Jest tests (frontend)"
echo "• Run build validation (frontend)"
echo ""
echo "If any check fails, the push will be blocked."
echo ""
echo "To bypass the hook (not recommended):"
echo "  git push --no-verify"
echo ""
echo "To test the hook without pushing:"
echo "  bash scripts/pre-push-hook.sh"
echo ""
echo "To uninstall the hook:"
echo "  rm .git/hooks/pre-push" 