
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
    ctx.fillStyle = theme === 'dark' ? '#020817' : '#FFFFFF';
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
      {/* Pearlescent overlay - subtle shimmer effect */}
      <div 
        className="absolute top-0 left-0 w-full h-full animate-gradient-animation"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(circle at 30% 40%, rgba(219, 234, 254, 0.05) 0%, rgba(30, 41, 59, 0.01) 25%, rgba(59, 130, 246, 0.02) 50%, rgba(30, 41, 59, 0.01) 75%, transparent 100%)' 
            : 'radial-gradient(circle at 30% 40%, rgba(219, 234, 254, 0.2) 0%, rgba(243, 244, 246, 0.05) 25%, rgba(59, 130, 246, 0.07) 50%, rgba(243, 244, 246, 0.05) 75%, transparent 100%)',
          backgroundSize: '200% 200%',
          opacity: 0.4,
          mixBlendMode: theme === 'dark' ? 'soft-light' : 'overlay',
        }}
      />
      
      <div 
        className="absolute top-0 left-0 w-full h-full"
        style={{
          background: theme === 'dark' 
            ? 'linear-gradient(172deg, #ccccff 10%, #ccccff 20%, #ccccff 10%, #0d1117, #0d1117, #0d1117, #0d1117)'
            : 'linear-gradient(72deg, #003399 10%, #003399 20%, #003399 10%, #8e97e6, #8e97e6, #8e97e6)',
          backgroundSize: '100% 100%',
          opacity: 0.7,
        }}
      />
      
      {/* Second pearlescent layer with different animation timing */}
      <div 
        className="absolute top-0 left-0 w-full h-full"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(circle at 70% 60%, rgba(219, 234, 254, 0.04) 0%, transparent 60%)' 
            : 'radial-gradient(circle at 70% 60%, rgba(219, 234, 254, 0.15) 0%, transparent 60%)',
          backgroundSize: '150% 150%',
          animation: 'gradient-animation 240s ease-in-out infinite alternate',
          opacity: 0.6,
          mixBlendMode: 'soft-light',
        }}
      />
      
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ pointerEvents: 'none', opacity: 0.8 }}
      />
    </div>
  );
};

export default NeuralBackground;
