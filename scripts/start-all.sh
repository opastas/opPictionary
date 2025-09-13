#!/bin/bash

# Pictionary Game - Start All Services Script

echo "🎮 Starting Pictionary Game Services..."
echo "======================================"

# Function to check if port is in use
check_port() {
    if lsof -ti:$1 >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to find available port
find_available_port() {
    local start_port=$1
    local port=$start_port
    
    while check_port $port; do
        port=$((port + 1))
    done
    
    echo $port
}

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "tsx.*src/index.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "expo" 2>/dev/null || true

# Wait a moment for processes to clean up
sleep 2

# Start server
echo "🚀 Starting server on port 4000..."
cd /Users/opastas/Dev/pictionary
source /Users/opastas/.zshrc
pnpm --filter server dev &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ! check_port 4000; then
    echo "❌ Failed to start server"
    exit 1
fi

echo "✅ Server started successfully"

# Start web app
echo "🌐 Starting web app..."
pnpm --filter web dev &
WEB_PID=$!

# Wait for web app to start
sleep 5

# Check if web app is running on any of the common ports
ACTUAL_WEB_PORT=""
for port in 5173 5174 5175 5176; do
    if check_port $port; then
        ACTUAL_WEB_PORT=$port
        break
    fi
done

if [ -z "$ACTUAL_WEB_PORT" ]; then
    echo "❌ Failed to start web app"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Web app started successfully on port $ACTUAL_WEB_PORT"

# Start mobile app
echo "📱 Starting mobile app..."
pnpm --filter mobile start &
MOBILE_PID=$!

# Wait for mobile app to start
sleep 5

# Check if mobile app is running on any of the common ports
ACTUAL_MOBILE_PORT=""
for port in 8081 8082 8083 8084; do
    if check_port $port; then
        ACTUAL_MOBILE_PORT=$port
        break
    fi
done

if [ -z "$ACTUAL_MOBILE_PORT" ]; then
    echo "⚠️  Mobile app may not be running on expected port"
    ACTUAL_MOBILE_PORT="8081"  # Default fallback
fi

echo "✅ Mobile app started on port $ACTUAL_MOBILE_PORT"

echo ""
echo "🎉 All services started successfully!"
echo "======================================"
echo "📊 Service Status:"
echo "   Server:  http://192.168.1.13:4000"
echo "   Web:     http://192.168.1.13:$ACTUAL_WEB_PORT"
echo "   Mobile:  exp://192.168.1.13:$ACTUAL_MOBILE_PORT"
echo ""
echo "🔗 Access URLs:"
echo "   Web App:    http://192.168.1.13:$ACTUAL_WEB_PORT"
echo "   Mobile:     Scan QR code in terminal"
echo "   Server API: http://192.168.1.13:4000/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $SERVER_PID 2>/dev/null || true
    kill $WEB_PID 2>/dev/null || true
    kill $MOBILE_PID 2>/dev/null || true
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
