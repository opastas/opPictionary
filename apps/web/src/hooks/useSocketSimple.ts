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
    
    try {
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
        setMessages(gameStateData.messages || []);
      });

      newSocket.on('player-joined', (newPlayer) => {
        console.log('Player joined:', newPlayer);
        setPlayers(prev => {
          if (!prev.some(p => p.id === newPlayer.id)) {
            return [...prev, newPlayer];
          }
          return prev;
        });
      });

      newSocket.on('player-left', (playerId) => {
        console.log('Player left:', playerId);
        setPlayers(prev => prev.filter(p => p.id !== playerId));
      });

      newSocket.on('room-updated', (room) => {
        console.log('Room updated:', room);
        setPlayers(room.players || []);
        
        // Update current player
        const currentPlayer = room.players?.find((p: Player) => p.id === newSocket.id);
        if (currentPlayer) {
          setPlayer(currentPlayer);
          setIsDrawer(currentPlayer.isDrawer);
          setIsGuesser(!currentPlayer.isDrawer);
        }
      });

      newSocket.on('chat-message', (message) => {
        console.log('Chat message received:', message);
        setMessages(prev => [...prev, message]);
      });

      newSocket.on('system-message', (message) => {
        console.log('System message:', message);
        const systemMsg: ChatMessage = {
          id: Date.now().toString(),
          roomId: 'main-room',
          userId: 'system',
          userName: 'System',
          message: message,
          timestamp: new Date(),
          type: 'system'
        };
        setMessages(prev => [...prev, systemMsg]);
      });

      newSocket.on('guess-received', (data) => {
        console.log('Guess received:', data);
      });

      newSocket.on('correct-guess', (data) => {
        console.log('Correct guess:', data);
      });

      newSocket.on('room-full', () => {
        console.log('Room is full');
        alert('The game room is full!');
      });

      newSocket.on('room-not-found', () => {
        console.log('Room not found');
        alert('The game room was not found!');
      });

      newSocket.on('error', (message) => {
        console.error('Socket error:', message);
        alert(`Error: ${message}`);
      });

      setSocket(newSocket);

      return () => {
        console.log('Cleaning up socket connection');
        newSocket.disconnect();
      };
    } catch (error) {
      console.error('Error creating socket:', error);
    }
  }, []);

  const joinRoom = (roomId: string, playerName: string) => {
    if (socket) {
      console.log('Joining room:', roomId, 'as:', playerName);
      socket.emit('join-room', { roomId, playerName });
    }
  };

  const sendDrawingData = (data: DrawingData) => {
    if (socket && isDrawer) {
      console.log('Sending drawing data:', data);
      socket.emit('drawing-data', data);
    }
  };

  const sendGuess = (guess: string) => {
    if (socket && isGuesser) {
      console.log('Sending guess:', guess);
      socket.emit('send-guess', { roomId: 'main-room', guess });
    }
  };

  const clearCanvas = () => {
    if (socket && isDrawer) {
      console.log('Clearing canvas');
      socket.emit('clear-canvas', 'main-room');
    }
  };

  const sendMessage = (message: string) => {
    if (socket) {
      console.log('Sending message:', message);
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
