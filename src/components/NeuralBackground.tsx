
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
    
    // Clear the canvas completely when theme changes
    ctx.fillStyle = theme === 'dark' ? '#020817' : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Start the animation
    const cleanup = drawOrganicNeuralNetwork(canvas, ctx, theme);
    
    // Force a refresh of the canvas every few seconds if animation isn't working properly
    // Reduced interval from 5000ms to 3000ms to freshen the display more often
    const forceRefreshInterval = setInterval(() => {
      if (canvas && ctx) {
        // Reduced opacity further for a more subtle trail effect
        ctx.fillStyle = theme === 'dark' ? 'rgba(2, 8, 23, 0.08)' : 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }, 3000);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(forceRefreshInterval);
      cleanup();
    };
  }, [theme]);
  
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10">
      <div 
        className="absolute top-0 left-0 w-full h-full animate-gradient-animation"
        style={{
          background: theme === 'dark' 
            ? 'linear-gradient(170deg, #0d1117, #0d1117, #ccccff 10%, #ccccff 20%, #ccccff 10%, #0d1117, #0d1117)'
            : 'linear-gradient(#8e97e6, #8e97e6, #003399, #003399, #8e97e6, #8e97e6)',
          backgroundSize: '300% 300%',
          opacity: 0.6, // Reduced from 0.7 to make the neural network more visible
        }}
      />
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          pointerEvents: 'none', 
          opacity: 0.9, // Increased from 0.8 to make neural network more visible
          transform: 'scale(0.5)' // Changed from 1.1 to 0.5 to zoom out by approximately 100% (make elements appear further away)
        }}
      />
    </div>
  );
};

export default NeuralBackground;
