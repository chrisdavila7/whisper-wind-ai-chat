
'use client';

import { useEffect, useRef } from 'react';
import { drawOrganicNeuralNetwork } from '../utils/neuralNetworkRenderer';
import { useTheme } from '../contexts/ThemeContext';

const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
        drawOrganicNeuralNetwork(canvas, ctx, theme);
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Ensure the canvas is fully cleared when theme changes
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = theme === 'dark' ? '#020817' : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Start the animation
    const cleanup = drawOrganicNeuralNetwork(canvas, ctx, theme);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cleanup();
    };
  }, [theme]);
  
  return (
    <canvas 
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full -z-10 ${theme === 'dark' ? 'bg-gray-950' : 'bg-white'}`}
      style={{ pointerEvents: 'none', fontFamily: 'inherit' }}
    />
  );
};

export default NeuralBackground;
