#!/bin/bash

echo "Starting Rogame Development Environment..."
echo "========================================="

# Check if node_modules exist in server directory
if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd server && npm install && cd ..
fi

# Check if .env file exists in server directory
if [ ! -f "server/.env" ]; then
    echo ""
    echo "⚠️  WARNING: No .env file found in server directory!"
    echo "Please copy server/.env.example to server/.env and configure your cloud provider credentials."
    echo ""
fi

# Start all services
echo "Starting services..."
echo "1. Frontend (Vite) - http://localhost:1420"
echo "2. Cloud Server (Node.js) - http://localhost:3001"
echo "3. Tauri Backend"
echo ""

npm run dev:all