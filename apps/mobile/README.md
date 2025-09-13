# Pictionary Mobile App

A React Native + Expo mobile application for the multiplayer Pictionary game.

## Features

- **Touch Drawing**: SVG-based drawing with touch events
- **Real-time Sync**: Live drawing synchronization with other players
- **Mobile Chat**: Touch-optimized chat and guessing interface
- **Role-based UI**: Different interface for drawer vs guesser
- **Socket.IO Integration**: Real-time communication with server

## Dependencies

- `expo` - React Native development platform
- `react-native-svg` - SVG rendering for drawings
- `socket.io-client` - Real-time communication
- `react-native-gesture-handler` - Touch gesture handling
- `shared-types` - Type-safe interfaces from monorepo

## Environment Variables

Create a `.env` file with your local IP address:
```bash
EXPO_PUBLIC_SERVER_URL=http://192.168.1.8:4000
```

**Important**: Use your computer's local IP address, not localhost, for mobile devices to connect to the server.

## Components

### `useSocket` Hook
Manages Socket.IO connection and game state:
- Connection status
- Player roles (drawer/guesser)
- Game state synchronization
- Message handling
- Event emission

### `DrawingCanvas` Component
Touch-based drawing canvas using react-native-svg:
- PanResponder for touch handling
- SVG Path elements for drawing
- Brush color and size controls
- Real-time drawing data transmission
- Canvas clearing functionality

### `App` Component
Main mobile application UI:
- Player name input and room joining
- Game state display
- Secret word display (for drawer)
- Touch-optimized chat interface
- Mobile-responsive layout

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start

# Run on specific platforms
pnpm android
pnpm ios
pnpm web

# Type checking
pnpm type-check
```

## Mobile-Specific Features

### Touch Drawing
- Uses PanResponder for smooth touch handling
- SVG Path elements for vector-based drawing
- Brush size and color controls
- Real-time drawing synchronization

### Mobile UI
- KeyboardAvoidingView for input handling
- ScrollView for content overflow
- Touch-optimized buttons and inputs
- Mobile-friendly message display

### Network Configuration
- Uses local IP address for server connection
- Handles mobile network connectivity
- Real-time connection status display

## Game Flow

1. **Join Game**: Enter player name to join the room
2. **Role Assignment**: First player becomes drawer, second becomes guesser
3. **Drawing Phase**: Drawer sees secret word and draws with touch
4. **Guessing Phase**: Guesser watches drawing and submits guesses
5. **Scoring**: Correct guesses award points and end the round

## Socket.IO Events

### Client → Server
- `join-room` - Join game room with player name
- `drawing-data` - Send drawing coordinates (drawer only)
- `send-guess` - Submit word guess (guesser only)
- `send-message` - Send chat message
- `clear-canvas` - Clear drawing canvas (drawer only)

### Server → Client
- `update-canvas` - Receive drawing data from other player
- `game-state` - Complete game state with word and messages
- `guess-received` - Guess submission feedback
- `correct-guess` - Correct guess notification
- `chat-message` - New chat message
- `player-joined/left` - Player connection events

## Platform Support

- **iOS**: Native iOS app via Expo
- **Android**: Native Android app via Expo
- **Web**: Web version for testing (limited touch support)

## Styling

The app uses React Native StyleSheet with:
- Mobile-first responsive design
- Touch-friendly button sizes
- Optimized for portrait orientation
- Native platform styling
- Smooth animations and transitions

## Testing

To test the mobile app:

1. Start the server: `pnpm --filter server dev`
2. Start the mobile app: `pnpm --filter mobile start`
3. Scan QR code with Expo Go app
4. Or run on simulator: `pnpm --filter mobile ios` or `pnpm --filter mobile android`

## Troubleshooting

### Connection Issues
- Ensure server is running on the correct IP address
- Check that mobile device and computer are on same network
- Verify EXPO_PUBLIC_SERVER_URL in .env file

### Drawing Issues
- Ensure react-native-svg is properly installed
- Check PanResponder touch handling
- Verify SVG Path rendering
