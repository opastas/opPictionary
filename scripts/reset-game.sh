#!/bin/bash

# Reset Pictionary Game State
echo "🔄 Resetting Pictionary game state..."

# Check if server is running
if ! curl -s http://192.168.1.6:4000/health > /dev/null; then
    echo "❌ Server is not running. Please start the server first."
    exit 1
fi

# Reset the game state
RESPONSE=$(curl -s -X POST http://192.168.1.6:4000/reset)

if echo "$RESPONSE" | grep -q '"status":"OK"'; then
    echo "✅ Game state reset successfully!"
    echo "📊 Current status:"
    curl -s http://192.168.1.6:4000/health | jq '.' 2>/dev/null || curl -s http://192.168.1.6:4000/health
else
    echo "❌ Failed to reset game state"
    echo "Response: $RESPONSE"
    exit 1
fi

echo ""
echo "🎮 Ready for new players!"
echo "🌐 Web App: http://192.168.1.6:5173"
echo "📱 Mobile App: http://192.168.1.6:8081"
