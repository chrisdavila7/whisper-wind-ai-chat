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
    
    // Set canvas to full screen - use twice the dimensions for retina-like quality
    // while keeping the scale transform to make elements appear zoomed out
    const resizeCanvas = () => {
      // Double the canvas dimensions to maintain quality when scaled
      canvas.width = window.innerWidth * 2;
      canvas.height = window.innerHeight * 2;
      
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
    const forceRefreshInterval = setInterval(() => {
      if (canvas && ctx) {
        // Reduced opacity for a more subtle trail effect
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
      {/* Gradient background - covers the entire viewport */}
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
      {/* Neural network canvas - scaled down to appear further away while covering full viewport */}
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          pointerEvents: 'none', 
          opacity: 0.9,
          // Scale the rendered content to appear zoomed out, but keep covering full viewport
          transform: 'scale(0.5)',
          // Double the size to ensure it fills the viewport when scaled down
          width: '200%',
          height: '200%',
          // Center the expanded canvas
          position: 'absolute',
          top: '-50%',
          left: '-50%',
        }}
      />
    </div>
  );
};

export default NeuralBackground;
