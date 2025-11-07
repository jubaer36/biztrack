#!/bin/bash

# Quick update script after git pull
# Usage: ./update.sh

echo "🔄 Updating BizTrack..."

echo "📦 Installing backend dependencies..."
sudo docker compose exec backend npm install


echo "📦 Installing frontend dependencies..."
sudo docker compose exec frontend npm install

echo "🔄 Restarting services..."
sudo docker compose restart

echo "✅ Update complete!"
echo "💡 If you encounter issues, run: sudo docker compose build"
