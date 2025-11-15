#!/bin/bash

echo "🚀 Starting NomadNet Application..."
echo ""

# Start Backend
echo "📡 Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Frontend
echo "🎨 Starting Frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ NomadNet is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 Frontend: http://localhost:3000"
echo "📡 Backend:  http://localhost:5000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all servers"

# Trap Ctrl+C
trap "echo ''; echo '👋 Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait
wait