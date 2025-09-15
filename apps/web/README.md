# Pictionary Web App

A React + TypeScript web application for the multiplayer Pictionary game.

## Features

- **Real-time Drawing**: Canvas-based drawing with mouse events
- **Live Chat**: Send messages and submit guesses
- **Role-based UI**: Different interface for drawer vs guesser
- **Socket.IO Integration**: Real-time communication with server
- **Responsive Design**: Works on desktop and mobile devices

## Components

### `useSocket` Hook
Manages Socket.IO connection and game state:
- Connection status
- Player roles (drawer/guesser)
- Game state synchronization
- Message handling
- Event emission

### `DrawingCanvas` Component
Interactive drawing canvas for the drawer:
- Mouse-based drawing (mousedown, mousemove, mouseup)
- Brush color and size controls
- Real-time drawing data transmission
- Canvas clearing functionality
- Read-only mode for guessers

### `ChatBox` Component
Chat and guessing interface:
- Message display with timestamps
- Guess submission mode
- System message notifications
- Auto-scrolling message history
- Role-based input controls

### `App` Component
Main application UI:
- Player name input and room joining
- Game state display
- Secret word display (for drawer)
- Player status and connection info
- Responsive layout

## Environment Variables

Create a `.env.local` file:
```bash
VITE_SERVER_URL=http://localhost:4000
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm type-check
```

## Game Flow

1. **Join Game**: Enter player name to join the room
2. **Role Assignment**: First player becomes drawer, second becomes guesser
3. **Drawing Phase**: Drawer sees secret word and draws on canvas
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

## Styling

The app uses CSS modules with:
- Responsive grid layout
- Modern card-based design
- Color-coded message types
- Smooth animations and transitions
- Mobile-friendly controls

## Browser Support

- Modern browsers with Canvas API support
- ES2020+ features
- WebSocket support for Socket.IO