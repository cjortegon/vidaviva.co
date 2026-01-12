#!/bin/bash

# Kill existing processes
lsof -ti:3004 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

echo ""
echo "🚀 Starting development environment..."
echo ""

# Start backend server in background
echo "📡 Starting backend server on http://localhost:8000"
cd backend/
node server.js &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Start frontend server in background
echo "🌐 Starting frontend server on http://localhost:3004"
cd frontend/
node server.js &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Servers started successfully!"
echo "   - Frontend: http://localhost:3004"
echo "   - Backend:  http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait
