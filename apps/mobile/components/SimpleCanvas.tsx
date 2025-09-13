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
  const lastEmitTime = useRef<number>(0);
  const emitThrottle = 16; // ~60fps
  const pendingPoints = useRef<DrawingPoint[]>([]);
  const batchTimeout = useRef<NodeJS.Timeout | null>(null);

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
      // Batch draw actions
      pendingPoints.current.push(point);
      
      // Clear existing timeout
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
      
      // Set new timeout to send batched points
      batchTimeout.current = setTimeout(() => {
        if (pendingPoints.current.length > 0 && onDrawingData) {
          onDrawingData({
            roomId: 'main-room',
            points: [...pendingPoints.current],
            action: 'draw'
          });
          pendingPoints.current = [];
        }
      }, 50); // Send batched points every 50ms
    }
  }, [throttledEmit, onDrawingData]);

  // Handle canvas updates from socket
  useEffect(() => {
    if (onCanvasUpdate) {
      onCanvasUpdate((data: DrawingData) => {
        if (data.action === 'clear') {
          setPaths([]);
          setCurrentPath([]);
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
      const newPoint: DrawingPoint = { 
        x: locationX, 
        y: locationY, 
        color: currentColor,
        brushSize 
      };
      setCurrentPath([newPoint]);
      
      // Send start action immediately
      batchedEmit(newPoint, 'start');
    },
    
    onPanResponderMove: (evt) => {
      if (!isDrawer) return;
      const { locationX, locationY } = evt.nativeEvent;
      const newPoint: DrawingPoint = { 
        x: locationX, 
        y: locationY, 
        color: currentColor,
        brushSize 
      };
      setCurrentPath(prev => [...prev, newPoint]);
      
      // Send draw action with batching
      batchedEmit(newPoint, 'draw');
    },
    
    onPanResponderRelease: () => {
      if (!isDrawer) return;
      
      // Add current path to paths
      if (currentPath.length > 0) {
        const newPath = {
          id: `path-${Date.now()}`,
          points: currentPath
        };
        setPaths(prev => [...prev, newPath]);
        setCurrentPath([]);
      }
      
      // Send end action immediately
      batchedEmit({ x: 0, y: 0, color: currentColor, brushSize }, 'end');
    },
  });

  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath([]);
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
        {...panResponder.panHandlers}
        style={[styles.canvas, { width, height }]}
      >
        {paths.map((path) => (
          <View key={path.id} style={styles.pathContainer}>
            {path.points.map((point, index) => {
              const nextPoint = path.points[index + 1];
              return (
                <View key={`${path.id}-${index}`}>
                  {/* Draw circle for the point */}
                  <View
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
                  {/* Draw line to next point if it exists */}
                  {nextPoint && (
                    <View
                      style={[
                        styles.line,
                        {
                          left: point.x,
                          top: point.y,
                          width: Math.sqrt(
                            Math.pow(nextPoint.x - point.x, 2) + 
                            Math.pow(nextPoint.y - point.y, 2)
                          ),
                          height: point.brushSize,
                          backgroundColor: point.color,
                          transform: [
                            {
                              rotate: `${Math.atan2(
                                nextPoint.y - point.y,
                                nextPoint.x - point.x
                              )}rad`
                            }
                          ],
                        }
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ))}
        {currentPath.map((point, index) => {
          const nextPoint = currentPath[index + 1];
          return (
            <View key={`current-${index}`}>
              {/* Draw circle for the point */}
              <View
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
              {/* Draw line to next point if it exists */}
              {nextPoint && (
                <View
                  style={[
                    styles.line,
                    {
                      left: point.x,
                      top: point.y,
                      width: Math.sqrt(
                        Math.pow(nextPoint.x - point.x, 2) + 
                        Math.pow(nextPoint.y - point.y, 2)
                      ),
                      height: point.brushSize,
                      backgroundColor: point.color,
                      transform: [
                        {
                          rotate: `${Math.atan2(
                            nextPoint.y - point.y,
                            nextPoint.x - point.x
                          )}rad`
                        }
                      ],
                    }
                  ]}
                />
              )}
            </View>
          );
        })}
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
  },
  line: {
    position: 'absolute',
    transformOrigin: '0 50%',
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

