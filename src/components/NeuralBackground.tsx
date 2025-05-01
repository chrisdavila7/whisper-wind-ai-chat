
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
          ? 'radial-gradient(ellipse at center, #339933, #0a1428, #131b2e)' 
          : 'linear-gradient(#79a1ff, #e5deff, #d6bcfa)',
        backgroundSize: '400% 400%',
        animation: 'gradient-animation 2s ease-in-out infinite',
        filter: 'blur(0.5px)',
        opacity: 0.9,
        willChange: 'background-position'
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
