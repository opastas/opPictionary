# 🎮 Cross-Platform Pictionary Demo

## Quick Demo Steps

### 1. Start All Services
```bash
./scripts/start-all.sh
```

### 2. Open Web App
- Go to: `http://192.168.1.13:5173`
- Enter name: "WebPlayer"
- Click "Join Room"
- You'll be the **Drawer** (first player)

### 3. Open Mobile App
- Scan QR code in terminal OR
- Go to: `http://192.168.1.13:8081` on mobile
- Enter name: "MobilePlayer" 
- Click "Join Room"
- You'll be the **Guesser** (second player)

### 4. Play the Game
- **Web Player (Drawer)**:
  - See the secret word displayed
  - Draw on the canvas using mouse/touch
  - Watch the mobile player's guesses in chat

- **Mobile Player (Guesser)**:
  - See the drawing appear in real-time
  - Type guesses in the input field
  - Watch for "CORRECT!" when you guess right

### 5. Test Different Combinations
- **Two Web Browsers**: Open the web app in two different browsers
- **Two Mobile Devices**: Use the mobile app on two different phones
- **Mixed**: Any combination of web and mobile

## Expected Behavior

✅ **Real-time Drawing**: Drawings appear instantly on both platforms
✅ **Live Chat**: Messages appear immediately on both platforms  
✅ **Role Assignment**: First player = Drawer, Second player = Guesser
✅ **Word Display**: Only the drawer sees the secret word
✅ **Scoring**: Correct guesses award points and end the round
✅ **Cross-Platform**: Any device can play with any other device

## Troubleshooting

- **Can't connect**: Check that all services are running
- **No drawing sync**: Refresh both clients
- **Mobile won't load**: Use the QR code or direct URL
- **Web won't load**: Check the correct port (5173, 5174, or 5175)

## Success Indicators

🎉 **Game Started**: Both players see "Game Started" message
🎨 **Drawing Works**: Drawings appear on both screens
💬 **Chat Works**: Messages appear on both screens
🏆 **Scoring Works**: Correct guesses show "CORRECT!" and award points
