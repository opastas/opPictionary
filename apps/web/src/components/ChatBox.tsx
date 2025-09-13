import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from 'shared-types';

interface ChatBoxProps {
  messages: ChatMessage[];
  isGuesser: boolean;
  onSendGuess: (guess: string) => void;
  onSendMessage: (message: string) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  isGuesser,
  onSendGuess,
  onSendMessage
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isGuessMode, setIsGuessMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (isGuessMode && isGuesser) {
      onSendGuess(inputValue.trim());
    } else {
      onSendMessage(inputValue.trim());
    }

    setInputValue('');
  };

  const toggleGuessMode = () => {
    if (isGuesser) {
      setIsGuessMode(!isGuessMode);
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStyle = (message: ChatMessage) => {
    switch (message.type) {
      case 'system':
        return {
          backgroundColor: '#e3f2fd',
          borderLeft: '4px solid #2196f3',
          fontStyle: 'italic' as const
        };
      case 'guess':
        return {
          backgroundColor: '#fff3e0',
          borderLeft: '4px solid #ff9800'
        };
      default:
        return {
          backgroundColor: '#f5f5f5',
          borderLeft: '4px solid #4caf50'
        };
    }
  };

  return (
    <div className="chat-box" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '400px',
      border: '2px solid #333',
      borderRadius: '8px',
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <div style={{
        padding: '10px',
        backgroundColor: '#333',
        color: 'white',
        borderRadius: '6px 6px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>Chat & Guesses</h3>
        {isGuesser && (
          <button
            onClick={toggleGuessMode}
            style={{
              padding: '4px 8px',
              backgroundColor: isGuessMode ? '#ff9800' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {isGuessMode ? 'Switch to Chat' : 'Switch to Guess'}
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontStyle: 'italic',
            marginTop: '20px'
          }}>
            No messages yet. {isGuesser ? 'Start guessing!' : 'Start drawing!'}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                ...getMessageStyle(message),
                wordWrap: 'break-word' as const
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <strong style={{ fontSize: '14px' }}>
                  {message.userName}
                  {message.type === 'guess' && ' (guess)'}
                  {message.type === 'system' && ' (system)'}
                </strong>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <div style={{ fontSize: '14px' }}>
                {message.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        padding: '10px',
        borderTop: '1px solid #ddd',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            isGuessMode && isGuesser
              ? "Enter your guess..."
              : "Type a message..."
          }
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            outline: 'none'
          }}
          disabled={!isGuesser && !isGuessMode}
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: isGuessMode && isGuesser ? '#ff9800' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {isGuessMode && isGuesser ? 'Guess' : 'Send'}
        </button>
      </form>

      {/* Instructions */}
      <div style={{
        padding: '8px 10px',
        backgroundColor: '#f0f0f0',
        fontSize: '12px',
        color: '#666',
        borderTop: '1px solid #ddd',
        borderRadius: '0 0 6px 6px'
      }}>
        {isGuesser ? (
          <div>
            <strong>You are the guesser!</strong> Use the "Switch to Guess" button to submit your guesses.
            Watch the drawing and try to figure out the word!
          </div>
        ) : (
          <div>
            <strong>You are the drawer!</strong> Draw the secret word on the canvas.
            The other player will try to guess what you're drawing.
          </div>
        )}
      </div>
    </div>
  );
};
