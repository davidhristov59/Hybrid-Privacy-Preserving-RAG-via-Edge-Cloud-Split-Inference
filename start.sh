#!/bin/bash

# Define python path
PYTHON_EXEC="./.venv/bin/python"

# Check if venv exists
if [ ! -f "$PYTHON_EXEC" ]; then
    echo "Error: Virtual environment not found at .venv"
    echo "Please run: python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# 1. Preparation Phase
echo "Running Preparation Phase..."
$PYTHON_EXEC main.py || { echo "Preparation Phase failed. Exiting."; exit 1; }

# 2. Start Backend
echo "Starting Backend (logging to backend.log)..."
$PYTHON_EXEC app.py > backend.log 2>&1 &
BACKEND_PID=$!

# Function to cleanup backend on exit
cleanup() {
    echo ""
    echo "Shutting down backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    exit
}
trap cleanup SIGINT EXIT

# 3. Wait for Backend
echo "Waiting for backend health check (up to 60s)..."
RETRIES=0
while [ $RETRIES -lt 30 ]; do
    if curl -s http://localhost:8000/health | grep -q "healthy"; then
        echo "Backend is ready!"
        break
    fi
    RETRIES=$((RETRIES + 1))
    sleep 2
done

# 4. Start Frontend
echo "Starting Frontend..."
cd frontend || exit
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting Frontend Dev Server..."
npm run dev
