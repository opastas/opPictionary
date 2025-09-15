#!/bin/bash

# Pictionary Server Manager Script

case "$1" in
    "start")
        echo "🚀 Starting Pictionary server..."
        # Kill any existing processes on port 4000
        lsof -ti:4000 | xargs kill -9 2>/dev/null || true
        # Start the server
        pnpm --filter server dev
        ;;
    "stop")
        echo "🛑 Stopping Pictionary server..."
        # Kill server processes
        pkill -f "tsx.*src/index.ts" || true
        pkill -f "nodemon.*server" || true
        lsof -ti:4000 | xargs kill -9 2>/dev/null || true
        echo "✅ Server stopped"
        ;;
    "restart")
        echo "🔄 Restarting Pictionary server..."
        $0 stop
        sleep 2
        $0 start
        ;;
    "status")
        if lsof -ti:4000 >/dev/null 2>&1; then
            echo "✅ Server is running on port 4000"
            curl -s http://192.168.1.6:4000/health | jq . 2>/dev/null || curl -s http://192.168.1.6:4000/health
        else
            echo "❌ Server is not running"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the Pictionary server"
        echo "  stop    - Stop the Pictionary server"
        echo "  restart - Restart the Pictionary server"
        echo "  status  - Check server status"
        exit 1
        ;;
esac
