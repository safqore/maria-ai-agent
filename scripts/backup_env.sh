#!/bin/bash

# Environment Backup Script
# This script creates timestamped backups of .env files

# Create backup directory if it doesn't exist
mkdir -p .env-backups

# Get current timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup backend .env if it exists
if [ -f "backend/.env" ]; then
    cp backend/.env ".env-backups/backend.env.backup.${TIMESTAMP}"
    echo "✅ Backed up backend/.env to .env-backups/backend.env.backup.${TIMESTAMP}"
else
    echo "⚠️  backend/.env not found"
fi

# Backup frontend .env if it exists
if [ -f "frontend/.env" ]; then
    cp frontend/.env ".env-backups/frontend.env.backup.${TIMESTAMP}"
    echo "✅ Backed up frontend/.env to .env-backups/frontend.env.backup.${TIMESTAMP}"
else
    echo "⚠️  frontend/.env not found"
fi

# Keep only the last 10 backups (optional cleanup)
echo "📊 Current backups:"
ls -la .env-backups/ | grep "\.backup\." | wc -l | xargs echo "Total backup files:"

echo "🎉 Backup completed at $(date)" 