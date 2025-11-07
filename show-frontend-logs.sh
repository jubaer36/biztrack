#!/bin/bash

# Quick update script after git pull
# Usage: ./update.sh

echo "Frontend Logs:"
sudo docker compose logs frontend
echo "-------------------------"