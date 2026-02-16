#!/bin/bash

# Define python path
PYTHON_EXEC="./.venv/bin/python"

# Check if venv exists
if [ ! -f "$PYTHON_EXEC" ]; then
    echo "Error: Virtual environment not found at .venv"
    echo "Please run: python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Run preparation phase
echo "Running Preparation Phase..."
$PYTHON_EXEC main.py || { echo "Preparation Phase failed. Exiting."; exit 1; }

# Start backend server in the background
echo "Starting Backend..."
$PYTHON_EXEC app.py > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to start (this may take a few moments)..."
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8000/health | grep -q "healthy"; then
        echo "Backend is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo " Warning: Backend health check timed out. Proceeding anyway..."
fi

# Function to cleanup backend on exit
cleanup() {
    echo ""
    echo "Shutting down backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID
    exit
}

# Trap SIGINT (Ctrl+C) and EXIT
trap cleanup SIGINT EXIT

# Setup and start frontend
echo "Starting Frontend..."
cd frontend || exit
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting Frontend Dev Server..."
npm run dev
