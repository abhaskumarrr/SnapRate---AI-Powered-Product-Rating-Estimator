#!/bin/bash

# SnapRate - Run Frontend and Backend Script
# This script starts both the React frontend and FastAPI backend servers

echo "🚀 Starting SnapRate - AI-Powered Product Rating Estimator"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    if port_in_use $1; then
        echo -e "${YELLOW}Killing existing process on port $1...${NC}"
        lsof -ti :$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Check for required commands
echo -e "${BLUE}Checking dependencies...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3 first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All dependencies found${NC}"

# Kill any existing processes on our ports
kill_port 3000
kill_port 8000

# Install frontend dependencies if needed
echo -e "${BLUE}Checking frontend dependencies...${NC}"
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
fi

# Install backend dependencies if needed
echo -e "${BLUE}Checking backend dependencies...${NC}"
if [ ! -d "backend/venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    cd backend && python3 -m venv venv && cd ..
fi

# Activate virtual environment and install dependencies
echo -e "${YELLOW}Setting up backend environment...${NC}"
cd backend
source venv/bin/activate
pip install -r requirements.txt 2>/dev/null || echo -e "${YELLOW}Some packages may already be installed${NC}"
cd ..

# Function to start backend
start_backend() {
    echo -e "${BLUE}🔧 Starting FastAPI Backend Server...${NC}"
    cd backend
    source venv/bin/activate
    python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ Backend server starting on http://localhost:8000${NC}"
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}⚛️  Starting React Frontend Server...${NC}"
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ Frontend server starting on http://localhost:3000${NC}"
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    kill_port 3000
    kill_port 8000
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start both servers
echo -e "\n${BLUE}🚀 Starting SnapRate servers...${NC}"
start_backend
sleep 3
start_frontend

# Wait a moment for servers to start
sleep 5

# Display status
echo -e "\n${GREEN}🎉 SnapRate is now running!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}📱 Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "${GREEN}🔧 Backend:  ${BLUE}http://localhost:8000${NC}"
echo -e "${GREEN}📚 API Docs: ${BLUE}http://localhost:8000/docs${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Keep script running and wait for user to stop
wait