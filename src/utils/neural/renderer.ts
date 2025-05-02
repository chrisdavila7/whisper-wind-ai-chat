
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
 */
export function drawOrganicNeuralNetwork(
  canvas: HTMLCanvasElement, 
  ctx: CanvasRenderingContext2D, 
  theme: 'light' | 'dark' = 'dark'
) {
  // Create configuration based on theme
  const config = createNetworkConfig(theme);
  
  // State
  let neurons: Neuron[] = [];
  let travelingNodes: TravelingNode[] = [];
  let animationFrameId: number;
  let lastPulseTime = 0;
  
  // Main render function
  function render(timestamp: number) {
    // First completely clear the canvas to prevent trail artifacts between theme changes
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Now apply the semi-transparent overlay for the trail effect - reduced opacity for clearer animation
    ctx.fillStyle = theme === 'dark' 
      ? 'rgba(2, 8, 23, 0.1)' // Semi-transparent dark background for trail effect (reduced from 0.3)
      : 'rgba(255, 255, 255, 0.1)'; // Semi-transparent white background for trail effect (reduced from 0.3)
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections
    neurons.forEach(neuron => {
      // Draw branches first, so they appear behind
      drawBranches(ctx, neuron, config);
      
      // Draw connections
      neuron.connections.forEach(connection => {
        drawConnection(ctx, connection, config);
      });
    });
    
    // Update and draw traveling nodes
    updateAndDrawTravelingNodes(ctx, travelingNodes, neurons, canvas, config);
    
    // Draw neurons on top
    neurons.forEach(neuron => drawNeuron(ctx, neuron, config));
    
    // Apply occasional random pulses to neurons
    if (timestamp - lastPulseTime > config.pulseInterval) {
      // Randomly pulse a neuron
      if (neurons.length > 0) {
        const randomNeuron = neurons[Math.floor(Math.random() * neurons.length)];
        randomNeuron.pulseStrength = 1;
      }
      lastPulseTime = timestamp;
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
    animationFrameId = requestAnimationFrame(render);
  }
  
  // Start the animation
  init();
  
  // Return cleanup function
  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}
