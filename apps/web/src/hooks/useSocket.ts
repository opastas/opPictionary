import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  Player, 
  DrawingData, 
  ChatMessage,
  GameStateData 
} from 'shared-types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export interface UseSocketReturn {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  player: Player | null;
  gameState: GameStateData | null;
  messages: ChatMessage[];
  players: Player[];
  isDrawer: boolean;
  isGuesser: boolean;
  gameStarted: boolean;
  joinRoom: (roomId: string, playerName: string) => void;
  sendDrawingData: (data: DrawingData) => void;
  sendGuess: (guess: string) => void;
  clearCanvas: () => void;
  sendMessage: (message: string) => void;
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameStateData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isDrawer, setIsDrawer] = useState(false);
  const [isGuesser, setIsGuesser] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    console.log('Connecting to server:', SERVER_URL);
    const newSocket = io(SERVER_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Connected to server:', SERVER_URL);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    // Game events
    newSocket.on('game-state', (gameStateData) => {
      console.log('Game state received:', gameStateData);
      setGameState(gameStateData);
      setMessages(gameStateData.messages);
      setGameStarted(true);
    });

    newSocket.on('game-started', (roomId) => {
      console.log('Game started in room:', roomId);
      setGameStarted(true);
    });

    // Player events
    newSocket.on('player-joined', (newPlayer) => {
      console.log('Player joined:', newPlayer);
      setPlayers(prev => {
        const existing = prev.find(p => p.id === newPlayer.id);
        if (existing) {
          return prev.map(p => p.id === newPlayer.id ? newPlayer : p);
        }
        return [...prev, newPlayer];
      });
    });

    newSocket.on('player-left', (playerId) => {
      console.log('Player left:', playerId);
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    });

    // Chat events
    newSocket.on('chat-message', (message) => {
      console.log('Chat message received:', message);
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('system-message', (message) => {
      console.log('System message:', message);
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        roomId: 'main-room',
        userId: 'system',
        userName: 'System',
        message,
        timestamp: new Date(),
        type: 'system'
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    // Guess events
    newSocket.on('guess-received', (data) => {
      console.log('Guess received:', data);
    });

    newSocket.on('correct-guess', (data) => {
      console.log('Correct guess!', data);
    });

    // Room events
    newSocket.on('room-updated', (room) => {
      console.log('Room updated:', room);
      setPlayers(room.players);
      
      // Update player role
      const currentPlayer = room.players.find((p: Player) => p.id === newSocket.id);
      if (currentPlayer) {
        setPlayer(currentPlayer);
        setIsDrawer(currentPlayer.isDrawer);
        setIsGuesser(!currentPlayer.isDrawer);
      }
    });

    newSocket.on('room-full', () => {
      console.log('Room is full');
      alert('Room is full! Maximum 2 players allowed.');
    });

    newSocket.on('room-not-found', () => {
      console.log('Room not found');
      alert('Room not found!');
    });

    // Error events
    newSocket.on('error', (message) => {
      console.error('Socket error:', message);
      alert(`Error: ${message}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = (roomId: string, playerName: string) => {
    if (socket) {
      socket.emit('join-room', { roomId, playerName });
    }
  };

  const sendDrawingData = (data: DrawingData) => {
    if (socket && isDrawer) {
      socket.emit('drawing-data', data);
    }
  };

  const sendGuess = (guess: string) => {
    if (socket && isGuesser) {
      socket.emit('send-guess', { roomId: 'main-room', guess });
    }
  };

  const clearCanvas = () => {
    if (socket && isDrawer) {
      socket.emit('clear-canvas', 'main-room');
    }
  };

  const sendMessage = (message: string) => {
    if (socket) {
      socket.emit('send-message', { roomId: 'main-room', message });
    }
  };

  return {
    socket,
    isConnected,
    player,
    gameState,
    messages,
    players,
    isDrawer,
    isGuesser,
    gameStarted,
    joinRoom,
    sendDrawingData,
    sendGuess,
    clearCanvas,
    sendMessage,
  };
};
