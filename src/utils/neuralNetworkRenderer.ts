
import { Neuron, Connection, Branch, Point } from '../types/neural';

/**
 * Draws and animates an organic neural network on a canvas
 */
export function drawOrganicNeuralNetwork(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, theme: 'light' | 'dark' = 'dark') {
  // Configuration
  const config = {
    backgroundColor: theme === 'dark' ? '#020817' : '#FFFFFF', // Background color based on theme
    neuronColor: {
      base: theme === 'dark' 
        ? 'rgba(59, 130, 246, 0.7)' // Blue base for dark mode
        : 'rgba(59, 130, 246, 0.6)', // Slightly more visible blue for light mode
      core: theme === 'dark'
        ? 'rgba(219, 234, 254, 0.9)' // Light blue core for dark mode
        : 'rgba(29, 78, 216, 0.85)' // Darker blue core for light mode for better contrast
    },
    connectionColor: theme === 'dark' 
      ? 'rgba(59, 130, 246, 0.4)' 
      : 'rgba(59, 130, 246, 0.3)', // Slightly more transparent for light mode
    
    // Organic parameters with increased spacing (35% more)
    neuronCount: 20, // Reduced count for less visual clutter
    minConnections: 2, // Reduced for less clutter
    maxConnections: 6, // Reduced for less clutter
    minBranches: 2,
    maxBranches: 5,
    branchLength: { min: 30, max: 120 },
    
    // Animation settings
    flowSpeed: 0.0004, // Slowed down by 60%
    pulseInterval: 3000, // Increased interval for slower pace
    glowIntensity: theme === 'dark' ? 0.7 : 0.5, // Reduced glow intensity for light theme
    neuronSize: { min: 3, max: 8 },
    
    // Traveling node settings - slower by 65%
    travelingNodeCount: 15,
    travelingNodeSpeed: { min: 0.105, max: 0.28 }, // Reduced by 65% from {min: 0.3, max: 0.8}
    travelingNodeGlowDuration: 800, // How long the glow effect lasts in ms
  };

  // State
  let neurons: Neuron[] = [];
  let travelingNodes: TravelingNode[] = [];
  let animationFrameId: number;
  let lastPulseTime = 0;
  
  // Interface for traveling nodes
  interface TravelingNode {
    x: number;
    y: number;
    targetNeuron: Neuron;
    progress: number;  // 0 to 1, representing progress to target
    speed: number;
    width: number;
    active: boolean;
  }
  
  // Initialize neurons with improved distribution and more spacing
  function initializeNeurons() {
    neurons = [];
    // Create neurons with better spherical distribution and increased spacing
    for (let i = 0; i < config.neuronCount; i++) {
      // Use spherical fibonacci distribution for better 360° coverage
      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      const i_normalized = i / config.neuronCount;
      const theta = 2 * Math.PI * i_normalized * goldenRatio;
      
      // Use cosine for y to distribute more evenly
      const phi = Math.acos(1 - 2 * i_normalized);
      
      // Spread neurons out further (1.215 instead of 0.9 - 35% more spacing)
      const x = 0.5 + 1.215 * Math.sin(phi) * Math.cos(theta);
      const y = 0.5 + 1.215 * Math.sin(phi) * Math.sin(theta);
      
      // Add slight random variation to avoid perfect patterns
      const jitterX = (Math.random() - 0.5) * 0.1;
      const jitterY = (Math.random() - 0.5) * 0.1;
      
      neurons.push({
        id: i,
        x: (x + jitterX) * canvas.width,
        y: (y + jitterY) * canvas.height,
        size: config.neuronSize.min + Math.random() * (config.neuronSize.max - config.neuronSize.min),
        connections: [],
        branches: [],
        pulseStrength: 0,
      });
    }
  }
  
  // Initialize traveling nodes
  function initializeTravelingNodes() {
    travelingNodes = [];
    
    for (let i = 0; i < config.travelingNodeCount; i++) {
      createNewTravelingNode();
    }
  }
  
  // Create a new traveling node from edge to a random neuron
  function createNewTravelingNode() {
    if (neurons.length === 0) return;
    
    // Select random target neuron
    const targetNeuron = neurons[Math.floor(Math.random() * neurons.length)];
    
    // Start from edge of screen at random position
    let startX = 0;
    let startY = 0;
    
    // Determine which edge to start from
    const edge = Math.floor(Math.random() * 4);
    switch(edge) {
      case 0: // Top edge
        startX = Math.random() * canvas.width;
        startY = 0;
        break;
      case 1: // Right edge
        startX = canvas.width;
        startY = Math.random() * canvas.height;
        break;
      case 2: // Bottom edge
        startX = Math.random() * canvas.width;
        startY = canvas.height;
        break;
      case 3: // Left edge
        startX = 0;
        startY = Math.random() * canvas.height;
        break;
    }
    
    // Find a connection width to match
    let connectionWidth = 0.5;
    if (targetNeuron.connections.length > 0) {
      const randomConnection = targetNeuron.connections[
        Math.floor(Math.random() * targetNeuron.connections.length)
      ];
      connectionWidth = randomConnection.width;
    }
    
    travelingNodes.push({
      x: startX,
      y: startY,
      targetNeuron,
      progress: 0,
      speed: config.travelingNodeSpeed.min + 
        Math.random() * (config.travelingNodeSpeed.max - config.travelingNodeSpeed.min),
      width: connectionWidth,
      active: true
    });
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
          width: (0.5 + Math.random() * 1) * 4, // Increased width by 25% (from base width)
          flowPhase: Math.random() * Math.PI * 2 // Random initial phase
        });
      }
    });
  }
  
  // Create connections between neurons with better 360° coverage
  function createConnections() {
    // First ensure each neuron has at least minConnections
    neurons.forEach(neuron => {
      // Find all other neurons
      const potentialTargets = neurons
        .filter(n => n.id !== neuron.id)
        .map(n => ({
          neuron: n,
          distance: Math.sqrt(
            Math.pow(n.x - neuron.x, 2) + 
            Math.pow(n.y - neuron.y, 2)
          )
        }));
      
      // Sort by distance, but also consider neurons in all directions
      potentialTargets.sort((a, b) => a.distance - b.distance);
      
      // Connect to closest neurons in different directions
      const connectionCount = config.minConnections + 
        Math.floor(Math.random() * (config.maxConnections - config.minConnections + 1));
      
      // Divide the circle into sectors to ensure even distribution
      const sectors = 6; // Increased from 4 to 6 sectors for better coverage
      const sectorsWithConnections = Array(sectors).fill(0);
      const connectionsPerSector = Math.ceil(connectionCount / sectors);
      
      // Create connections for each sector
      for (let sec = 0; sec < sectors; sec++) {
        // Filter targets that fall in this sector
        const sectorStartAngle = (sec * 2 * Math.PI) / sectors;
        const sectorEndAngle = ((sec + 1) * 2 * Math.PI) / sectors;
        
        const targetsInSector = potentialTargets.filter(target => {
          const angle = Math.atan2(
            target.neuron.y - neuron.y,
            target.neuron.x - neuron.x
          ) + Math.PI; // Normalize to 0-2π
          
          return (angle >= sectorStartAngle && angle < sectorEndAngle);
        });
        
        // Connect to the closest targets in this sector
        for (let i = 0; i < Math.min(connectionsPerSector, targetsInSector.length); i++) {
          if (sectorsWithConnections[sec] < connectionsPerSector && 
              targetsInSector[i] && 
              neuron.connections.length < connectionCount) {
            
            const target = targetsInSector[i].neuron;
            const distance = targetsInSector[i].distance;
            
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
            sectorsWithConnections[sec]++;
          }
        }
      }
      
      // If we still need more connections, add them from any sector
      while (neuron.connections.length < config.minConnections && potentialTargets.length > neuron.connections.length) {
        const targetIndex = neuron.connections.length;
        if (potentialTargets[targetIndex]) {
          const target = potentialTargets[targetIndex].neuron;
          const distance = potentialTargets[targetIndex].distance;
          
          // Create control points and connection as before
          const controlPointCount = 2 + Math.floor(Math.random() * 3);
          const controlPoints: Point[] = [];
          
          for (let j = 0; j < controlPointCount; j++) {
            const t = (j + 1) / (controlPointCount + 1);
            const baseX = neuron.x + (target.x - neuron.x) * t;
            const baseY = neuron.y + (target.y - neuron.y) * t;
            
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
      }
    });
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
  
  // Draw and update traveling nodes
  function updateAndDrawTravelingNodes(timestamp: number) {
    for (let i = 0; i < travelingNodes.length; i++) {
      const node = travelingNodes[i];
      if (!node.active) continue;
      
      // Update progress
      node.progress += node.speed / 100;
      
      // Calculate current position (linear interpolation for simplicity)
      node.x = (1 - node.progress) * node.x + node.progress * node.targetNeuron.x;
      node.y = (1 - node.progress) * node.y + node.progress * node.targetNeuron.y;
      
      // Check if node has reached target
      const distanceToTarget = Math.sqrt(
        Math.pow(node.x - node.targetNeuron.x, 2) + 
        Math.pow(node.y - node.targetNeuron.y, 2)
      );
      
      if (distanceToTarget < node.targetNeuron.size || node.progress >= 1) {
        // Trigger glow effect on neuron
        node.targetNeuron.pulseStrength = 1;
        
        // Reset node
        node.active = false;
        
        // Create a new node to replace this one
        setTimeout(() => {
          createNewTravelingNode();
        }, Math.random() * 1000);
        
        continue;
      }
      
      // Draw traveling node
      ctx.fillStyle = config.connectionColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.width, 0, Math.PI * 2);
      ctx.fill();
      
      // Add small glow effect to traveling node
      const nodeGlow = ctx.createRadialGradient(
        node.x, node.y, node.width * 0.5,
        node.x, node.y, node.width * 2
      );
      
      nodeGlow.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
      nodeGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');
      
      ctx.fillStyle = nodeGlow;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.width * 2, 0, Math.PI * 2);
      ctx.fill();
    }
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
  
  // Main render function
  function render(timestamp: number) {
    // First completely clear the canvas to prevent trail artifacts between theme changes
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Now apply the semi-transparent overlay for the trail effect
    ctx.fillStyle = theme === 'dark' 
      ? 'rgba(2, 8, 23, 0.3)' // Semi-transparent dark background for trail effect
      : 'rgba(255, 255, 255, 0.3)'; // Semi-transparent white background for trail effect
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
    
    // Update and draw traveling nodes
    updateAndDrawTravelingNodes(timestamp);
    
    // Draw neurons on top
    neurons.forEach(drawNeuron);
    
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
    
    initializeNeurons();
    createBranches();
    createConnections();
    initializeTravelingNodes();
    animationFrameId = requestAnimationFrame(render);
  }
  
  // Start the animation
  init();
  
  // Return cleanup function
  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}
