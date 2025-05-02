
import { Neuron, Connection, Branch, Point, TravelingNode } from '../../types/neural';
import { NeuralNetworkConfig } from '../../types/neural';

/**
 * Initialize neurons with improved distribution and more spacing
 */
export function initializeNeurons(canvas: HTMLCanvasElement, config: NeuralNetworkConfig): Neuron[] {
  const neurons: Neuron[] = [];
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
  return neurons;
}

/**
 * Create branches for neurons
 */
export function createBranches(neurons: Neuron[], config: NeuralNetworkConfig): void {
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
        width: (0.5 + Math.random() * 1) * 2.88, // Increased width by 60% from previous 1.8 (1.8 * 1.6 = 2.88)
        flowPhase: Math.random() * Math.PI * 2 // Random initial phase
      });
    }
  });
}

/**
 * Create connections between neurons with better 360° coverage
 */
export function createConnections(neurons: Neuron[], config: NeuralNetworkConfig): void {
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

/**
 * Initialize traveling nodes
 */
export function initializeTravelingNodes(
  neurons: Neuron[], 
  canvas: HTMLCanvasElement,
  config: NeuralNetworkConfig
): TravelingNode[] {
  const travelingNodes: TravelingNode[] = [];
  
  for (let i = 0; i < config.travelingNodeCount; i++) {
    travelingNodes.push(createNewTravelingNode(neurons, canvas, config));
  }
  
  return travelingNodes;
}

/**
 * Create a new traveling node from edge to a random neuron
 */
export function createNewTravelingNode(
  neurons: Neuron[], 
  canvas: HTMLCanvasElement,
  config: NeuralNetworkConfig
): TravelingNode {
  if (neurons.length === 0) {
    // Default fallback if no neurons exist
    return {
      x: 0,
      y: 0,
      targetNeuron: null,
      progress: 0,
      speed: config.travelingNodeSpeed.min,
      width: 0.5,
      active: false
    };
  }
  
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
  
  return {
    x: startX,
    y: startY,
    targetNeuron,
    progress: 0,
    speed: config.travelingNodeSpeed.min + 
      Math.random() * (config.travelingNodeSpeed.max - config.travelingNodeSpeed.min),
    width: connectionWidth,
    active: true
  };
}
