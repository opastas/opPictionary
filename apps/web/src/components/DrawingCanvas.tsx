import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { DrawingData, DrawingPoint } from 'shared-types';

interface DrawingCanvasProps {
  isDrawer: boolean;
  onDrawingData: (data: DrawingData) => void;
  onCanvasUpdate: (handler: (data: DrawingData) => void) => void;
  onClearCanvas: () => void;
  width?: number;
  height?: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isDrawer,
  onDrawingData,
  onCanvasUpdate,
  onClearCanvas,
  width = 800,
  height = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawingPoint[]>([]);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set default styles
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }, [width, height, brushColor, brushSize]);

  // Handle drawing start
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    const newPoint: DrawingPoint = { x, y, color: brushColor, brushSize };
    setCurrentPath([newPoint]);

    // Draw the initial point
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Send start drawing data
    const drawingData: DrawingData = {
      roomId: 'main-room',
      points: [newPoint],
      action: 'start'
    };
    onDrawingData(drawingData);
  }, [isDrawer, brushColor, brushSize, onDrawingData]);

  // Handle drawing movement
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoint: DrawingPoint = { x, y, color: brushColor, brushSize };
    setCurrentPath(prev => [...prev, newPoint]);

    // Draw the line
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentPath[currentPath.length - 1]?.x || x, currentPath[currentPath.length - 1]?.y || y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Send drawing data in real-time
    const drawingData: DrawingData = {
      roomId: 'main-room',
      points: [newPoint],
      action: 'draw'
    };
    onDrawingData(drawingData);
  }, [isDrawing, isDrawer, brushColor, brushSize, currentPath, onDrawingData]);

  // Handle drawing end
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !isDrawer) return;

    setIsDrawing(false);
    
    // Send drawing data to server
    if (currentPath.length > 0) {
      const drawingData: DrawingData = {
        roomId: 'main-room',
        points: currentPath,
        action: 'end'
      };
      onDrawingData(drawingData);
    }
    
    setCurrentPath([]);
  }, [isDrawing, isDrawer, currentPath, onDrawingData]);

  // Store all received points for proper rendering
  const [receivedPaths, setReceivedPaths] = useState<{ id: string; points: DrawingPoint[] }[]>([]);
  const [currentReceivedPath, setCurrentReceivedPath] = useState<DrawingPoint[]>([]);
  const currentPathId = useRef<string>('');

  // Handle drawing data from other players
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // This will be called when onCanvasUpdate is triggered
    const handleCanvasUpdate = (data: DrawingData) => {
      if (isDrawer) return; // Don't draw if we're the drawer

      if (data.action === 'clear') {
        // Clear canvas and reset paths
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        setReceivedPaths([]);
        setCurrentReceivedPath([]);
        currentPathId.current = '';
        return;
      }

      if (data.action === 'start') {
        // Start new path
        currentPathId.current = `path-${Date.now()}-${Math.random()}`;
        setCurrentReceivedPath(data.points);
        return;
      }

      if (data.action === 'draw') {
        // Add points to current path
        setCurrentReceivedPath(prev => [...prev, ...data.points]);
        return;
      }

      if (data.action === 'end') {
        // End current path and add to completed paths
        if (currentReceivedPath.length > 0) {
          setReceivedPaths(prev => [...prev, {
            id: currentPathId.current,
            points: [...currentReceivedPath]
          }]);
          setCurrentReceivedPath([]);
          currentPathId.current = '';
        }
        return;
      }
    };

    // Store the handler for external use
    (canvas as any).handleCanvasUpdate = handleCanvasUpdate;
  }, [isDrawer, width, height]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    onClearCanvas();

    // Send clear canvas data
    const drawingData: DrawingData = {
      roomId: 'main-room',
      points: [],
      action: 'clear'
    };
    onDrawingData(drawingData);
  }, [width, height, onClearCanvas, onDrawingData]);

  // Render all received paths using dot-based approach (matching mobile)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw all completed paths
    receivedPaths.forEach(path => {
      path.points.forEach(point => {
        ctx.fillStyle = point.color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.brushSize / 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    // Draw current path being drawn
    currentReceivedPath.forEach(point => {
      ctx.fillStyle = point.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.brushSize / 2, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [receivedPaths, currentReceivedPath, width, height]);

  // Handle canvas updates from socket
  const handleCanvasUpdate = useCallback((data: DrawingData) => {
    if (isDrawer) return; // Don't process if we're the drawer

    if (data.action === 'clear') {
      // Clear canvas and reset paths
      setReceivedPaths([]);
      setCurrentReceivedPath([]);
      currentPathId.current = '';
      return;
    }

    if (data.action === 'start') {
      // Start new path
      currentPathId.current = `path-${Date.now()}-${Math.random()}`;
      setCurrentReceivedPath(data.points);
      return;
    }

    if (data.action === 'draw') {
      // Add points to current path
      setCurrentReceivedPath(prev => [...prev, ...data.points]);
      return;
    }

    if (data.action === 'end') {
      // End current path and add to completed paths
      if (currentReceivedPath.length > 0) {
        setReceivedPaths(prev => [...prev, {
          id: currentPathId.current,
          points: [...currentReceivedPath]
        }]);
        setCurrentReceivedPath([]);
        currentPathId.current = '';
      }
      return;
    }
  }, [isDrawer, currentReceivedPath]);

  // Expose the handler for external use
  useEffect(() => {
    onCanvasUpdate(handleCanvasUpdate);
  }, [handleCanvasUpdate, onCanvasUpdate]);

  return (
    <div className="drawing-canvas-container">
      <div className="canvas-controls" style={{ marginBottom: '10px' }}>
        <div className="brush-controls">
          <label>
            Color:
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              disabled={!isDrawer}
            />
          </label>
          <label>
            Size:
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              disabled={!isDrawer}
            />
            <span>{brushSize}px</span>
          </label>
        </div>
        <button
          onClick={clearCanvas}
          disabled={!isDrawer}
          style={{
            padding: '5px 10px',
            marginLeft: '10px',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isDrawer ? 'pointer' : 'not-allowed'
          }}
        >
          Clear Canvas
        </button>
      </div>
      
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          border: '2px solid #333',
          cursor: isDrawer ? 'crosshair' : 'default',
          backgroundColor: '#ffffff',
          borderRadius: '8px'
        }}
      />
      
      {!isDrawer && (
        <div style={{
          textAlign: 'center',
          marginTop: '10px',
          color: '#666',
          fontStyle: 'italic'
        }}>
          You are the guesser. Watch the drawing and try to guess the word!
        </div>
      )}
    </div>
  );
};
