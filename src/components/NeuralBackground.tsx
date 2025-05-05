
'use client';

import { useEffect, useRef } from 'react';
import { drawOrganicNeuralNetwork } from '../utils/neuralNetworkRenderer';
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
      
      // Redraw on resize to fill the screen properly
      if (canvas.width > 0 && canvas.height > 0) {
        // Store the previous cleanup function if it exists
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }
        
        // Start a new animation
        cleanupRef.current = drawOrganicNeuralNetwork(canvas, ctx, theme);
      }
    };
    
    // Initial setup
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Clear the canvas completely when theme changes
    ctx.fillStyle = theme === 'dark' ? '#1A1F2C' : '#F6F7F9'; // Flatter background colors
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // If we haven't created the animation in the resize function,
    // start it here and store the cleanup function
    if (!cleanupRef.current) {
      cleanupRef.current = drawOrganicNeuralNetwork(canvas, ctx, theme);
    }
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [theme]);
  
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10">
      <div 
        className="absolute top-0 left-0 w-full h-full"
        style={{
          background: theme === 'dark' 
            ? '#1A1F2C' // Flat dark background
            : '#F6F7F9', // Flat light background
          opacity: 1,
        }}
      />
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          pointerEvents: 'none', 
          opacity: 0.7 // Slightly reduced opacity for a more subtle look
        }}
      />
    </div>
  );
};

export default NeuralBackground;
