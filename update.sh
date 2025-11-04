#!/bin/bash

# Quick update script after git pull
# Usage: ./update.sh

echo "🔄 Updating BizTrack..."

echo "📦 Installing backend dependencies..."
docker compose exec backend npm install

echo "📦 Installing frontend dependencies..."
docker compose exec frontend npm install

echo "🔄 Restarting services..."
docker compose restart

echo "✅ Update complete!"
echo "💡 If you encounter issues, run: docker compose build"
