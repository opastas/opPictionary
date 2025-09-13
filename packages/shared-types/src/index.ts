// Game Types
export interface GameRoom {
  id: string;
  name: string;
  players: Player[];
  gameState: GameState;
  currentWord?: string;
  currentDrawer?: string;
  timeLeft?: number;
  createdAt: Date;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isDrawer: boolean;
  isConnected: boolean;
}

export enum GameState {
  WAITING = 'waiting',
  PLAYING = 'playing',
  ROUND_END = 'round_end',
  GAME_END = 'game_end'
}

// Drawing Types
export interface DrawingPoint {
  x: number;
  y: number;
  color: string;
  brushSize: number;
}

export interface DrawingData {
  roomId: string;
  points: DrawingPoint[];
  action: 'start' | 'draw' | 'end';
}

// Chat Message Type
export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'system' | 'guess';
}

// Game State with word, drawer, and messages
export interface GameStateData {
  currentWord: string;
  drawerSocketId: string;
  messages: ChatMessage[];
  timeLeft: number;
  round: number;
  maxRounds: number;
}

// Socket.IO Event Interfaces
export interface ServerToClientEvents {
  // Canvas/Drawing events
  'update-canvas': (data: DrawingData) => void;
  'clear-canvas': (roomId: string) => void;
  
  // Game state events
  'game-state': (gameState: GameStateData) => void;
  'game-started': (roomId: string) => void;
  'game-ended': (roomId: string, winner: Player) => void;
  'round-started': (data: { word: string; drawerId: string; timeLeft: number }) => void;
  'round-ended': (data: { correctWord: string; nextDrawer?: string }) => void;
  
  // Player events
  'player-joined': (player: Player) => void;
  'player-left': (playerId: string) => void;
  'player-updated': (player: Player) => void;
  
  // Chat events
  'chat-message': (message: ChatMessage) => void;
  'system-message': (message: string) => void;
  
  // Guess events
  'guess-received': (data: { userId: string; guess: string; isCorrect: boolean }) => void;
  'correct-guess': (data: { userId: string; word: string; points: number }) => void;
  
  // Room events
  'room-updated': (room: GameRoom) => void;
  'room-full': () => void;
  'room-not-found': () => void;
  
  // Error events
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  // Room events
  'join-room': (data: { roomId: string; playerName: string }) => void;
  'leave-room': (roomId: string) => void;
  'create-room': (data: { roomName: string; playerName: string; maxPlayers?: number }) => void;
  
  // Drawing events
  'drawing-data': (data: DrawingData) => void;
  'clear-canvas': (roomId: string) => void;
  
  // Game events
  'start-game': (roomId: string) => void;
  'end-game': (roomId: string) => void;
  'ready-to-play': (roomId: string) => void;
  
  // Chat events
  'send-message': (data: { roomId: string; message: string }) => void;
  
  // Guess events
  'send-guess': (data: { roomId: string; guess: string }) => void;
  
  // Player events
  'update-player': (data: { roomId: string; player: Partial<Player> }) => void;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateRoomRequest {
  name: string;
  maxPlayers?: number;
  rounds?: number;
  timePerRound?: number;
}

export interface JoinRoomRequest {
  roomId: string;
  playerName: string;
}

// Word Categories
export enum WordCategory {
  ANIMALS = 'animals',
  FOOD = 'food',
  OBJECTS = 'objects',
  ACTIONS = 'actions',
  PLACES = 'places',
  PEOPLE = 'people'
}

export interface Word {
  text: string;
  category: WordCategory;
  difficulty: 'easy' | 'medium' | 'hard';
}
