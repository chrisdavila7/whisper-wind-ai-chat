
import { Neuron, Connection, Signal, Branch, Point } from '../types/neural';

/**
 * Draws and animates an organic neural network on a canvas
 */
export function drawOrganicNeuralNetwork(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  // Configuration
  const config = {
    backgroundColor: '#020817', // Darker background
    neuronColor: {
      base: 'rgba(59, 130, 246, 0.7)', // Blue base
      core: 'rgba(219, 234, 254, 0.9)' // Light blue core
    },
    connectionColor: 'rgba(59, 130, 246, 0.4)',
    signalColor: 'rgba(219, 234, 254, 0.9)',
    
    // Organic parameters
    neuronCount: 25,
    minConnections: 2,
    maxConnections: 6,
    minBranches: 2,
    maxBranches: 5,
    branchLength: { min: 30, max: 120 },
    
    // Animation settings
    flowSpeed: 0.001,
    pulseInterval: 2000, // ms
    glowIntensity: 0.7,
    neuronSize: { min: 3, max: 8 },
    signalSize: { min: 2, max: 4 },
    signalSpeed: { min: 0.002, max: 0.006 },
  };

  // State
  let neurons: Neuron[] = [];
  let signals: Signal[] = [];
  let animationFrameId: number;
  let lastPulseTime = 0;
  
  // Initialize neurons with random positions
  function initializeNeurons() {
    neurons = [];
    // Create neurons with natural distribution
    for (let i = 0; i < config.neuronCount; i++) {
      // Use golden ratio for more natural distribution
      const phi = Math.PI * (3 - Math.sqrt(5));
      const y = 1 - (i / (config.neuronCount - 1)) * 0.8;
      const radius = Math.sqrt(1 - y * y) * 0.8;
      const theta = phi * i;
      
      const x = 0.5 + radius * Math.cos(theta);
      
      neurons.push({
        id: i,
        x: x * canvas.width,
        y: (y * 0.8 + 0.1) * canvas.height,
        size: config.neuronSize.min + Math.random() * (config.neuronSize.max - config.neuronSize.min),
        connections: [],
        branches: [],
        pulseStrength: 0,
      });
    }
  }
  
  // Create branches for neurons
  function createBranches() {
    neurons.forEach(neuron => {
      const branchCount = config.minBranches + Math.floor(Math.random() * (config.maxBranches - config.minBranches + 1));
      
      for (let i = 0; i < branchCount; i++) {
        const angle = Math.PI * 2 * (i / branchCount);
        const length = config.branchLength.min + Math.random() * (config.branchLength.max - config.branchLength.min);
        
        // Create 2-3 control points for organic curve
        const controlPointCount = 2 + Math.floor(Math.random() * 2);
        const controlPoints: Point[] = [];
        
        for (let j = 0; j < controlPointCount; j++) {
          // Add randomness to control points
          const segmentLength = length / controlPointCount;
          const segmentPosition = (j + 1) / (controlPointCount + 1);
          const segmentDistance = segmentPosition * length;
          
          // Add some random variance to the angle
          const ctrlAngle = angle + (Math.random() * 0.6 - 0.3);
          
          controlPoints.push({
            x: neuron.x + Math.cos(ctrlAngle) * segmentDistance,
            y: neuron.y + Math.sin(ctrlAngle) * segmentDistance
          });
        }
        
        neuron.branches.push({
          id: i,
          startX: neuron.x,
          startY: neuron.y,
          controlPoints,
          length,
          width: 0.5 + Math.random() * 1,
          flowPhase: Math.random() * Math.PI * 2 // Random initial phase
        });
      }
    });
  }
  
  // Create connections between neurons
  function createConnections() {
    // First ensure each neuron has at least minConnections
    neurons.forEach(neuron => {
      // Find nearby neurons
      const potentialTargets = neurons
        .filter(n => n.id !== neuron.id)
        .map(n => ({
          neuron: n,
          distance: Math.sqrt(
            Math.pow(n.x - neuron.x, 2) + 
            Math.pow(n.y - neuron.y, 2)
          )
        }))
        .sort((a, b) => a.distance - b.distance);
      
      // Connect to closest neurons
      const connectionCount = config.minConnections + 
        Math.floor(Math.random() * (config.maxConnections - config.minConnections + 1));
      
      for (let i = 0; i < Math.min(connectionCount, potentialTargets.length); i++) {
        const target = potentialTargets[i].neuron;
        const distance = potentialTargets[i].distance;
        
        // Create organic connection with multiple control points
        const controlPointCount = 2 + Math.floor(Math.random() * 3);
        const controlPoints: Point[] = [];
        
        for (let j = 0; j < controlPointCount; j++) {
          const t = (j + 1) / (controlPointCount + 1);
          // Base point along the straight line
          const baseX = neuron.x + (target.x - neuron.x) * t;
          const baseY = neuron.y + (target.y - neuron.y) * t;
          
          // Add organic variance
          const perpX = -(target.y - neuron.y) / distance;
          const perpY = (target.x - neuron.x) / distance;
          const variance = (Math.random() * 0.5 - 0.25) * distance;
          
          controlPoints.push({
            x: baseX + perpX * variance,
            y: baseY + perpY * variance
          });
        }
        
        const connection: Connection = {
          id: neuron.connections.length,
          source: neuron,
          target: target,
          width: 0.5 + Math.random() * 1,
          controlPoints,
          flowSpeed: config.flowSpeed * (0.7 + Math.random() * 0.6),
          flowPhase: Math.random() * Math.PI * 2
        };
        
        neuron.connections.push(connection);
      }
    });
  }
  
  // Create a new signal on a random connection
  function createSignal() {
    // Count all connections across neurons
    const allConnections: Connection[] = [];
    neurons.forEach(neuron => {
      neuron.connections.forEach(connection => {
        allConnections.push(connection);
      });
    });
    
    if (allConnections.length === 0) return;
    
    const connectionIndex = Math.floor(Math.random() * allConnections.length);
    const connection = allConnections[connectionIndex];
    
    signals.push({
      id: signals.length,
      connection,
      position: 0,
      speed: config.signalSpeed.min + Math.random() * 
        (config.signalSpeed.max - config.signalSpeed.min),
      size: config.signalSize.min + Math.random() * 
        (config.signalSize.max - config.signalSize.min),
      intensity: 0.7 + Math.random() * 0.3
    });
    
    // Make source neuron pulse
    connection.source.pulseStrength = 1;
  }
  
  // Draw a neuron with glow effect
  function drawNeuron(neuron: Neuron) {
    // Draw glow if neuron is pulsing
    if (neuron.pulseStrength > 0) {
      const glowRadius = neuron.size * 4;
      const glow = ctx.createRadialGradient(
        neuron.x, neuron.y, neuron.size * 0.5,
        neuron.x, neuron.y, glowRadius
      );
      
      const baseAlpha = neuron.pulseStrength * config.glowIntensity;
      glow.addColorStop(0, `rgba(59, 130, 246, ${baseAlpha})`);
      glow.addColorStop(1, 'rgba(59, 130, 246, 0)');
      
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(neuron.x, neuron.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw neuron body
    ctx.fillStyle = config.neuronColor.base;
    ctx.beginPath();
    ctx.arc(neuron.x, neuron.y, neuron.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw inner core
    ctx.fillStyle = config.neuronColor.core;
    ctx.beginPath();
    ctx.arc(neuron.x, neuron.y, neuron.size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Reduce pulse strength over time
    neuron.pulseStrength *= 0.95;
    if (neuron.pulseStrength < 0.05) neuron.pulseStrength = 0;
  }
  
  // Draw organic branches
  function drawBranches(neuron: Neuron, timestamp: number) {
    neuron.branches.forEach(branch => {
      // Update flow phase
      branch.flowPhase += 0.002;
      if (branch.flowPhase > Math.PI * 2) branch.flowPhase -= Math.PI * 2;
      
      // Draw branch as a bezier curve
      ctx.strokeStyle = config.connectionColor;
      ctx.lineWidth = branch.width * (0.8 + Math.sin(branch.flowPhase) * 0.2);
      
      ctx.beginPath();
      ctx.moveTo(branch.startX, branch.startY);
      
      if (branch.controlPoints.length === 1) {
        // Quadratic curve with one control point
        ctx.quadraticCurveTo(
          branch.controlPoints[0].x, 
          branch.controlPoints[0].y,
          branch.startX + Math.cos(branch.flowPhase) * branch.length,
          branch.startY + Math.sin(branch.flowPhase) * branch.length
        );
      } else if (branch.controlPoints.length >= 2) {
        // Cubic curve with two control points
        ctx.bezierCurveTo(
          branch.controlPoints[0].x,
          branch.controlPoints[0].y,
          branch.controlPoints[1].x,
          branch.controlPoints[1].y,
          branch.startX + Math.cos(branch.flowPhase * 0.5) * branch.length,
          branch.startY + Math.sin(branch.flowPhase * 0.5) * branch.length
        );
      }
      
      ctx.stroke();
    });
  }
  
  // Draw a connection with organic, flowing path
  function drawConnection(connection: Connection, timestamp: number) {
    const { source, target, width, controlPoints, flowPhase } = connection;
    
    // Update flow phase
    connection.flowPhase += connection.flowSpeed;
    if (connection.flowPhase > Math.PI * 2) connection.flowPhase -= Math.PI * 2;
    
    // Draw connection path
    ctx.strokeStyle = config.connectionColor;
    ctx.lineWidth = width * (0.8 + Math.sin(connection.flowPhase) * 0.2); // Pulsing width
    
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    
    if (controlPoints.length === 0) {
      // Simple line
      ctx.lineTo(target.x, target.y);
    } else if (controlPoints.length === 1) {
      // Quadratic curve
      ctx.quadraticCurveTo(
        controlPoints[0].x, 
        controlPoints[0].y, 
        target.x, 
        target.y
      );
    } else if (controlPoints.length === 2) {
      // Cubic curve
      ctx.bezierCurveTo(
        controlPoints[0].x,
        controlPoints[0].y,
        controlPoints[1].x,
        controlPoints[1].y,
        target.x,
        target.y
      );
    } else {
      // Complex path with multiple control points
      for (let i = 0; i < controlPoints.length; i++) {
        const point = controlPoints[i];
        
        // Add slight movement to points for flowing effect
        const offsetX = Math.sin(connection.flowPhase + i * 0.7) * width * 1.5;
        const offsetY = Math.cos(connection.flowPhase + i * 0.7) * width * 1.5;
        
        if (i === 0) {
          ctx.quadraticCurveTo(
            point.x + offsetX,
            point.y + offsetY,
            (point.x + (i + 1 < controlPoints.length ? controlPoints[i + 1].x : target.x)) / 2,
            (point.y + (i + 1 < controlPoints.length ? controlPoints[i + 1].y : target.y)) / 2
          );
        } else if (i < controlPoints.length - 1) {
          ctx.quadraticCurveTo(
            point.x + offsetX,
            point.y + offsetY,
            (point.x + controlPoints[i + 1].x) / 2,
            (point.y + controlPoints[i + 1].y) / 2
          );
        } else {
          ctx.quadraticCurveTo(
            point.x + offsetX,
            point.y + offsetY,
            target.x,
            target.y
          );
        }
      }
    }
    
    ctx.stroke();
  }
  
  // Calculate position along a bezier curve with multiple control points
  function getPositionAlongPath(connection: Connection, t: number): Point {
    const { source, target, controlPoints } = connection;
    
    if (controlPoints.length === 0) {
      // Linear interpolation
      return {
        x: source.x + (target.x - source.x) * t,
        y: source.y + (target.y - source.y) * t
      };
    } else if (controlPoints.length === 1) {
      // Quadratic bezier
      const mt = 1 - t;
      return {
        x: mt * mt * source.x + 2 * mt * t * controlPoints[0].x + t * t * target.x,
        y: mt * mt * source.y + 2 * mt * t * controlPoints[0].y + t * t * target.y
      };
    } else if (controlPoints.length === 2) {
      // Cubic bezier
      const mt = 1 - t;
      return {
        x: mt * mt * mt * source.x + 3 * mt * mt * t * controlPoints[0].x + 
           3 * mt * t * t * controlPoints[1].x + t * t * t * target.x,
        y: mt * mt * mt * source.y + 3 * mt * mt * t * controlPoints[0].y + 
           3 * mt * t * t * controlPoints[1].y + t * t * t * target.y
      };
    } else {
      // For paths with more control points, use De Casteljau's algorithm
      // This is a simplified approach for the complex path
      const segment = Math.min(Math.floor(t * controlPoints.length), controlPoints.length - 1);
      const segmentT = (t * controlPoints.length) % 1;
      
      const p0 = segment === 0 ? source : controlPoints[segment - 1];
      const p1 = controlPoints[segment];
      const p2 = segment === controlPoints.length - 1 ? target : controlPoints[segment + 1];
      
      // Quadratic bezier within the segment
      const mt = 1 - segmentT;
      return {
        x: mt * mt * p0.x + 2 * mt * segmentT * p1.x + segmentT * segmentT * p2.x,
        y: mt * mt * p0.y + 2 * mt * segmentT * p1.y + segmentT * segmentT * p2.y
      };
    }
  }
  
  // Draw a signal moving along a connection
  function drawSignal(signal: Signal, timestamp: number) {
    const { connection, position, size, intensity } = signal;
    
    // Calculate position along the path
    const point = getPositionAlongPath(connection, position);
    
    // Draw signal glow
    const glowRadius = size * 3;
    const glow = ctx.createRadialGradient(
      point.x, point.y, size * 0.5,
      point.x, point.y, glowRadius
    );
    
    glow.addColorStop(0, `rgba(219, 234, 254, ${intensity * 0.8})`);
    glow.addColorStop(1, 'rgba(219, 234, 254, 0)');
    
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(point.x, point.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw signal core
    ctx.fillStyle = config.signalColor;
    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Update signal position
    signal.position += signal.speed;
    
    // If signal reaches target neuron
    if (signal.position >= 1) {
      connection.target.pulseStrength = intensity;
      return true; // Signal has completed its journey
    }
    
    return false;
  }
  
  // Main render function
  function render(timestamp: number) {
    // Clear canvas with slight trail effect for smoother animation
    ctx.fillStyle = 'rgba(2, 8, 23, 0.3)'; // Semi-transparent background for trail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections
    neurons.forEach(neuron => {
      // Draw branches first, so they appear behind
      drawBranches(neuron, timestamp);
      
      // Draw connections
      neuron.connections.forEach(connection => {
        drawConnection(connection, timestamp);
      });
    });
    
    // Draw signals and remove completed ones
    signals = signals.filter(signal => !drawSignal(signal, timestamp));
    
    // Draw neurons on top
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
    createBranches();
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
