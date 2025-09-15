import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, PanResponder, StyleSheet } from 'react-native';
import type { DrawingData, DrawingPoint } from 'shared-types';

interface SimpleCanvasProps {
  isDrawer: boolean;
  onDrawingData?: (data: DrawingData) => void;
  onCanvasUpdate?: (handler: (data: DrawingData) => void) => void;
  width?: number;
  height?: number;
}

export const SimpleCanvas: React.FC<SimpleCanvasProps> = ({
  isDrawer,
  onDrawingData,
  onCanvasUpdate,
  width = 300,
  height = 200,
}) => {
  const [paths, setPaths] = useState<{ id: string; points: DrawingPoint[] }[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawingPoint[]>([]);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showTouchFeedback, setShowTouchFeedback] = useState(false);
  const lastEmitTime = useRef<number>(0);
  const emitThrottle = 16; // ~60fps for better performance
  const pendingPoints = useRef<DrawingPoint[]>([]);
  const batchTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastPoint = useRef<DrawingPoint | null>(null);
  const minDistance = 3.0; // Increased minimum distance to prevent unwanted lines
  const minTouchArea = 5.0; // Minimum touch area to start drawing
  const canvasRef = useRef<View>(null);
  const pathId = useRef<string>('');
  const isDrawingRef = useRef<boolean>(false); // Use ref to avoid stale closures
  const touchStartTime = useRef<number>(0);
  const pathCounter = useRef<number>(0); // Counter for unique path IDs

  // Validate coordinates and check if they're within canvas bounds
  const validateCoordinates = useCallback((x: number, y: number): { x: number; y: number; isValid: boolean } => {
    const isValid = x >= 0 && x <= width && y >= 0 && y <= height;
    return {
      x: Math.max(0, Math.min(x, width)),
      y: Math.max(0, Math.min(y, height)),
      isValid
    };
  }, [width, height]);

  // Check if two points are far enough apart to draw a line
  const shouldDrawLine = useCallback((point1: DrawingPoint, point2: DrawingPoint): boolean => {
    // Don't draw lines to (0,0) or from (0,0) - this prevents unwanted lines to top-left corner
    if ((point1.x === 0 && point1.y === 0) || (point2.x === 0 && point2.y === 0)) {
      return false;
    }
    
    // Don't draw lines if either point is outside canvas bounds
    if (point1.x < 0 || point1.x > width || point1.y < 0 || point1.y > height ||
        point2.x < 0 || point2.x > width || point2.y < 0 || point2.y > height) {
      return false;
    }
    
    const distance = Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
    return distance >= minDistance;
  }, [minDistance, width, height]);

  // Simplified distance check for better performance
  const isPointFarEnough = useCallback((point1: DrawingPoint, point2: DrawingPoint): boolean => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return (dx * dx + dy * dy) >= (minDistance * minDistance);
  }, [minDistance]);

  // Check if touch is in a valid drawing area (not too close to edges)
  const isInValidDrawingArea = useCallback((x: number, y: number): boolean => {
    return x >= minTouchArea && x <= (width - minTouchArea) && 
           y >= minTouchArea && y <= (height - minTouchArea);
  }, [width, height, minTouchArea]);

  // Throttled emit function
  const throttledEmit = useCallback((data: DrawingData) => {
    const now = Date.now();
    if (now - lastEmitTime.current >= emitThrottle) {
      lastEmitTime.current = now;
      if (onDrawingData) {
        onDrawingData(data);
      }
    }
  }, [onDrawingData]);

  // Batched emit function for better performance
  const batchedEmit = useCallback((point: DrawingPoint, action: 'start' | 'draw' | 'end') => {
    if (action === 'start' || action === 'end') {
      // Send start/end actions immediately
      throttledEmit({
        roomId: 'main-room',
        points: [point],
        action
      });
    } else {
      // Send individual points immediately for better sync with web
      throttledEmit({
        roomId: 'main-room',
        points: [point],
        action: 'draw'
      });
    }
  }, [throttledEmit]);

  // Handle canvas updates from socket
  useEffect(() => {
    if (onCanvasUpdate) {
      onCanvasUpdate((data: DrawingData) => {
        if (data.action === 'clear') {
          setPaths([]);
          setCurrentPath([]);
          lastPoint.current = null;
        } else if (data.action === 'end') {
          // End action - just reset current path, don't add any points
          setCurrentPath([]);
          lastPoint.current = null;
        } else if (data.points && data.points.length > 0) {
          // Add incoming drawing data
          const newPath = {
            id: `path-${Date.now()}`,
            points: data.points
          };
          setPaths(prev => [...prev, newPath]);
        }
      });
    }
  }, [onCanvasUpdate]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => isDrawer,
    onMoveShouldSetPanResponder: () => isDrawer,
    
    onPanResponderGrant: (evt) => {
      if (!isDrawer) return;
      const { locationX, locationY } = evt.nativeEvent;
      const validatedCoords = validateCoordinates(locationX, locationY);
      
      // Only start drawing if touch is within canvas bounds
      if (!validatedCoords.isValid) {
        return;
      }
      
      // Additional check to prevent drawing at (0,0) which causes issues
      if (validatedCoords.x === 0 && validatedCoords.y === 0) {
        return;
      }
      
      // Check if touch is in a valid drawing area (not too close to edges)
      if (!isInValidDrawingArea(validatedCoords.x, validatedCoords.y)) {
        return;
      }
      
      const newPoint: DrawingPoint = { 
        x: validatedCoords.x, 
        y: validatedCoords.y, 
        color: currentColor,
        brushSize 
      };
      
          // Generate unique path ID and record touch start time
          pathCounter.current += 1;
          pathId.current = `path-${Date.now()}-${pathCounter.current}-${Math.random().toString(36).substr(2, 9)}`;
          touchStartTime.current = Date.now();
      
      setIsDrawing(true);
      isDrawingRef.current = true;
      setCurrentPath([newPoint]);
      lastPoint.current = newPoint;
      
      // Send start action immediately
      batchedEmit(newPoint, 'start');
    },
    
    onPanResponderMove: (evt) => {
      if (!isDrawer || !isDrawingRef.current) return;
      const { locationX, locationY } = evt.nativeEvent;
      const validatedCoords = validateCoordinates(locationX, locationY);
      
      // Check if touch is still within canvas bounds
      if (!validatedCoords.isValid) {
        // Stop drawing if finger leaves canvas
        setIsDrawing(false);
        isDrawingRef.current = false;
        if (currentPath.length > 0) {
          const newPath = {
            id: pathId.current,
            points: [...currentPath]
          };
          setPaths(prev => [...prev, newPath]);
          setCurrentPath([]);
        }
        lastPoint.current = null;
        throttledEmit({
          roomId: 'main-room',
          points: [],
          action: 'end'
        });
        return;
      }
      
      // Additional check to prevent drawing at (0,0)
      if (validatedCoords.x === 0 && validatedCoords.y === 0) {
        return;
      }
      
      const newPoint: DrawingPoint = { 
        x: validatedCoords.x, 
        y: validatedCoords.y, 
        color: currentColor,
        brushSize 
      };
      
      // Only add point if it's far enough from the last point
      if (!lastPoint.current || isPointFarEnough(lastPoint.current, newPoint)) {
        setCurrentPath(prev => [...prev, newPoint]);
        lastPoint.current = newPoint;
        
        // Send draw action with batching
        batchedEmit(newPoint, 'draw');
      }
    },
    
    onPanResponderRelease: () => {
      if (!isDrawer || !isDrawingRef.current) return;
      
      // Check minimum touch duration to prevent accidental touches
      const touchDuration = Date.now() - touchStartTime.current;
      const minTouchDuration = 50; // 50ms minimum touch duration
      
      setIsDrawing(false);
      isDrawingRef.current = false;
      
      // Only add path if touch was long enough and has enough points
      if (touchDuration >= minTouchDuration && currentPath.length > 0) {
        const newPath = {
          id: pathId.current,
          points: [...currentPath]
        };
        setPaths(prev => [...prev, newPath]);
      }
      
      setCurrentPath([]);
      
      // Reset last point and path ID
      lastPoint.current = null;
      pathId.current = '';
      
      // Send end action immediately (no coordinates needed)
      throttledEmit({
        roomId: 'main-room',
        points: [],
        action: 'end'
      });
    },
    
    onPanResponderTerminate: () => {
      // Handle case where touch is interrupted (e.g., phone call, notification)
      if (isDrawingRef.current) {
        setIsDrawing(false);
        isDrawingRef.current = false;
        if (currentPath.length > 0) {
          const newPath = {
            id: pathId.current,
            points: [...currentPath]
          };
          setPaths(prev => [...prev, newPath]);
          setCurrentPath([]);
        }
        lastPoint.current = null;
        pathId.current = '';
        throttledEmit({
          roomId: 'main-room',
          points: [],
          action: 'end'
        });
      }
    },
  });

  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath([]);
    lastPoint.current = null;
    pathId.current = '';
    setIsDrawing(false);
    isDrawingRef.current = false;
    throttledEmit({
      roomId: 'main-room',
      points: [],
      action: 'clear'
    });
  };

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
  const brushSizes = [2, 4, 6, 8, 10];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isDrawer ? 'Draw something!' : 'Waiting for drawing...'}
      </Text>
      
      <View
        ref={canvasRef}
        {...panResponder.panHandlers}
        style={[styles.canvas, { width, height }]}
      >
        {/* Render completed paths */}
        {paths.map((path) => (
          <View key={path.id} style={styles.pathContainer}>
            {path.points.map((point, index) => (
              <View
                key={`${path.id}-${index}`}
                style={[
                  styles.point,
                  {
                    left: point.x - point.brushSize / 2,
                    top: point.y - point.brushSize / 2,
                    width: point.brushSize,
                    height: point.brushSize,
                    backgroundColor: point.color,
                    borderRadius: point.brushSize / 2,
                  }
                ]}
              />
            ))}
          </View>
        ))}
        
        {/* Render current drawing path */}
        {currentPath.map((point, index) => (
          <View
            key={`current-${index}`}
            style={[
              styles.point,
              {
                left: point.x - point.brushSize / 2,
                top: point.y - point.brushSize / 2,
                width: point.brushSize,
                height: point.brushSize,
                backgroundColor: point.color,
                borderRadius: point.brushSize / 2,
              }
            ]}
          />
        ))}
      </View>

      {isDrawer && (
        <View style={styles.controls}>
          <View style={styles.colorRow}>
            {colors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  currentColor === color && styles.selectedColor
                ]}
                onPress={() => setCurrentColor(color)}
              />
            ))}
          </View>
          <View style={styles.brushRow}>
            <Text style={styles.brushLabel}>Brush Size:</Text>
            {brushSizes.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.brushButton,
                  { width: size * 2, height: size * 2 },
                  brushSize === size && styles.selectedBrush
                ]}
                onPress={() => setBrushSize(size)}
              />
            ))}
          </View>
          <TouchableOpacity onPress={clearCanvas} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear Canvas</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  canvas: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 8,
    position: 'relative',
  },
  point: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2, // Android shadow
  },
  pathContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  controls: {
    marginTop: 15,
    alignItems: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  brushRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  brushLabel: {
    fontSize: 14,
    marginRight: 10,
    color: '#333',
  },
  brushButton: {
    borderRadius: 50,
    marginHorizontal: 3,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#000',
  },
  selectedBrush: {
    borderColor: '#007bff',
    borderWidth: 3,
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#007bff',
  },
  clearButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  clearText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

