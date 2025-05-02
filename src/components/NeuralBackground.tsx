
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { drawOrganicNeuralNetwork } from '../utils/neuralNetworkRenderer';
import { useTheme } from '../contexts/ThemeContext';
import NetworkControls, { NetworkParameters } from './NetworkControls';
import { NeuralNetworkConfig } from '../types/neural';
import { createNetworkConfig } from '../utils/neural/config';

const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const [networkConfig, setNetworkConfig] = useState<NeuralNetworkConfig | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  
  // Initialize the default config when the component mounts
  useEffect(() => {
    setNetworkConfig(createNetworkConfig(theme));
  }, [theme]);
  
  // Handle parameter changes from the controls
  const handleParametersChange = useCallback((parameters: NetworkParameters) => {
    if (!networkConfig) return;
    
    // Calculate min/max connections based on density
    const minConnections = Math.max(1, Math.round(2 * parameters.connectionDensity));
    const maxConnections = Math.max(3, Math.round(6 * parameters.connectionDensity));
    
    // Calculate min/max branches based on density
    const minBranches = Math.max(1, Math.round(2 * parameters.branchDensity));
    const maxBranches = Math.max(2, Math.round(5 * parameters.branchDensity));
    
    setNetworkConfig({
      ...networkConfig,
      neuronCount: parameters.neuronCount,
      minConnections,
      maxConnections,
      minBranches,
      maxBranches,
      flowSpeed: parameters.flowSpeed,
      travelingNodeCount: parameters.travelingNodeCount
    });
  }, [networkConfig]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !networkConfig) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Redraw on resize to fill the screen properly
      if (canvas.width > 0 && canvas.height > 0 && networkConfig) {
        // Cleanup previous animation before starting a new one
        if (cleanupRef.current) {
          cleanupRef.current();
        }
        cleanupRef.current = drawOrganicNeuralNetwork(canvas, ctx, theme, networkConfig);
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Clear the canvas completely when theme or config changes
    ctx.fillStyle = theme === 'dark' ? '#020817' : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Start the animation with the current config
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    cleanupRef.current = drawOrganicNeuralNetwork(canvas, ctx, theme, networkConfig);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [theme, networkConfig]);
  
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10">
      <NetworkControls onParametersChange={handleParametersChange} />
      <div 
        className="absolute top-0 left-0 w-full h-full animate-gradient-animation"
        style={{
          background: theme === 'dark' 
            ? 'linear-gradient(170deg, #0d1117, #0d1117, #ccccff 10%, #ccccff 20%, #ccccff 10%, #0d1117, #0d1117)'
            : 'linear-gradient(#8e97e6, #8e97e6, #003399, #003399, #8e97e6, #8e97e6)',
          backgroundSize: '300% 300%',
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
