import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  Player, 
  DrawingData, 
  GameState,
  ChatMessage 
} from 'shared-types';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "http://192.168.1.6:5173",
      "http://192.168.1.6:5174",
      "http://192.168.1.6:5175",
      "http://192.168.1.6:8081",
      "http://192.168.1.6:8082",
      "http://localhost:8081",
      "http://localhost:8082",
      "exp://192.168.1.6:8081",
      "exp://192.168.1.6:8082"
    ],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// Game state
interface GameRoom {
  id: string;
  players: Map<string, Player>;
  secretWord: string;
  drawerId: string | null;
  guesserId: string | null;
  gameState: GameState;
  messages: ChatMessage[];
}

const gameRoom: GameRoom = {
  id: 'main-room',
  players: new Map(),
  secretWord: '',
  drawerId: null,
  guesserId: null,
  gameState: GameState.WAITING,
  messages: []
};

// Timer state
let gameTimer: NodeJS.Timeout | null = null;
let timeLeft = 60;

// Guesser timer state
let guesserTimer: NodeJS.Timeout | null = null;
let guesserTimeLeft = 10; // 10 seconds per guess

// Timer functions
const startGameTimer = () => {
  if (gameTimer) {
    clearInterval(gameTimer);
  }
  
  timeLeft = 60;
  gameTimer = setInterval(() => {
    timeLeft--;
    
    // Broadcast timer update to all players
    broadcastToRoom('timer-update', { timeLeft });
    
    if (timeLeft <= 0) {
      // Time's up!
      clearInterval(gameTimer!);
      gameTimer = null;
      
      // End the round
      gameRoom.gameState = GameState.ROUND_END;
      addSystemMessage('Time\'s up! The word was not guessed.');
      
      broadcastToRoom('round-ended', {
        correctWord: gameRoom.secretWord,
        nextDrawer: null
      });
    }
  }, 1000);
};

const stopGameTimer = () => {
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }
};

const resetGameTimer = () => {
  stopGameTimer();
  timeLeft = 60;
};

// Guesser timer functions
const startGuesserTimer = () => {
  if (guesserTimer) {
    clearInterval(guesserTimer);
  }
  
  guesserTimeLeft = 10;
  guesserTimer = setInterval(() => {
    guesserTimeLeft--;
    
    // Broadcast guesser timer update to all players
    broadcastToRoom('guesser-timer-update', { guesserTimeLeft });
    
    if (guesserTimeLeft <= 0) {
      // Time's up for this guess! (informational only)
      clearInterval(guesserTimer!);
      guesserTimer = null;
      
      // Add system message about timeout (informational)
      addSystemMessage('Time\'s up for this guess! Make another guess.');
      
      // Reset guesser timer for next guess (informational only)
      startGuesserTimer();
    }
  }, 1000);
};

const stopGuesserTimer = () => {
  if (guesserTimer) {
    clearInterval(guesserTimer);
    guesserTimer = null;
  }
};

const resetGuesserTimer = () => {
  stopGuesserTimer();
  guesserTimeLeft = 10;
};

// Word list for the game
const WORDS = [
  'cat', 'dog', 'house', 'tree', 'car', 'sun', 'moon', 'star', 'fish', 'bird',
  'apple', 'banana', 'pizza', 'cake', 'book', 'phone', 'computer', 'chair', 'table', 'bed',
  'mountain', 'ocean', 'forest', 'desert', 'rainbow', 'butterfly', 'elephant', 'guitar', 'piano', 'bicycle'
];

// Helper functions
function getRandomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function createPlayer(socketId: string, name: string): Player {
  return {
    id: socketId,
    name,
    score: 0,
    isDrawer: false,
    isConnected: true
  };
}

function addSystemMessage(message: string): void {
  const systemMessage: ChatMessage = {
    id: Date.now().toString(),
    roomId: gameRoom.id,
    userId: 'system',
    userName: 'System',
    message,
    timestamp: new Date(),
    type: 'system'
  };
  gameRoom.messages.push(systemMessage);
}

function broadcastToRoom(event: keyof ServerToClientEvents, data: any): void {
  io.to(gameRoom.id).emit(event, data);
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Pictionary server is running',
    players: gameRoom.players.size,
    gameState: gameRoom.gameState
  });
});

// Reset game state (for testing)
app.post('/reset', (req, res) => {
  // Clear all players
  gameRoom.players.clear();
  gameRoom.drawerId = null;
  gameRoom.guesserId = null;
  gameRoom.secretWord = '';
  gameRoom.messages = [];
  gameRoom.gameState = GameState.WAITING;
  
  // Notify all clients to disconnect
  io.emit('game-reset');
  
  res.json({ 
    status: 'OK', 
    message: 'Game state reset',
    players: 0,
    gameState: 'waiting'
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room handler
  socket.on('join-room', (data) => {
    const { roomId, playerName } = data;
    
    // Check if room is full (max 2 players)
    if (gameRoom.players.size >= 2) {
      socket.emit('room-full');
      return;
    }

    // Join the socket to the room
    socket.join(roomId);
    
    // Create player
    const player = createPlayer(socket.id, playerName);
    gameRoom.players.set(socket.id, player);

    // Assign roles
    if (gameRoom.players.size === 1) {
      // First player becomes drawer
      player.isDrawer = true;
      gameRoom.drawerId = socket.id;
      gameRoom.secretWord = getRandomWord();
      addSystemMessage(`${playerName} joined as the drawer.`);
    } else if (gameRoom.players.size === 2) {
      // Second player becomes guesser
      gameRoom.guesserId = socket.id;
      gameRoom.gameState = GameState.PLAYING;
      addSystemMessage(`${playerName} joined as the guesser. Game started!`);
      
      // Start the game timer
      startGameTimer();
      
      // Start the guesser timer
      startGuesserTimer();
      
      // Notify drawer about the secret word
      const drawerSocket = io.sockets.sockets.get(gameRoom.drawerId!);
      if (drawerSocket) {
        drawerSocket.emit('game-state', {
          currentWord: gameRoom.secretWord,
          drawerSocketId: gameRoom.drawerId!,
          messages: gameRoom.messages,
          timeLeft: timeLeft,
          guesserTimeLeft: guesserTimeLeft,
          round: 1,
          maxRounds: 1
        });
      }
      
      // Notify guesser about game state
      socket.emit('game-state', {
        currentWord: gameRoom.secretWord,
        drawerSocketId: gameRoom.drawerId!,
        messages: gameRoom.messages,
        timeLeft: timeLeft,
        guesserTimeLeft: guesserTimeLeft,
        round: 1,
        maxRounds: 1
      });
    }

    // Broadcast player joined
    broadcastToRoom('player-joined', player);
    broadcastToRoom('room-updated', {
      id: gameRoom.id,
      name: 'Main Room',
      players: Array.from(gameRoom.players.values()),
      gameState: gameRoom.gameState,
      currentWord: gameRoom.secretWord,
      currentDrawer: gameRoom.drawerId,
      timeLeft: timeLeft,
      guesserTimeLeft: guesserTimeLeft,
      createdAt: new Date()
    });

    console.log(`Player ${playerName} joined room ${roomId}. Total players: ${gameRoom.players.size}`);
  });

  // Drawing data handler
  socket.on('drawing-data', (data: DrawingData) => {
    // Only the drawer can send drawing data
    if (socket.id !== gameRoom.drawerId) {
      console.log(`Drawing data rejected: ${socket.id} is not the drawer`);
      return;
    }

    // Broadcast drawing data to other players (the guesser)
    socket.to(gameRoom.id).emit('update-canvas', data);
    console.log(`Drawing data broadcasted from ${socket.id} to other players:`, data.points.length, 'points');
  });

  // Guess handler
  socket.on('send-guess', (data) => {
    const { roomId, guess } = data;
    
    // Only the guesser can send guesses
    if (socket.id !== gameRoom.guesserId) {
      console.log(`Guess rejected: ${socket.id} is not the guesser`);
      return;
    }
    
    console.log(`Guess received from ${socket.id}: "${guess}"`);

    const player = gameRoom.players.get(socket.id);
    if (!player) return;

    // Check if guess matches the secret word (case insensitive)
    const isCorrect = guess.toLowerCase().trim() === gameRoom.secretWord.toLowerCase();
    
    // Add guess to messages
    const guessMessage: ChatMessage = {
      id: Date.now().toString(),
      roomId: gameRoom.id,
      userId: socket.id,
      userName: player.name,
      message: guess,
      timestamp: new Date(),
      type: 'guess'
    };
    gameRoom.messages.push(guessMessage);

    // Broadcast guess received
    broadcastToRoom('guess-received', {
      userId: socket.id,
      guess,
      isCorrect
    });

    if (isCorrect) {
      // Correct guess!
      player.score += 10; // Award points
      addSystemMessage(`${player.name} guessed correctly!`);
      
      // Stop both timers
      stopGameTimer();
      stopGuesserTimer();
      
      // Broadcast correct guess
      broadcastToRoom('correct-guess', {
        userId: socket.id,
        word: gameRoom.secretWord,
        points: 10
      });

      // End the round
      gameRoom.gameState = GameState.ROUND_END;
      broadcastToRoom('round-ended', {
        correctWord: gameRoom.secretWord,
        nextDrawer: null // Game ends after one round
      });

      console.log(`Player ${player.name} guessed correctly: ${gameRoom.secretWord}`);
    } else {
      // Wrong guess - restart guesser timer for next guess
      addSystemMessage(`${player.name} guessed: "${guess}" (incorrect)`);
      console.log(`Player ${player.name} guessed: ${guess} (incorrect)`);
      
      // Restart guesser timer for next guess
      startGuesserTimer();
    }

    // Broadcast updated messages
    broadcastToRoom('chat-message', guessMessage);
  });

  // Clear canvas handler
  socket.on('clear-canvas', (roomId: string) => {
    // Only the drawer can clear the canvas
    if (socket.id !== gameRoom.drawerId) {
      return;
    }

    broadcastToRoom('clear-canvas', roomId);
    console.log('Canvas cleared');
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    const player = gameRoom.players.get(socket.id);
    if (player) {
      addSystemMessage(`${player.name} left the game`);
      gameRoom.players.delete(socket.id);
      
      // Reset game if drawer leaves
      if (socket.id === gameRoom.drawerId) {
        gameRoom.drawerId = null;
        gameRoom.secretWord = '';
        gameRoom.gameState = GameState.WAITING;
        resetGameTimer(); // Reset timer when drawer leaves
        resetGuesserTimer(); // Reset guesser timer too
      }
      
      // Reset game if guesser leaves
      if (socket.id === gameRoom.guesserId) {
        gameRoom.guesserId = null;
        gameRoom.gameState = GameState.WAITING;
        resetGameTimer(); // Reset timer when guesser leaves
        resetGuesserTimer(); // Reset guesser timer too
      }

      broadcastToRoom('player-left', socket.id);
      console.log(`Player ${player.name} disconnected`);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Pictionary server running on port ${PORT}`);
  console.log(`🎮 Game room: ${gameRoom.id}`);
  console.log(`📝 Secret word: ${gameRoom.secretWord || 'Not set yet'}`);
  console.log(`🌐 Server accessible at: http://192.168.1.6:${PORT}`);
});