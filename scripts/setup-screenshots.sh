#!/bin/bash

echo "📸 Setting up screenshots for Pictionary game"
echo "=============================================="

# Create screenshots directory if it doesn't exist
mkdir -p screenshots

echo ""
echo "Please add the following screenshot files to the screenshots/ directory:"
echo ""
echo "📱 Mobile App Screenshots:"
echo "  - mobile-join-screen.jpg    (Mobile app join screen with connection status)"
echo "  - mobile-game-guesser.jpg  (Mobile app game screen showing guesser perspective)"
echo ""
echo "🌐 Web App Screenshots:"
echo "  - web-join-screen.png       (Web app join screen in Chrome browser)"
echo "  - web-game-drawer.png       (Web app game screen showing drawer perspective)"
echo ""

# Check if screenshots exist
echo "Checking for existing screenshots..."
for file in "mobile-join-screen.jpg" "mobile-game-guesser.jpg" "web-join-screen.png" "web-game-drawer.png"; do
    if [ -f "screenshots/$file" ]; then
        echo "✅ Found: $file"
    else
        echo "❌ Missing: $file"
    fi
done

echo ""
echo "Once you've added all screenshots, run:"
echo "  git add screenshots/"
echo "  git commit -m 'docs: add actual screenshot images'"
echo ""
echo "The README.md file is already configured to display these screenshots!"
