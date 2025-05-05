
'use client';

import { useEffect, useRef } from 'react';
import { drawMinimalistNeuralNetwork } from '../utils/neuralNetworkRenderer';
import { useTheme } from '../contexts/ThemeContext';

const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const { theme } = useTheme();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Clear previous animation
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      
      // Start new animation if canvas is visible
      if (canvas.width > 0 && canvas.height > 0) {
        // Fill with solid background color first
        ctx.fillStyle = theme === 'dark' ? '#0F1520' : '#EDF2F7'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Initialize the neural network
        cleanupRef.current = drawMinimalistNeuralNetwork(canvas, ctx, theme);
      }
    };
    
    // Initial setup
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [theme]);
  
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
      <div 
        className="absolute top-0 left-0 w-full h-full"
        style={{
          background: theme === 'dark' 
            ? '#0F1520' // Deep dark blue background
            : '#EDF2F7', // Light gray-blue background
          opacity: 1,
        }}
      />
      <canvas 
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ 
          pointerEvents: 'none', 
          opacity: 1 // Full opacity for the visualization
        }}
      />
    </div>
  );
};

export default NeuralBackground;
