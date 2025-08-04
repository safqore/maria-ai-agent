#!/bin/bash

# Environment Restore Script
# This script helps restore .env files from backups

echo "🔍 Available backups:"
echo "===================="

# List backend backups
echo "Backend backups:"
ls -la .env-backups/backend.env.backup.* 2>/dev/null | awk '{print $9}' | sort -r | head -5

echo ""
echo "Frontend backups:"
ls -la .env-backups/frontend.env.backup.* 2>/dev/null | awk '{print $9}' | sort -r | head -5

echo ""
echo "📋 Usage:"
echo "To restore backend: ./scripts/restore_env.sh backend <backup_filename>"
echo "To restore frontend: ./scripts/restore_env.sh frontend <backup_filename>"
echo ""
echo "Example: ./scripts/restore_env.sh backend backend.env.backup.20250731_144656"

# If arguments provided, perform restore
if [ $# -eq 2 ]; then
    TYPE=$1
    BACKUP_FILE=$2
    
    if [ "$TYPE" = "backend" ]; then
        if [ -f ".env-backups/$BACKUP_FILE" ]; then
            cp ".env-backups/$BACKUP_FILE" "backend/.env"
            echo "✅ Restored backend/.env from $BACKUP_FILE"
        else
            echo "❌ Backup file .env-backups/$BACKUP_FILE not found"
        fi
    elif [ "$TYPE" = "frontend" ]; then
        if [ -f ".env-backups/$BACKUP_FILE" ]; then
            cp ".env-backups/$BACKUP_FILE" "frontend/.env"
            echo "✅ Restored frontend/.env from $BACKUP_FILE"
        else
            echo "❌ Backup file .env-backups/$BACKUP_FILE not found"
        fi
    else
        echo "❌ Invalid type. Use 'backend' or 'frontend'"
    fi
fi 