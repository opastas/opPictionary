import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import { DrawingCanvas } from './components/DrawingCanvas';
import { ChatBox } from './components/ChatBox';
import type { DrawingData } from 'shared-types';
import './App.css';

function App() {
  const {
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
  } = useSocket();

  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [canvasUpdateHandler, setCanvasUpdateHandler] = useState<((data: DrawingData) => void) | null>(null);

  // Handle canvas updates from socket
  useEffect(() => {
    if (!socket) return;

    const handleCanvasUpdate = (data: DrawingData) => {
      if (canvasUpdateHandler) {
        canvasUpdateHandler(data);
      }
    };

    socket.on('update-canvas', handleCanvasUpdate);

    return () => {
      socket.off('update-canvas', handleCanvasUpdate);
    };
  }, [socket, canvasUpdateHandler]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    joinRoom('main-room', playerName.trim());
    setHasJoined(true);
  };

  const handleDrawingData = useCallback((data: DrawingData) => {
    sendDrawingData(data);
  }, [sendDrawingData]);

  const handleCanvasUpdate = useCallback((handler: (data: DrawingData) => void) => {
    setCanvasUpdateHandler(() => handler);
  }, []);

  const handleClearCanvas = useCallback(() => {
    clearCanvas();
  }, [clearCanvas]);

  const handleSendGuess = useCallback((guess: string) => {
    sendGuess(guess);
  }, [sendGuess]);

  const handleSendMessage = useCallback((message: string) => {
    sendMessage(message);
  }, [sendMessage]);

  if (!hasJoined) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f0f0'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{ color: '#333', marginBottom: '20px' }}>🎨 Pictionary Game</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            Enter your name to join the game!
          </p>
          <form onSubmit={handleJoinRoom}>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                marginBottom: '20px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
            <button
              type="submit"
              disabled={!isConnected}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: isConnected ? '#4caf50' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                fontWeight: 'bold'
              }}
            >
              {isConnected ? 'Join Game' : 'Connecting...'}
            </button>
          </form>
          <div style={{
            marginTop: '20px',
            fontSize: '14px',
            color: '#666'
          }}>
            Connection: {isConnected ? '✅ Connected' : '❌ Disconnected'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#333' }}>🎨 Pictionary Game</h1>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>
              Welcome, {player?.name}! You are the {isDrawer ? 'drawer' : 'guesser'}.
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', color: '#666' }}>Players: {players.length}/2</div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}
              </div>
            </div>
            {isDrawer && gameState && (
              <div style={{
                backgroundColor: '#e3f2fd',
                padding: '10px 15px',
                borderRadius: '8px',
                border: '2px solid #2196f3'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  Secret Word:
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>
                  {gameState.currentWord}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Drawing Canvas */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
            {isDrawer ? 'Draw the word!' : 'Watch the drawing!'}
          </h2>
          <DrawingCanvas
            isDrawer={isDrawer}
            onDrawingData={handleDrawingData}
            onCanvasUpdate={handleCanvasUpdate}
            onClearCanvas={handleClearCanvas}
            width={800}
            height={600}
          />
        </div>

        {/* Chat Box */}
        <div>
          <ChatBox
            messages={messages}
            isGuesser={isGuesser}
            onSendGuess={handleSendGuess}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>

      {/* Game Status */}
      {gameStarted && (
        <div style={{
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '12px',
          marginTop: '20px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <strong>Game Status:</strong> {gameState?.round || 1} / {gameState?.maxRounds || 1} rounds
            </div>
            {gameState?.timeLeft && (
              <div>
                <strong>Time Left:</strong> {gameState.timeLeft} seconds
              </div>
            )}
            <div>
              <strong>Players:</strong> {players.map(p => `${p.name} (${p.score} pts)`).join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        backgroundColor: '#fff3e0',
        padding: '15px',
        borderRadius: '12px',
        marginTop: '20px',
        border: '1px solid #ffcc02'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#e65100' }}>How to Play:</h3>
        <div style={{ color: '#bf360c' }}>
          {isDrawer ? (
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Draw the secret word shown above on the canvas</li>
              <li>Use the color and brush size controls to customize your drawing</li>
              <li>The other player will try to guess what you're drawing</li>
              <li>You can clear the canvas if needed</li>
            </ul>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Watch the drawing being created in real-time</li>
              <li>Use the chat box to submit your guesses</li>
              <li>Switch to "Guess" mode in the chat to submit your answer</li>
              <li>You can also send regular chat messages</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;