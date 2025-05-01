
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
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cleanup();
    };
  }, [theme]);
  
  return (
    <div 
      className={`fixed top-0 left-0 w-full h-full -z-10`}
      style={{
        background: theme === 'dark' 
          ? 'radial-gradient(ellipse at center, #79a1ff 0%, #0a1428 50%, #131b2e 100%)' 
          : 'radial-gradient(ellipse at center, #79a1ff 0%, #e5deff 50%, #d6bcfa 100%)',
        backgroundSize: '400% 400%',
        animation: 'radialMove 5s ease infinite'
      }}
    >
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ pointerEvents: 'none', opacity: 0.8 }}
      />
    </div>
  );
};

export default NeuralBackground;
