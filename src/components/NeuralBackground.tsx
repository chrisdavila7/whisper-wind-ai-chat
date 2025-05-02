
'use client';

import { useEffect, useRef, useState } from 'react';
import { drawOrganicNeuralNetwork } from '../utils/neuralNetworkRenderer';
import { useTheme } from '../contexts/ThemeContext';

const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Use IntersectionObserver to check if component is visible
    // This prevents animations from running when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    const element = document.body;
    if (element) {
      observer.observe(element);
    }
    
    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    
    // Optimize canvas rendering for high-DPI displays
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Set canvas to full screen with optimized dimensions based on device
    const resizeCanvas = () => {
      if (!canvas) return;
      
      // Get visual viewport size (accounts for mobile browser UI)
      const viewportWidth = window.visualViewport?.width || window.innerWidth;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      
      // Size for physical pixels (accounting for device pixel ratio)
      canvas.width = viewportWidth * devicePixelRatio * 2;
      canvas.height = viewportHeight * devicePixelRatio * 2;
      
      // Apply the scale for retina/high-DPI displays
      ctx.scale(devicePixelRatio, devicePixelRatio);
      
      // Redraw on resize to fill the screen properly
      if (canvas.width > 0 && canvas.height > 0 && isVisible) {
        drawOrganicNeuralNetwork(canvas, ctx, theme);
      }
    };
    
    // Optimize resize event with debouncing
    let resizeTimeout: number;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resizeCanvas, 100);
    };
    
    resizeCanvas();
    window.addEventListener('resize', handleResize);
    
    // Use a more efficient way of clearing the screen
    if (isVisible) {
      ctx.fillStyle = theme === 'dark' ? '#020817' : '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Start the animation only if visible
      const cleanup = drawOrganicNeuralNetwork(canvas, ctx, theme);
      
      // Use a more memory-efficient way to create trails
      // Reset interval only when animation is visible
      const forceRefreshInterval = setInterval(() => {
        if (canvas && ctx && document.visibilityState === 'visible') {
          // Reduced opacity for a more subtle trail effect
          ctx.fillStyle = theme === 'dark' ? 'rgba(2, 8, 23, 0.08)' : 'rgba(255, 255, 255, 0.08)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }, 3000);
      
      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        clearInterval(forceRefreshInterval);
        cleanup();
      };
    }
  }, [theme, isVisible]);
  
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10">
      {/* Gradient background - covers the entire viewport */}
      <div 
        className="absolute top-0 left-0 w-full h-full will-change-transform"
        style={{
          background: theme === 'dark' 
            ? 'linear-gradient(170deg, #0d1117, #0d1117, #ccccff 10%, #ccccff 20%, #ccccff 10%, #0d1117, #0d1117)'
            : 'linear-gradient(#8e97e6, #8e97e6, #003399, #003399, #8e97e6, #8e97e6)',
          backgroundSize: '300% 300%',
          opacity: 0.6, // Reduced from 0.7 to make the neural network more visible
          animationName: 'gradientAnimation',
          animationDuration: '15s',
          animationTimingFunction: 'ease',
          animationIterationCount: 'infinite',
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
          // Optimize rendering
          imageRendering: 'high-quality',
          willChange: 'transform',
        }}
      />
    </div>
  );
};

export default NeuralBackground;
