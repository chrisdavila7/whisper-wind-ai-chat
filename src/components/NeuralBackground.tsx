'use client';

import { useEffect, useRef, useState } from 'react';
import { drawOrganicNeuralNetwork } from '../utils/neuralNetworkRenderer';
import { useTheme } from '../contexts/ThemeContext';

const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const cleanupFuncRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;
    
    // Set canvas to full screen
    const resizeCanvas = () => {
      // Use device pixel ratio for better clarity on high DPI screens if performance allows
      const dpr = window.devicePixelRatio || 1;
      
      // Get display size of the canvas
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;
      
      // Set canvas size to match display size adjusted for device pixel ratio
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      // We don't scale the context as that would make things too small on high DPI screens
      // Just use 1:1 pixel mapping for better performance
      
      // Redraw on resize to fill the screen properly
      if (canvas.width > 0 && canvas.height > 0 && isVisible) {
        // Clear the canvas completely when theme changes
        ctx.fillStyle = theme === 'dark' ? '#020817' : '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Restart the animation on resize
        if (cleanupFuncRef.current) {
          cleanupFuncRef.current();
        }
        
        // Store new cleanup function in the ref
        cleanupFuncRef.current = drawOrganicNeuralNetwork(canvas, ctx, theme);
      }
    };
    
    // Visibility change handler
    const handleVisibilityChange = () => {
      const isPageVisible = document.visibilityState === 'visible';
      setIsVisible(isPageVisible);
      
      if (isPageVisible) {
        // Page became visible again, restart animation
        resizeCanvas();
      } else {
        // Page is hidden, stop animation to save resources
        if (cleanupFuncRef.current) {
          cleanupFuncRef.current();
          cleanupFuncRef.current = null;
        }
      }
    };
    
    // Initial setup
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initialize network
    cleanupFuncRef.current = drawOrganicNeuralNetwork(canvas, ctx, theme);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (cleanupFuncRef.current) {
        cleanupFuncRef.current();
        cleanupFuncRef.current = null;
      }
    };
  }, [theme, isVisible]);
  
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10">
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
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ pointerEvents: 'none', opacity: 0.8 }}
      />
    </div>
  );
};

export default NeuralBackground;
