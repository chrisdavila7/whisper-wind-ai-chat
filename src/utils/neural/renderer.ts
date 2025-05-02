
import { Neuron, TravelingNode } from '../../types/neural';
import { createNetworkConfig } from './config';
import { 
  initializeNeurons, 
  createBranches, 
  createConnections,
  initializeTravelingNodes 
} from './initialization';
import { 
  drawNeuron, 
  updateAndDrawTravelingNodes, 
  drawBranches, 
  drawConnection 
} from './rendering';

/**
 * Main renderer that sets up and animates the neural network
 * Optimized for performance with conditional rendering and frame skipping
 */
export function drawOrganicNeuralNetwork(
  canvas: HTMLCanvasElement, 
  ctx: CanvasRenderingContext2D, 
  theme: 'light' | 'dark' = 'dark'
) {
  // Create configuration based on theme and device capability
  const config = createNetworkConfig(theme);
  
  // State
  let neurons: Neuron[] = [];
  let travelingNodes: TravelingNode[] = [];
  let animationFrameId: number;
  let lastPulseTime = 0;
  let frameCount = 0;
  
  // Performance optimization variables
  let offscreenCanvas: OffscreenCanvas | null = null;
  let offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
  
  // Set up offscreen canvas if supported for improved performance
  if (config.useOffscreenCanvas && 'OffscreenCanvas' in window) {
    try {
      offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
      offscreenCtx = offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    } catch (e) {
      console.warn('OffscreenCanvas not fully supported, falling back to regular canvas');
    }
  }
  
  // Track animation performance
  let lastFrameTime = 0;
  const fps: number[] = [];
  
  // Main render function with performance optimizations
  function render(timestamp: number) {
    // Calculate FPS for performance monitoring
    if (lastFrameTime) {
      const currentFps = 1000 / (timestamp - lastFrameTime);
      fps.push(currentFps);
      if (fps.length > 60) fps.shift(); // Keep last 60 frames
    }
    lastFrameTime = timestamp;
    
    // Skip frames for performance on lower-end devices
    frameCount++;
    if (frameCount % config.skipFrames !== 0) {
      animationFrameId = requestAnimationFrame(render);
      return;
    }
    
    // Check if document is visible to save resources
    if (document.visibilityState !== 'visible') {
      animationFrameId = requestAnimationFrame(render);
      return;
    }
    
    // Use offscreen canvas if available for better performance
    const renderCtx = offscreenCtx || ctx;
    const renderCanvas = offscreenCanvas || canvas;
    
    // First completely clear the canvas to prevent trail artifacts between theme changes
    renderCtx.fillStyle = config.backgroundColor;
    renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
    
    // Now apply the semi-transparent overlay for the trail effect
    renderCtx.fillStyle = theme === 'dark' 
      ? 'rgba(2, 8, 23, 0.1)' // Semi-transparent dark background for trail effect
      : 'rgba(255, 255, 255, 0.1)'; // Semi-transparent white background for trail effect
    renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
    
    // Draw connections
    neurons.forEach(neuron => {
      // Draw branches first, so they appear behind
      drawBranches(renderCtx, neuron, config);
      
      // Draw connections
      neuron.connections.forEach(connection => {
        drawConnection(renderCtx, connection, config);
      });
    });
    
    // Update and draw traveling nodes
    updateAndDrawTravelingNodes(renderCtx, travelingNodes, neurons, canvas, config);
    
    // Draw neurons on top
    neurons.forEach(neuron => drawNeuron(renderCtx, neuron, config));
    
    // Apply occasional random pulses to neurons
    if (timestamp - lastPulseTime > config.pulseInterval) {
      // Randomly pulse a neuron
      if (neurons.length > 0) {
        const randomNeuron = neurons[Math.floor(Math.random() * neurons.length)];
        randomNeuron.pulseStrength = 1;
      }
      lastPulseTime = timestamp;
    }
    
    // Copy from offscreen canvas to main canvas if using offscreen rendering
    if (offscreenCanvas && offscreenCtx) {
      ctx.drawImage(offscreenCanvas, 0, 0);
    }
    
    // Continue animation
    animationFrameId = requestAnimationFrame(render);
  }
  
  // Initialize and start animation
  function init() {
    // Fully clear the canvas with the current theme background color first
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    neurons = initializeNeurons(canvas, config);
    createBranches(neurons, config);
    createConnections(neurons, config);
    travelingNodes = initializeTravelingNodes(neurons, canvas, config);
    
    // Initialize offscreen canvas if available
    if (offscreenCanvas && offscreenCtx) {
      offscreenCanvas.width = canvas.width;
      offscreenCanvas.height = canvas.height;
    }
    
    // Use visibility API to pause animations when tab is not visible
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    animationFrameId = requestAnimationFrame(render);
  }
  
  // Handle visibility changes to save resources
  function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      cancelAnimationFrame(animationFrameId);
    } else {
      animationFrameId = requestAnimationFrame(render);
    }
  }
  
  // Start the animation
  init();
  
  // Return cleanup function
  return () => {
    cancelAnimationFrame(animationFrameId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up resources
    neurons = [];
    travelingNodes = [];
    offscreenCanvas = null;
    offscreenCtx = null;
  };
}
