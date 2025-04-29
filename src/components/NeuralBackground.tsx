
'use client';

import { useEffect, useRef } from 'react';
import { drawNeuralNetwork } from '../utils/neuralNetworkRenderer';

const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Start the animation
    const cleanup = drawNeuralNetwork(canvas, ctx);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cleanup();
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default NeuralBackground;
