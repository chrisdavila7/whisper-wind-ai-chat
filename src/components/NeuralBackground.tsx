
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
      {/* Primary pearlescent layer - more prominent shimmer effect */}
      <div 
        className="absolute top-0 left-0 w-full h-full animate-gradient-animation pointer-events-none"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(circle at 30% 40%, rgba(219, 234, 254, 0.15) 0%, rgba(30, 41, 59, 0.04) 25%, rgba(59, 130, 246, 0.08) 50%, rgba(30, 41, 59, 0.04) 75%, transparent 100%)' 
            : 'radial-gradient(circle at 30% 40%, rgba(219, 234, 254, 0.4) 0%, rgba(243, 244, 246, 0.12) 25%, rgba(59, 130, 246, 0.15) 50%, rgba(243, 244, 246, 0.12) 75%, transparent 100%)',
          backgroundSize: '200% 200%',
          opacity: theme === 'dark' ? 0.7 : 0.6,
          mixBlendMode: theme === 'dark' ? 'soft-light' : 'overlay',
        }}
      />
      
      {/* Base color gradient */}
      <div 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          background: theme === 'dark' 
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.7) 50%, rgba(23, 37, 84, 0.6) 100%)'
            : 'linear-gradient(135deg, rgba(243, 244, 246, 0.5) 0%, rgba(219, 234, 254, 0.7) 50%, rgba(191, 219, 254, 0.5) 100%)',
          opacity: 0.8,
        }}
      />
      
      {/* Second pearlescent layer with different animation timing */}
      <div 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(circle at 70% 60%, rgba(219, 234, 254, 0.12) 0%, rgba(59, 130, 246, 0.05) 30%, transparent 70%)' 
            : 'radial-gradient(circle at 70% 60%, rgba(219, 234, 254, 0.3) 0%, rgba(59, 130, 246, 0.1) 30%, transparent 70%)',
          backgroundSize: '150% 150%',
          animation: 'gradient-animation 180s ease-in-out infinite alternate',
          opacity: theme === 'dark' ? 0.8 : 0.7,
          mixBlendMode: theme === 'dark' ? 'soft-light' : 'overlay',
        }}
      />
      
      {/* Third pearlescent layer for enhanced depth */}
      <div 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(circle at 20% 30%, rgba(191, 219, 254, 0.1) 0%, transparent 50%)' 
            : 'radial-gradient(circle at 20% 30%, rgba(191, 219, 254, 0.25) 0%, transparent 50%)',
          backgroundSize: '120% 120%',
          animation: 'gradient-animation 210s ease-in-out infinite reverse',
          opacity: theme === 'dark' ? 0.7 : 0.6,
          mixBlendMode: 'soft-light',
        }}
      />
      
      {/* Small floating bubble-like highlights */}
      <div 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 15%), radial-gradient(circle at 40% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 10%)' 
            : 'radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.4) 0%, transparent 15%), radial-gradient(circle at 40% 70%, rgba(255, 255, 255, 0.25) 0%, transparent 10%)',
          backgroundSize: '120% 120%',
          animation: 'gradient-animation 150s ease-in-out infinite alternate-reverse',
          opacity: theme === 'dark' ? 0.7 : 0.8,
        }}
      />
      
      <canvas 
        ref={canvasRef}
        className="w-full h-full pointer-events-none"
        style={{ opacity: 0.8 }}
      />
    </div>
  );
};

export default NeuralBackground;
