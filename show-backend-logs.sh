#!/bin/bash

# Quick update script after git pull
# Usage: ./update.sh

echo "Backend Logs:"
sudo docker compose logs backend
echo "-------------------------"