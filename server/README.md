# Pictionary Game Server

A Node.js/Express server with Socket.IO for real-time multiplayer pictionary gameplay.

## Features

- **2-Player Game**: Maximum of 2 players per room
- **Role Assignment**: First player becomes drawer, second becomes guesser
- **Real-time Drawing**: Drawing data broadcasted between players
- **Word Guessing**: Guess validation with point scoring
- **Chat System**: In-game messaging with system notifications

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

## API Endpoints

### Health Check
- `GET /health` - Returns server status and current game state

## Socket.IO Events

### Client to Server Events

#### `join-room`
Join the game room (max 2 players)
```typescript
socket.emit('join-room', { roomId: string, playerName: string })
```

#### `drawing-data`
Send drawing coordinates (drawer only)
```typescript
socket.emit('drawing-data', { roomId: string, points: DrawingPoint[], action: 'start' | 'draw' | 'end' })
```

#### `send-guess`
Submit a word guess (guesser only)
```typescript
socket.emit('send-guess', { roomId: string, guess: string })
```

#### `clear-canvas`
Clear the drawing canvas (drawer only)
```typescript
socket.emit('clear-canvas', roomId: string)
```

### Server to Client Events

#### `update-canvas`
Receive drawing data from other player
```typescript
socket.on('update-canvas', (data: DrawingData) => {})
```

#### `game-state`
Receive complete game state
```typescript
socket.on('game-state', (gameState: GameStateData) => {})
```

#### `guess-received`
Receive guess feedback
```typescript
socket.on('guess-received', (data: { userId: string, guess: string, isCorrect: boolean }) => {})
```

#### `correct-guess`
Correct guess notification
```typescript
socket.on('correct-guess', (data: { userId: string, word: string, points: number }) => {})
```

#### `chat-message`
Receive chat messages
```typescript
socket.on('chat-message', (message: ChatMessage) => {})
```

#### `player-joined` / `player-left`
Player connection events
```typescript
socket.on('player-joined', (player: Player) => {})
socket.on('player-left', (playerId: string) => {})
```

## Game Flow

1. **Player 1 joins** → Becomes drawer, gets secret word
2. **Player 2 joins** → Becomes guesser, game starts
3. **Drawer draws** → Drawing data sent to guesser
4. **Guesser guesses** → Word validation, points awarded if correct
5. **Game ends** → Round complete, scores updated

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Word List

The server includes a built-in word list with 30 common words:
- Animals: cat, dog, fish, bird, elephant, butterfly
- Objects: house, tree, car, book, phone, computer, chair, table, bed, guitar, piano, bicycle
- Food: apple, banana, pizza, cake
- Nature: sun, moon, star, mountain, ocean, forest, desert, rainbow

Words are randomly selected for each game.
