import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSocket } from './hooks/useSocket';
import { SimpleCanvas } from './components/SimpleCanvas';
import type { DrawingData } from 'shared-types';

export default function App() {
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
  const [guessInput, setGuessInput] = useState('');
  const [chatInput, setChatInput] = useState('');
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

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    joinRoom('main-room', playerName.trim());
    setHasJoined(true);
  };

  const handleDrawingData = useCallback((data: DrawingData) => {
    sendDrawingData(data);
  }, [sendDrawingData]);

  const handleCanvasUpdate = useCallback((handler: (data: DrawingData) => void) => {
    setCanvasUpdateHandler(() => handler);
  }, []);

  const handleSendGuess = () => {
    if (!guessInput.trim()) return;
    sendGuess(guessInput.trim());
    setGuessInput('');
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!hasJoined) {
    return (
      <View style={styles.container}>
        <View style={styles.joinContainer}>
          <Text style={styles.title}>🎨 Pictionary Game</Text>
          <Text style={styles.subtitle}>Enter your name to join the game!</Text>
          
          <TextInput
            style={styles.input}
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Your name"
            placeholderTextColor="#999"
          />
          
          <TouchableOpacity
            style={[styles.button, !isConnected && styles.buttonDisabled]}
            onPress={handleJoinRoom}
            disabled={!isConnected}
          >
            <Text style={styles.buttonText}>
              {isConnected ? 'Join Game' : 'Connecting...'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.connectionStatus}>
            Connection: {isConnected ? '✅ Connected' : '❌ Disconnected'}
          </Text>
        </View>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎨 Pictionary Game</Text>
          <Text style={styles.headerSubtitle}>
            Welcome, {player?.name}! You are the {isDrawer ? 'drawer' : 'guesser'}.
          </Text>
          <Text style={styles.connectionStatus}>
            Players: {players.length}/2 | Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}
          </Text>
          {/* Timer Display */}
      {gameStarted && gameState?.timeLeft && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            ⏰ Game Time: {gameState.timeLeft} seconds
          </Text>
        </View>
      )}
      
      {gameState?.guesserTimeLeft && isGuesser && (
        <View style={[
          styles.timerContainer,
          { 
            backgroundColor: gameState.guesserTimeLeft <= 3 ? '#dc3545' : '#28a745'
          }
        ]}>
          <Text style={styles.timerText}>
            🎯 Guess Time: {gameState.guesserTimeLeft} seconds
          </Text>
        </View>
      )}
        </View>

        {/* Secret Word Display */}
        {isDrawer && gameState && (
          <View style={styles.secretWordContainer}>
            <Text style={styles.secretWordLabel}>Secret Word:</Text>
            <Text style={styles.secretWord}>{gameState.currentWord}</Text>
          </View>
        )}

        {/* Drawing Canvas */}
        <View style={styles.canvasContainer}>
          <Text style={styles.sectionTitle}>
            {isDrawer ? 'Draw the word!' : 'Watch the drawing!'}
          </Text>
          <SimpleCanvas
            isDrawer={isDrawer}
            onDrawingData={handleDrawingData}
            onCanvasUpdate={handleCanvasUpdate}
            width={350}
            height={350}
          />
        </View>

        {/* Chat and Guessing */}
        <View style={styles.chatContainer}>
          <Text style={styles.sectionTitle}>Chat & Guesses</Text>
          
          {/* Messages */}
          <ScrollView style={styles.messagesContainer} nestedScrollEnabled>
            {messages.length === 0 ? (
              <Text style={styles.noMessages}>
                No messages yet. {isGuesser ? 'Start guessing!' : 'Start drawing!'}
              </Text>
            ) : (
              messages.map((message) => (
                <View key={message.id} style={[
                  styles.message,
                  message.type === 'system' && styles.systemMessage,
                  message.type === 'guess' && styles.guessMessage,
                ]}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageUser}>
                      {message.userName}
                      {message.type === 'guess' && ' (guess)'}
                      {message.type === 'system' && ' (system)'}
                    </Text>
                    <Text style={styles.messageTime}>
                      {formatTime(message.timestamp)}
                    </Text>
                  </View>
                  <Text style={styles.messageText}>{message.message}</Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            {isGuesser && (
              <View style={styles.guessContainer}>
                <TextInput
                  style={styles.guessInput}
                  value={guessInput}
                  onChangeText={setGuessInput}
                  placeholder="Enter your guess..."
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={[styles.guessButton, !guessInput.trim() && styles.buttonDisabled]}
                  onPress={handleSendGuess}
                  disabled={!guessInput.trim()}
                >
                  <Text style={styles.guessButtonText}>Guess</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Type a message..."
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={[styles.chatButton, !chatInput.trim() && styles.buttonDisabled]}
                onPress={handleSendMessage}
                disabled={!chatInput.trim()}
              >
                <Text style={styles.chatButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Game Status */}
        {gameStarted && (
          <View style={styles.gameStatusContainer}>
            <Text style={styles.gameStatusText}>
              Game Status: {gameState?.round || 1} / {gameState?.maxRounds || 1} rounds
            </Text>
            {gameState?.timeLeft && (
              <Text style={styles.gameStatusText}>
                Time Left: {gameState.timeLeft} seconds
              </Text>
            )}
            <Text style={styles.gameStatusText}>
              Players: {players.map(p => `${p.name} (${p.score} pts)`).join(', ')}
            </Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to Play:</Text>
          {isDrawer ? (
            <Text style={styles.instructionsText}>
              • Draw the secret word shown above on the canvas{'\n'}
              • Use touch to draw on the screen{'\n'}
              • The other player will try to guess what you're drawing{'\n'}
              • You can clear the canvas if needed
            </Text>
          ) : (
            <Text style={styles.instructionsText}>
              • Watch the drawing being created in real-time{'\n'}
              • Use the guess input to submit your answer{'\n'}
              • You can also send regular chat messages{'\n'}
              • Try to figure out what the drawer is drawing!
            </Text>
          )}
        </View>
      </ScrollView>
      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  joinContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4caf50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  connectionStatus: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  timerContainer: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'center',
  },
  timerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  secretWordContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  secretWordLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  secretWord: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  canvasContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chatContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messagesContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  noMessages: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
  message: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  systemMessage: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#2196f3',
    fontStyle: 'italic',
  },
  guessMessage: {
    backgroundColor: '#fff3e0',
    borderLeftColor: '#ff9800',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageUser: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  messageText: {
    fontSize: 14,
  },
  inputContainer: {
    gap: 12,
  },
  guessContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  guessInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  guessButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
  },
  guessButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  chatInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  chatButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
  },
  chatButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  gameStatusContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameStatusText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  instructionsContainer: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffcc02',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#bf360c',
    lineHeight: 20,
  },
});