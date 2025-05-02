
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

// Type definition for canvas context that works with both standard and offscreen canvas
// Using a more generic type to allow both context types
type CanvasContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

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
  let lastFrameTime = 0;
  
  // Performance optimization variables
  let offscreenCanvas: OffscreenCanvas | null = null;
  let offscreenCtx: CanvasContext | null = null;
  
  // Set up offscreen canvas if supported for improved performance
  if (config.useOffscreenCanvas && 'OffscreenCanvas' in window) {
    try {
      offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
      const tempCtx = offscreenCanvas.getContext('2d');
      
      if (tempCtx) {
        // Safe assignment - both types support the rendering methods we need
        offscreenCtx = tempCtx;
      }
    } catch (e) {
      console.warn('OffscreenCanvas not fully supported, falling back to regular canvas');
    }
  }
  
  // Main render function with performance optimizations
  function render(timestamp: number) {
    // Calculate delta time for smoother animations regardless of frame rate
    const deltaTime = lastFrameTime ? (timestamp - lastFrameTime) / 16.67 : 1; // normalize to ~60fps
    lastFrameTime = timestamp;
    
    // Skip frames for performance on lower-end devices
    frameCount++;
    if (frameCount % config.skipFrames !== 0) {
      animationFrameId = requestAnimationFrame(render);
      return;
    }
    
    // Throttle animation when tab is not visible or when scrolling
    if (document.visibilityState !== 'visible') {
      animationFrameId = requestAnimationFrame(render);
      return;
    }
    
    // Use offscreen canvas if available for better performance
    const renderCtx = offscreenCtx || ctx;
    const renderCanvas = offscreenCanvas || canvas;
    
    // Only clear the canvas once per frame
    renderCtx.fillStyle = config.backgroundColor;
    renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
    
    // Draw connections - most resource intensive part, draw only a subset per frame
    const connectionsPerFrame = 5; // Limit connections rendered per frame
    let connectionsDrawn = 0;
    
    neurons.forEach((neuron, index) => {
      // Only draw branches for every other neuron to improve performance
      if (index % 2 === 0) {
        drawBranches(renderCtx, neuron, config);
      }
      
      // Limit number of connections drawn per frame
      neuron.connections.forEach(connection => {
        if (connectionsDrawn < connectionsPerFrame) {
          drawConnection(renderCtx, connection, config);
          connectionsDrawn++;
        }
      });
    });
    
    // Update and draw traveling nodes - optimized to update fewer nodes
    updateAndDrawTravelingNodes(renderCtx, travelingNodes, neurons, canvas, config);
    
    // Draw neurons on top - stagger neuron updates across frames
    neurons.forEach((neuron, index) => {
      // Only update and draw some neurons each frame based on frame count
      if (index % 3 === frameCount % 3) {
        drawNeuron(renderCtx, neuron, config);
      }
    });
    
    // Less frequent pulses for better performance
    if (timestamp - lastPulseTime > config.pulseInterval) {
      // Randomly pulse a neuron, but less frequently
      if (neurons.length > 0 && Math.random() > 0.3) {
        const randomNeuron = neurons[Math.floor(Math.random() * neurons.length)];
        randomNeuron.pulseStrength = 1;
      }
      lastPulseTime = timestamp;
    }
    
    // Copy from offscreen canvas to main canvas if using offscreen rendering
    if (offscreenCanvas && offscreenCtx) {
      ctx.drawImage(offscreenCanvas, 0, 0);
    }
    
    // Continue animation with a throttled frame rate if low power device
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
      lastFrameTime = 0; // Reset time tracking
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
