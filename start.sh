#!/bin/bash

# RePhraseAI Startup Script
# This script starts both the backend and frontend servers

echo "🚀 Starting RePhraseAI..."
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup SIGINT SIGTERM

# Check if backend virtual environment exists
if [ ! -d "$SCRIPT_DIR/backend/venv" ]; then
    echo "${YELLOW}⚠️  Backend virtual environment not found. Creating...${NC}"
    cd "$SCRIPT_DIR/backend"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd "$SCRIPT_DIR"
fi

# Check if frontend node_modules exists
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo "${YELLOW}⚠️  Frontend dependencies not found. Installing...${NC}"
    cd "$SCRIPT_DIR/frontend"
    npm install
    cd "$SCRIPT_DIR"
fi

# Kill any existing servers on ports 5000 and 5847
echo "${BLUE}🔍 Checking for existing servers...${NC}"
lsof -ti:5000 | xargs kill -9 2>/dev/null
lsof -ti:5847 | xargs kill -9 2>/dev/null
sleep 1

# Start backend server
echo "${BLUE}📦 Starting backend server...${NC}"
cd "$SCRIPT_DIR/backend"
source venv/bin/activate
python app.py > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# Wait for backend to start
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "${YELLOW}❌ Failed to start backend server${NC}"
    echo "${YELLOW}   Check backend.log for errors${NC}"
    tail -20 "$SCRIPT_DIR/backend.log"
    exit 1
fi

# Check if backend is responding
if ! curl -s http://localhost:5000/api/models > /dev/null 2>&1; then
    echo "${YELLOW}⚠️  Backend started but not responding yet, waiting...${NC}"
    sleep 2
fi

echo "${GREEN}✅ Backend server started (PID: $BACKEND_PID)${NC}"
echo "${GREEN}   Running at: http://localhost:5000${NC}"
echo ""

# Start frontend server
echo "${BLUE}🎨 Starting frontend server...${NC}"
cd "$SCRIPT_DIR/frontend"
npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

# Wait for frontend to start
sleep 4

# Check if frontend is running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "${YELLOW}❌ Failed to start frontend server${NC}"
    echo "${YELLOW}   Check frontend.log for errors${NC}"
    tail -20 "$SCRIPT_DIR/frontend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "${GREEN}✅ Frontend server started (PID: $FRONTEND_PID)${NC}"
echo "${GREEN}   Running at: http://localhost:5847${NC}"
echo ""
echo "${GREEN}🎉 RePhraseAI is ready!${NC}"
echo "${BLUE}   Open http://localhost:5847 in your browser${NC}"
echo ""
echo "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Keep script running and wait for both processes
wait $BACKEND_PID $FRONTEND_PID
