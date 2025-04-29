
import { Neuron, NeuronConnection, Signal } from '../types/neural';

/**
 * Draws and animates a neural network on a canvas
 */
export function drawNeuralNetwork(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  // Configuration
  const config = {
    backgroundColor: '#171717',
    neuronColor: '#0EA5E9',
    connectionColor: '#0EA5E9',
    signalColor: '#E0F2FE',
    neuronCount: 15,
    connectionCount: 40,
    signalSpeed: 0.5,
    pulseInterval: 1000, // ms
    glowIntensity: 0.8,
    neuronSize: { min: 4, max: 12 },
  };

  // State
  let neurons: Neuron[] = [];
  let connections: NeuronConnection[] = [];
  let signals: Signal[] = [];
  let animationFrameId: number;
  let lastPulseTime = 0;
  
  // Initialize neurons with random positions
  function initializeNeurons() {
    neurons = [];
    for (let i = 0; i < config.neuronCount; i++) {
      neurons.push({
        id: i,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: config.neuronSize.min + Math.random() * (config.neuronSize.max - config.neuronSize.min),
        connections: [],
        pulseStrength: 0,
      });
    }
  }
  
  // Create connections between neurons
  function createConnections() {
    connections = [];
    
    // First ensure each neuron has at least one connection
    for (let i = 0; i < neurons.length; i++) {
      let target = i;
      while (target === i) {
        target = Math.floor(Math.random() * neurons.length);
      }
      
      const connection = {
        id: connections.length,
        source: neurons[i],
        target: neurons[target],
        width: 0.5 + Math.random() * 1.5,
        controlPoints: createControlPoints(neurons[i], neurons[target])
      };
      
      connections.push(connection);
      neurons[i].connections.push(connection);
    }
    
    // Add additional random connections
    for (let i = 0; i < config.connectionCount - neurons.length; i++) {
      const sourceIndex = Math.floor(Math.random() * neurons.length);
      let targetIndex = sourceIndex;
      while (targetIndex === sourceIndex) {
        targetIndex = Math.floor(Math.random() * neurons.length);
      }
      
      const connection = {
        id: connections.length,
        source: neurons[sourceIndex],
        target: neurons[targetIndex],
        width: 0.5 + Math.random() * 1.5,
        controlPoints: createControlPoints(neurons[sourceIndex], neurons[targetIndex])
      };
      
      connections.push(connection);
      neurons[sourceIndex].connections.push(connection);
    }
  }
  
  // Create control points for curved connections
  function createControlPoints(source: Neuron, target: Neuron) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate control point offset (perpendicular to the direct line)
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    
    // Add some randomness to the curve
    const curveIntensity = distance * (0.2 + Math.random() * 0.3); // 20-50% of distance
    
    // Calculate normal vector (perpendicular)
    const nx = -dy / distance;
    const ny = dx / distance;
    
    // Create control point
    return {
      x: midX + nx * curveIntensity,
      y: midY + ny * curveIntensity
    };
  }
  
  // Create a new signal on a random connection
  function createSignal() {
    if (connections.length === 0) return;
    
    const connectionIndex = Math.floor(Math.random() * connections.length);
    const connection = connections[connectionIndex];
    
    signals.push({
      id: signals.length,
      connection,
      position: 0, // 0 to 1 along the connection
      speed: 0.003 + Math.random() * 0.004,
      size: 3 + Math.random() * 2
    });
    
    // Make source neuron pulse
    connection.source.pulseStrength = 1;
  }
  
  // Draw a neuron with glow effect
  function drawNeuron(neuron: Neuron) {
    // Draw glow
    if (neuron.pulseStrength > 0) {
      const glow = ctx.createRadialGradient(
        neuron.x, neuron.y, 0,
        neuron.x, neuron.y, neuron.size * 3
      );
      glow.addColorStop(0, `rgba(14, 165, 233, ${neuron.pulseStrength * config.glowIntensity})`);
      glow.addColorStop(1, 'rgba(14, 165, 233, 0)');
      
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(neuron.x, neuron.y, neuron.size * 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Reduce pulse strength over time
      neuron.pulseStrength *= 0.95;
      if (neuron.pulseStrength < 0.05) neuron.pulseStrength = 0;
    }
    
    // Draw neuron body
    ctx.fillStyle = config.neuronColor;
    ctx.beginPath();
    ctx.arc(neuron.x, neuron.y, neuron.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw inner highlight
    ctx.fillStyle = config.signalColor;
    ctx.beginPath();
    ctx.arc(neuron.x, neuron.y, neuron.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw a connection with curved path
  function drawConnection(connection: NeuronConnection) {
    const { source, target, width, controlPoints } = connection;
    
    ctx.strokeStyle = config.connectionColor;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.quadraticCurveTo(controlPoints.x, controlPoints.y, target.x, target.y);
    ctx.stroke();
  }
  
  // Draw a signal moving along a connection
  function drawSignal(signal: Signal) {
    const { connection, position, size } = signal;
    const { source, target, controlPoints } = connection;
    
    // Calculate position along the quadratic curve
    // P = (1-t)²P1 + 2(1-t)tP2 + t²P3
    const t = position;
    const mt = 1 - t;
    
    const x = mt * mt * source.x + 
              2 * mt * t * controlPoints.x + 
              t * t * target.x;
    const y = mt * mt * source.y + 
              2 * mt * t * controlPoints.y + 
              t * t * target.y;
    
    // Draw signal glow
    const glow = ctx.createRadialGradient(
      x, y, 0,
      x, y, size * 2
    );
    glow.addColorStop(0, `rgba(14, 165, 233, ${config.glowIntensity})`);
    glow.addColorStop(1, 'rgba(14, 165, 233, 0)');
    
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, size * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw signal core
    ctx.fillStyle = config.signalColor;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // Update signal position
    signal.position += signal.speed;
    
    // If signal reaches target neuron
    if (signal.position >= 1) {
      connection.target.pulseStrength = 1;
      return true; // Signal has completed its journey
    }
    
    return false;
  }
  
  // Main render function
  function render(timestamp: number) {
    // Clear canvas
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections
    connections.forEach(drawConnection);
    
    // Draw signals and remove completed ones
    signals = signals.filter(signal => !drawSignal(signal));
    
    // Draw neurons
    neurons.forEach(drawNeuron);
    
    // Generate new signals periodically
    if (timestamp - lastPulseTime > config.pulseInterval) {
      createSignal();
      lastPulseTime = timestamp;
    }
    
    // Continue animation
    animationFrameId = requestAnimationFrame(render);
  }
  
  // Initialize and start animation
  function init() {
    initializeNeurons();
    createConnections();
    animationFrameId = requestAnimationFrame(render);
  }
  
  // Start the animation
  init();
  
  // Return cleanup function
  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}
