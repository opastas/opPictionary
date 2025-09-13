import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, PanResponder } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { DrawingData, DrawingPoint } from 'shared-types';

interface DrawingCanvasProps {
  isDrawer: boolean;
  onDrawingData: (data: DrawingData) => void;
  onCanvasUpdate: (handler: (data: DrawingData) => void) => void;
  width?: number;
  height?: number;
}

interface PathData {
  id: string;
  points: DrawingPoint[];
  color: string;
  brushSize: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isDrawer,
  onDrawingData,
  onCanvasUpdate,
  width = 350,
  height = 350,
}) => {
  const [paths, setPaths] = useState<PathData[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawingPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const pathIdRef = useRef(0);

  // Convert points to SVG path string
  const pointsToPath = (points: DrawingPoint[]): string => {
    if (points.length === 0) return '';
    
    if (points.length === 1) {
      const point = points[0];
      return `M ${point.x} ${point.y}`;
    }
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  // Handle drawing data from other players
  const handleCanvasUpdate = useCallback((data: DrawingData) => {
    if (isDrawer) return; // Don't draw if we're the drawer

    const newPath: PathData = {
      id: `path-${pathIdRef.current++}`,
      points: data.points,
      color: data.points[0]?.color || '#000000',
      brushSize: data.points[0]?.brushSize || 5,
    };
    
    setPaths(prev => [...prev, newPath]);
  }, [isDrawer]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setPaths([]);
    setCurrentPath([]);
  }, []);

  // Expose the handler for external use
  React.useEffect(() => {
    onCanvasUpdate(handleCanvasUpdate);
  }, [handleCanvasUpdate, onCanvasUpdate]);

  // PanResponder for touch handling
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => isDrawer,
    onMoveShouldSetPanResponder: () => isDrawer,
    
    onPanResponderGrant: (evt) => {
      if (!isDrawer) return;
      
      const { locationX, locationY } = evt.nativeEvent;
      const point: DrawingPoint = {
        x: locationX,
        y: locationY,
        color: brushColor,
        brushSize: brushSize,
      };

      setIsDrawing(true);
      setCurrentPath([point]);
    },
    
    onPanResponderMove: (evt) => {
      if (!isDrawing || !isDrawer) return;

      const { locationX, locationY } = evt.nativeEvent;
      const point: DrawingPoint = {
        x: locationX,
        y: locationY,
        color: brushColor,
        brushSize: brushSize,
      };

      setCurrentPath(prev => [...prev, point]);
    },
    
    onPanResponderRelease: () => {
      if (!isDrawing || !isDrawer) return;

      setIsDrawing(false);
      
      // Add current path to paths
      if (currentPath.length > 0) {
        const newPath: PathData = {
          id: `path-${pathIdRef.current++}`,
          points: currentPath,
          color: brushColor,
          brushSize: brushSize,
        };
        
        setPaths(prev => [...prev, newPath]);
        
        // Send drawing data to server
        const drawingData: DrawingData = {
          roomId: 'main-room',
          points: currentPath,
          action: 'end'
        };
        onDrawingData(drawingData);
      }
      
      setCurrentPath([]);
    },
  });

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Brush Controls */}
      {isDrawer && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 10,
          paddingHorizontal: 20,
        }}>
          <View style={{ marginRight: 15 }}>
            <View style={{
              width: 30,
              height: 30,
              backgroundColor: brushColor,
              borderRadius: 15,
              borderWidth: 2,
              borderColor: '#333',
            }} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{
              height: 20,
              backgroundColor: '#f0f0f0',
              borderRadius: 10,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                width: `${(brushSize / 20) * 100}%`,
                backgroundColor: brushColor,
                borderRadius: 10,
              }} />
            </View>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 5,
            }}>
              <Text style={{ fontSize: 12, color: '#666' }}>1px</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>20px</Text>
            </View>
          </View>
        </View>
      )}

      {/* Drawing Canvas */}
      <View
        {...panResponder.panHandlers}
        style={{
          width,
          height,
          backgroundColor: '#ffffff',
          borderWidth: 2,
          borderColor: '#333',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <Svg width={width} height={height}>
          {/* Render completed paths */}
          {paths.map((path) => (
            <Path
              key={path.id}
              d={pointsToPath(path.points)}
              stroke={path.color}
              strokeWidth={path.brushSize}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          
          {/* Render current path being drawn */}
          {currentPath.length > 0 && (
            <Path
              d={pointsToPath(currentPath)}
              stroke={brushColor}
              strokeWidth={brushSize}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </Svg>
      </View>

      {/* Clear Button */}
      {isDrawer && (
        <View style={{ marginTop: 10 }}>
          <TouchableOpacity
            onPress={clearCanvas}
            style={{
              backgroundColor: '#ff4444',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              Clear Canvas
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      {!isDrawer && (
        <View style={{
          marginTop: 10,
          paddingHorizontal: 20,
          alignItems: 'center',
        }}>
          <Text style={{
            color: '#666',
            fontStyle: 'italic',
            textAlign: 'center',
          }}>
            You are the guesser. Watch the drawing and try to guess the word!
          </Text>
        </View>
      )}
    </View>
  );
};