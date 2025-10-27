#!/bin/bash

# Start RePhraseAI Backend Server

# Check if GATEWAY_API_KEY is set
if [ -z "$GATEWAY_API_KEY" ]; then
    echo "Error: GATEWAY_API_KEY environment variable is not set"
    echo "Please set it using: export GATEWAY_API_KEY=your-api-key"
    exit 1
fi

echo "Starting RePhraseAI Backend..."
echo "Using custom LLM API Gateway"

cd backend

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "Virtual environment activated"
else
    echo "Warning: Virtual environment not found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

# Start the Flask server
echo "Starting Flask server on http://localhost:5000"
python3 app.py
