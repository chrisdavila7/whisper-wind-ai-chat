import { Neuron, Connection, Branch, Point } from '../types/neural';

/**
 * Draws and animates an organic neural network on a canvas with a flat, modern style
 */
export function drawOrganicNeuralNetwork(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, theme: 'light' | 'dark' = 'dark') {
  // Configuration
  const config = {
    // Flat, modern color palette with improved transparency
    backgroundColor: theme === 'dark' ? '#121420' : '#f8f9fa',
    neuronColor: {
      base: theme === 'dark' 
        ? 'rgba(129, 140, 248, 0.04)' // Very subtle base for flat look
        : 'rgba(129, 140, 248, 0.02)', 
      core: theme === 'dark'
        ? 'rgba(129, 140, 248, 0.35)' // Reduced opacity for flatter look
        : 'rgba(99, 102, 241, 0.3)'   // Reduced opacity for light mode
    },
    // Significantly reduced connection opacity to prevent visible overlaps
    connectionColor: theme === 'dark' 
      ? 'rgba(129, 140, 248, 0.08)' // Much more transparent for flat look
      : 'rgba(129, 140, 248, 0.06)',
    
    // Remove cylindrical effect for flatter appearance
    cylindricalEffect: {
      highlightColor: 'transparent', // Disable highlight for flat appearance
      highlightWidth: 0,            // No highlight width
    },
    
    // Keep organic parameters with increased spacing
    neuronCount: 20,
    minConnections: 2,
    maxConnections: 6,
    minBranches: 2,
    maxBranches: 5,
    branchLength: { min: 30, max: 120 },
    
    // Animation settings - slightly reduced for a more subtle effect
    flowSpeed: 0.0003, // Slightly slower for more subtle flow
    pulseInterval: 300000,
    glowIntensity: theme === 'dark' ? 0.4 : 0.3, // Further reduced glow for flatter look
    
    // Maintain the large core size
    neuronSize: { min: 3, max: 8 }, // Keep original outer size
    neuronCoreScale: 5.0, // Maintain the 5x bigger cores
    
    // Keep traveling node settings but make them more subtle
    travelingNodeCount: 7,
    travelingNodeSpeedFactor: 0.002,
    travelingNodeGlowDuration: 8000,
    nodeSamples: 1000,
    
    // Performance optimization settings - keep existing
    maxDistanceForAnimation: 1500,
    performanceThreshold: 50,
    viewportMargin: 100,
    fpsUpdateInterval: 1000,
  };

  // State
  let neurons: Neuron[] = [];
  let travelingNodes: TravelingNode[] = [];
  let animationFrameId: number;
  let lastPulseTime = 0;
  let lastFrameTime = 0; // Track last frame time for delta time calculation
  
  // Performance monitoring
  let frameCount = 0;
  let lastFpsUpdate = 0;
  let currentFps = 60; // Starting assumption
  let isLowPerformance = false;
  
  /**
   * Interface for traveling nodes - enhanced to include path data
   * for precise path following and exact node positioning
   */
  interface TravelingNode {
    x: number;
    y: number;
    targetNeuron: Neuron;
    sourceNeuron: Neuron;
    connection: Connection;  // The connection this node is traveling along
    progress: number;  // 0 to 1, representing progress to target
    speed: number;     // Speed is now a consistent factor regardless of path length
    width: number;
    active: boolean;
    // Path cache for more accurate following
    path?: Point[];
    pathIndex?: number;
    // Total path length for normalizing speed
    pathLength?: number;
    // Is this node within optimal rendering distance
    isWithinViewport?: boolean;
  }
  
  /**
   * Check if a position is within the extended viewport (visible area + margin)
   * This helps us determine if we should render/animate elements at this position
   */
  function isWithinExtendedViewport(x: number, y: number, margin = config.viewportMargin): boolean {
    return (
      x >= -margin && 
      x <= canvas.width + margin && 
      y >= -margin && 
      y <= canvas.height + margin
    );
  }
  
  /**
   * Calculate distance between two points
   */
  function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  
  /**
   * Monitor and update FPS (frames per second)
   */
  function updateFps(timestamp: number) {
    frameCount++;
    
    // Update FPS counter once per second
    if (timestamp - lastFpsUpdate >= config.fpsUpdateInterval) {
      currentFps = Math.round((frameCount * 1000) / (timestamp - lastFpsUpdate));
      frameCount = 0;
      lastFpsUpdate = timestamp;
      
      // Detect low performance
      isLowPerformance = currentFps < config.performanceThreshold;
      
      // Dynamically adjust node count based on performance
      if (isLowPerformance) {
        // Reduce active traveling nodes if performance is suffering
        const activeNodes = travelingNodes.filter(node => node.active);
        if (activeNodes.length > Math.max(3, Math.floor(config.travelingNodeCount / 2))) {
          // Remove some active nodes to improve performance
          let nodesToDeactivate = activeNodes.length - Math.max(3, Math.floor(config.travelingNodeCount / 2));
          for (let i = 0; i < travelingNodes.length && nodesToDeactivate > 0; i++) {
            if (travelingNodes[i].active) {
              travelingNodes[i].active = false;
              nodesToDeactivate--;
            }
          }
        }
      }
    }
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
      const x = 0.5 + 1 * Math.sin(phi) * Math.cos(theta);
      const y = 0.5 + 1 * Math.sin(phi) * Math.sin(theta);
      
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
  
  // Initialize traveling nodes with performance considerations
  function initializeTravelingNodes() {
    travelingNodes = [];
    
    // Create initial nodes, respecting performance settings
    for (let i = 0; i < config.travelingNodeCount; i++) {
      createNewTravelingNode();
    }
  }
  
  /**
   * Calculate the total length of a path by summing distances between sample points
   * This helps normalize speed across different length paths
   */
  function calculatePathLength(points: Point[]): number {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += Math.sqrt(
        Math.pow(points[i].x - points[i-1].x, 2) + 
        Math.pow(points[i].y - points[i-1].y, 2)
      );
    }
    return length;
  }
  
  /**
   * Create a new traveling node that follows an existing connection's path
   * Enhanced with performance optimizations and viewport checks
   */
  function createNewTravelingNode() {
    if (neurons.length === 0) return;
    
    // Don't create additional nodes if performance is suffering
    if (isLowPerformance && travelingNodes.filter(n => n.active).length >= Math.max(3, Math.floor(config.travelingNodeCount / 2))) {
      return;
    }
    
    // Find neurons that are within the viewport or extended margin
    const neuronsWithConnections = neurons.filter(n => 
      n.connections.length > 0 && 
      isWithinExtendedViewport(n.x, n.y, config.viewportMargin * 2)
    );
    
    if (neuronsWithConnections.length === 0) return;
    
    // Select a random neuron with connections that's in view
    const sourceNeuron = neuronsWithConnections[Math.floor(Math.random() * neuronsWithConnections.length)];
    
    // Filter connections to only include those within a reasonable distance
    const viableConnections = sourceNeuron.connections.filter(conn => {
      const distance = calculateDistance(
        sourceNeuron.x, sourceNeuron.y, 
        conn.target.x, conn.target.y
      );
      
      // Only use connections within maximum animation distance
      // and where target is also within the extended viewport
      return distance <= config.maxDistanceForAnimation && 
             isWithinExtendedViewport(conn.target.x, conn.target.y, config.viewportMargin * 2);
    });
    
    // If no viable connections found, try another neuron next time
    if (viableConnections.length === 0) return;
    
    // Select a random viable connection
    const connection = viableConnections[Math.floor(Math.random() * viableConnections.length)];
    const targetNeuron = connection.target;
    
    // Pre-compute path points for more accurate curve following
    const pathPoints: Point[] = [];
    const samples = config.nodeSamples;
    
    // Generate sample points along the connection path
    // Increased samples for smoother path following
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      // Get exact position along the bezier curve for each sample point
      pathPoints.push(getPositionAlongPath(connection, t));
    }
    
    // Calculate the total path length for normalizing speed
    const pathLength = calculatePathLength(pathPoints);
    
    // Create a traveling node that will follow this connection's path precisely
    travelingNodes.push({
      x: sourceNeuron.x,  // Start at source neuron
      y: sourceNeuron.y,
      sourceNeuron,
      targetNeuron,
      connection,
      progress: 0,
      // Use consistent speed factor multiplied by a small random variation
      // but normalized by path length for consistent visual speed
      speed: config.travelingNodeSpeedFactor * (0.8 + Math.random() * 0.2),
      width: connection.width * 0.6,  // Slightly smaller than the connection
      active: true,
      path: pathPoints,
      pathIndex: 0,
      pathLength: pathLength,
      isWithinViewport: true, // Initially set as visible since we checked during creation
    });
  }
  
  // Create branches for neurons with reduced opacity
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
          const ctrlAngle = angle + (Math.random() * 0.8 - 0.1);
          
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
          // Maintain width but with transparency handled by color
          width: (1 + Math.random() * 6),
          // Updated to match connection flow animation
          flowSpeed: config.flowSpeed * (0.7 + Math.random() * 0.8),
          flowPhase: Math.random() * Math.PI * 2
        });
      }
    });
  }
  
  // Create connections between neurons with reduced opacity
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
              // Maintain width but with transparency handled by color
              width: 1 + Math.random() * 12,
              controlPoints,
              flowSpeed: config.flowSpeed * (0.7 + Math.random() * 7),
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
            // Maintain width but with transparency handled by color
            width: 1 + Math.random() * 8,
            controlPoints,
            flowSpeed: config.flowSpeed * (0.7 + Math.random() * 5),
            flowPhase: Math.random() * Math.PI * 2
          };
          
          neuron.connections.push(connection);
        }
      }
    });
  }
  
  // Draw a neuron with a flat, modern style
  function drawNeuron(neuron: Neuron) {
    // Performance optimization: Only render neurons that are within viewport or close enough
    if (!isWithinExtendedViewport(neuron.x, neuron.y)) {
      return; // Skip rendering entirely if too far from view
    }

    // Draw glow if neuron is pulsing - flatter glow effect
    if (neuron.pulseStrength > 0) {
      const glowRadius = neuron.size * 3;
      const glow = ctx.createRadialGradient(
        neuron.x, neuron.y, neuron.size * 0.5,
        neuron.x, neuron.y, glowRadius
      );
      
      const baseAlpha = neuron.pulseStrength * config.glowIntensity;
      // Use the flat indigo color for glow with reduced opacity
      glow.addColorStop(0, `rgba(129, 140, 248, ${baseAlpha * 0.8})`);
      glow.addColorStop(1, 'rgba(129, 140, 248, 0)');

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(neuron.x, neuron.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw neuron body with flat color and reduced opacity
    ctx.fillStyle = config.neuronColor.base;
    ctx.beginPath();
    ctx.arc(neuron.x, neuron.y, neuron.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw inner core - maintain 5x bigger relative to the neuron's normal proportion
    const coreSize = Math.min(neuron.size * config.neuronCoreScale, neuron.size * 2);
    
    // Draw the core with flat color
    ctx.fillStyle = config.neuronColor.core;
    ctx.beginPath();
    ctx.arc(neuron.x, neuron.y, coreSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Reduce pulse strength over time
    neuron.pulseStrength *= 0.95;
    if (neuron.pulseStrength < 0.05) neuron.pulseStrength = 0;
  }
  
  /**
   * Draw and update traveling nodes with path following and performance optimizations
   */
  function updateAndDrawTravelingNodes(timestamp: number) {
    // Calculate delta time for frame-rate independent movement
    const deltaTime = timestamp - lastFrameTime;
    const deltaFactor = deltaTime / 16.67; // Normalize to ~60fps (16.67ms)
    
    // Track how many active nodes are rendering
    let activeNodesInViewport = 0;
    
    for (let i = 0; i < travelingNodes.length; i++) {
      const node = travelingNodes[i];
      if (!node.active) continue;
      
      // Update progress regardless of visibility (to maintain animation state)
      // Use the node's pathLength to normalize speed across different path lengths
      const speedAdjustment = node.pathLength ? 500 / node.pathLength : 1;
      node.progress += node.speed * deltaFactor * speedAdjustment;
      
      // Update position based on progress - IMPROVED PATH FOLLOWING
      if (node.path && node.path.length > 0) {
        // Calculate exact index position in the pre-computed path array
        // Use Math.min to ensure we don't exceed array bounds
        const exactIndex = Math.min(
          node.progress * (node.path.length - 1),
          node.path.length - 1
        );
        
        // Get integer index and fractional part for interpolation
        const index = Math.floor(exactIndex);
        const fraction = exactIndex - index;
        
        // Check if we have a next point to interpolate with
        if (index < node.path.length - 1) {
          // Linear interpolation between path points for smoother movement
          const currentPoint = node.path[index];
          const nextPoint = node.path[index + 1];
          
          // Perform precise linear interpolation between points
          node.x = currentPoint.x + (nextPoint.x - currentPoint.x) * fraction;
          node.y = currentPoint.y + (nextPoint.y - currentPoint.y) * fraction;
        } else {
          // We're at the last point
          node.x = node.path[index].x;
          node.y = node.path[index].y;
        }
        
        // Update visibility status based on current position
        node.isWithinViewport = isWithinExtendedViewport(node.x, node.y);
      } else {
        // Fallback to bezier calculation if path doesn't exist
        // This shouldn't happen with our improved implementation
        const position = getPositionAlongPath(node.connection, node.progress);
        node.x = position.x;
        node.y = position.y;
        
        // Update visibility status
        node.isWithinViewport = isWithinExtendedViewport(node.x, node.y);
      }
      
      // Check if node has reached target
      if (node.progress >= 1) {
        // Trigger glow effect on target neuron if within viewport
        if (isWithinExtendedViewport(node.targetNeuron.x, node.targetNeuron.y)) {
          node.targetNeuron.pulseStrength = 1;
        }
        
        // Reset node
        node.active = false;
        
        // Create a new node to replace this one with throttling for performance
        const delay = isLowPerformance ? Math.random() * 2000 + 1000 : Math.random() * 1000;
        setTimeout(() => {
          createNewTravelingNode();
        }, delay);
        
        continue;
      }
      
      // Skip drawing if outside viewport - still track total active nodes
      if (!node.isWithinViewport) {
        continue;
      }
      
      activeNodesInViewport++;
      
      // Only render if within viewport and if we haven't exceeded our performance budget
      // Draw traveling node
      ctx.fillStyle = config.connectionColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.width, 0, Math.PI * 2);
      ctx.fill();
      
      // Only add glow effect if performance is good
      if (!isLowPerformance) {
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
    
    // If we have capacity for more nodes and performance is good, add more
    if (activeNodesInViewport < config.travelingNodeCount && !isLowPerformance) {
      const nodesToAdd = Math.min(
        config.travelingNodeCount - activeNodesInViewport,
        2  // Maximum 2 new nodes per frame to prevent stuttering
      );
      
      for (let i = 0; i < nodesToAdd; i++) {
        createNewTravelingNode();
      }
    }
  }
  
  /**
   * Draw a path with a flat, modern style and reduced opacity for overlaps
   */
  function drawFlatPath(path: Point[], width: number) {
    if (path.length < 2) return;
    
    // Enable anti-aliasing settings for smoother lines
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 1;
    
    // Draw main path with significantly reduced opacity
    ctx.lineWidth = width;
    ctx.strokeStyle = config.connectionColor;
    
    // Begin path
    ctx.beginPath();
    
    // Draw the path with appropriate curve method based on point count
    if (path.length === 2) {
      // For simple lines, just draw a line
      ctx.moveTo(path[0].x, path[0].y);
      ctx.lineTo(path[1].x, path[1].y);
    } 
    else if (path.length === 3) {
      // For 3 points, use a single quadratic curve for perfect smoothness
      ctx.moveTo(path[0].x, path[0].y);
      ctx.quadraticCurveTo(path[1].x, path[1].y, path[2].x, path[2].y);
    }
    else {
      // For more complex paths, use a series of cubic bezier curves
      ctx.moveTo(path[0].x, path[0].y);
      
      for (let i = 0; i < path.length - 1; i++) {
        if (i === 0) {
          // First segment
          const p0 = path[i];
          const p1 = path[i+1];
          const p2 = path[i+2] || p1;
          
          const cp1x = p0.x + (p1.x - p0.x) / 3;
          const cp1y = p0.y + (p1.y - p0.y) / 3;
          
          const midX = (p0.x + p1.x) / 2;
          const midY = (p0.y + p1.y) / 2;
          
          ctx.quadraticCurveTo(cp1x, cp1y, midX, midY);
        }
        else if (i === path.length - 2) {
          // Last segment
          const p0 = path[i-1];
          const p1 = path[i];
          const p2 = path[i+1];
          
          const cp1x = p1.x + (p2.x - p1.x) / 3;
          const cp1y = p1.y + (p2.y - p1.y) / 3;
          
          ctx.quadraticCurveTo(cp1x, cp1y, p2.x, p2.y);
        }
        else {
          // Middle segments
          const p0 = path[i-1] || path[i];
          const p1 = path[i];
          const p2 = path[i+1];
          const p3 = path[i+2] || p2;
          
          const tension = 0.5;
          
          const cp1x = p1.x + (p2.x - p0.x) * tension / 3;
          const cp1y = p1.y + (p2.y - p0.y) * tension / 3;
          const cp2x = p2.x - (p3.x - p1.x) * tension / 3;
          const cp2y = p2.y - (p3.y - p1.y) * tension / 3;
          
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
      }
    }
    
    // Apply high-quality stroke
    if (typeof ctx.imageSmoothingQuality !== 'undefined') {
      // @ts-ignore
      ctx.imageSmoothingQuality = 'high';
    }
    ctx.stroke();
    
    // Reset context to default settings
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
  }
  
  // Draw organic branches with flat style and reduced opacity
  function drawBranches(neuron: Neuron, timestamp: number) {
    // Skip if neuron is not within extended viewport
    if (!isWithinExtendedViewport(neuron.x, neuron.y)) {
      return;
    }
    
    neuron.branches.forEach(branch => {
      // Update flow phase using same animation as connections
      branch.flowPhase += branch.flowSpeed;
      if (branch.flowPhase > Math.PI * 2) branch.flowPhase -= Math.PI * 2;
      
      // Prepare path points for drawing with smooth curvature
      const pathPoints: Point[] = [{ x: neuron.x, y: neuron.y }]; // Start from neuron center
      
      // Add control points to maintain organic shape of branches
      branch.controlPoints.forEach(point => {
        pathPoints.push(point);
      });
      
      // Add endpoint with subtle flow animation
      const endPoint = {
        x: branch.controlPoints.length > 0 
          ? branch.controlPoints[branch.controlPoints.length - 1].x + Math.cos(branch.flowPhase * 0.2) * branch.width * 2
          : branch.startX + Math.cos(branch.flowPhase * 0.2) * branch.length * 0.05 + branch.length * 0.95,
        y: branch.controlPoints.length > 0
          ? branch.controlPoints[branch.controlPoints.length - 1].y + Math.sin(branch.flowPhase * 0.2) * branch.width * 2
          : branch.startY + Math.sin(branch.flowPhase * 0.2) * branch.length * 0.05
      };
      pathPoints.push(endPoint);
      
      // Draw using the flat path function with pulsing width
      const pulsingWidth = branch.width * (0.8 + Math.sin(branch.flowPhase) * 0.2);
      drawFlatPath(pathPoints, pulsingWidth);
    });
  }
  
  // Draw a connection with a flat, modern style and reduced opacity
  function drawConnection(connection: Connection, timestamp: number) {
    const { source, target } = connection;
    
    // Skip if both endpoints are outside the extended viewport
    if (!isWithinExtendedViewport(source.x, source.y) && 
        !isWithinExtendedViewport(target.x, target.y)) {
      return;
    }
    
    // Skip if connection distance exceeds maximum allowed distance
    const connectionDistance = calculateDistance(
      source.x, source.y, target.x, target.y
    );
    if (connectionDistance > config.maxDistanceForAnimation * 1.5) {
      return;
    }
    
    // Update flow phase - continue animation even for offscreen connections
    connection.flowPhase += connection.flowSpeed;
    if (connection.flowPhase > Math.PI * 2) connection.flowPhase -= Math.PI * 2;
    
    const { width, controlPoints } = connection;
    
    // Prepare path points for flat drawing with smooth curvature
    const pathPoints: Point[] = [{ x: source.x, y: source.y }];
    
    if (controlPoints.length === 0) {
      // Simple line
      pathPoints.push({ x: target.x, y: target.y });
    } else {
      // Add control points with slight animation for flowing effect
      // Calculate animated control points, preserving the original curvature
      controlPoints.forEach((point, i) => {
        // Reduce movement amplitude if in low performance mode
        const animationScale = isLowPerformance ? 0.5 : 1.5;
        const offsetX = Math.sin(connection.flowPhase + i * 0.7) * width * animationScale;
        const offsetY = Math.cos(connection.flowPhase + i * 0.7) * width * animationScale;
        
        // Add animated control point to path, preserving the original organic curve
        pathPoints.push({
          x: point.x + offsetX,
          y: point.y + offsetY
        });
      });
      
      // Add target point
      pathPoints.push({ x: target.x, y: target.y });
    }
    
    // Draw using the flat path function with pulsing width
    const pulsingWidth = width * (0.8 + Math.sin(connection.flowPhase) * 0.2);
    drawFlatPath(pathPoints, pulsingWidth);
  }
  
  /**
   * Calculate position along a bezier curve with multiple control points
   */
  function getPositionAlongPath(connection: Connection, t: number): Point {
    // Clamp t between 0 and 1 to prevent out-of-bounds errors
    t = Math.max(0, Math.min(1, t));
    
    const { source, target, controlPoints } = connection;
    
    if (controlPoints.length === 0) {
      // Linear interpolation
      return {
        x: source.x + (target.x - source.x) * t,
        y: source.y + (target.y - source.y) * t
      };
    } else if (controlPoints.length === 1) {
      // Quadratic bezier - single control point
      const mt = 1 - t;
      return {
        x: mt * mt * source.x + 2 * mt * t * controlPoints[0].x + t * t * target.x,
        y: mt * mt * source.y + 2 * mt * t * controlPoints[0].y + t * t * target.y
      };
    } else if (controlPoints.length === 2) {
      // Cubic bezier - two control points
      const mt = 1 - t;
      return {
        x: mt * mt * mt * source.x + 3 * mt * mt * t * controlPoints[0].x + 
           3 * mt * t * t * controlPoints[1].x + t * t * t * target.x,
        y: mt * mt * mt * source.y + 3 * mt * mt * t * controlPoints[0].y + 
           3 * mt * t * t * controlPoints[1].y + t * t * t * target.y
      };
    } else {
      // For paths with more control points, use enhanced de Casteljau algorithm
      // This provides pixel-perfect positioning along the curve for any number of control points
      
      // Create points array including start and end points
      const points = [
        { x: source.x, y: source.y },
        ...controlPoints,
        { x: target.x, y: target.y }
      ];
      
      // Apply de Casteljau algorithm recursively
      return deCasteljauPoint(points, t);
    }
  }
  
  /**
   * Recursive de Casteljau algorithm for precise bezier curve point calculation 
   */
  function deCasteljauPoint(points: Point[], t: number): Point {
    // Base case: if we're down to one point, return it
    if (points.length === 1) {
      return points[0];
    }
    
    // Create a new set of points by interpolating between adjacent pairs
    const newPoints: Point[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      newPoints.push({
        x: (1 - t) * points[i].x + t * points[i + 1].x,
        y: (1 - t) * points[i].y + t * points[i + 1].y
      });
    }
    
    // Recursively apply until we get a single point
    return deCasteljauPoint(newPoints, t);
  }
  
  // Main render function with performance monitoring and optimization
  function render(timestamp: number) {
    // Update FPS counter and performance metrics
    updateFps(timestamp);
    
    // First completely clear the canvas to prevent trail artifacts
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Now apply the semi-transparent overlay for the trail effect
    // Use a flatter, cleaner transparency effect
    ctx.fillStyle = theme === 'dark' 
      ? `rgba(18, 20, 32, ${isLowPerformance ? 0.4 : 0.3})` // Flatter dark blue with lower opacity
      : `rgba(248, 249, 250, ${isLowPerformance ? 0.4 : 0.3})`; // Flatter light gray with lower opacity
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections
    neurons.forEach(neuron => {
      // Draw branches first, so they appear behind
      drawBranches(neuron, timestamp);
      
      // Draw connections only if at least one end is in viewport
      neuron.connections.forEach(connection => {
        drawConnection(connection, timestamp);
      });
    });
    
    // Update and draw traveling nodes with timestamp for delta time calculation
    updateAndDrawTravelingNodes(timestamp);
    
    // Draw neurons on top
    neurons.forEach(drawNeuron);
    
    // Apply occasional random pulses to neurons
    if (timestamp - lastPulseTime > config.pulseInterval) {
      // Find neurons that are within viewport to pulse
      const visibleNeurons = neurons.filter(n => isWithinExtendedViewport(n.x, n.y));
      
      // Randomly pulse a visible neuron
      if (visibleNeurons.length > 0) {
        const randomNeuron = visibleNeurons[Math.floor(Math.random() * visibleNeurons.length)];
        randomNeuron.pulseStrength = 1;
      }
      lastPulseTime = timestamp;
    }
    
    // Update last frame time for next delta calculation
    lastFrameTime = timestamp;
    
    // Continue animation
    animationFrameId = requestAnimationFrame(render);
  }
  
  // Initialize and start animation
  function init() {
    // Set canvas rendering quality
    if (typeof ctx.imageSmoothingEnabled !== 'undefined') {
      ctx.imageSmoothingEnabled = true;
    }
    if (typeof ctx.imageSmoothingQuality !== 'undefined') {
      // @ts-ignore
      ctx.imageSmoothingQuality = 'high';
    }
    
    // Fully clear the canvas with the current theme background color first
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Initialize FPS counter
    lastFpsUpdate = performance.now();
    frameCount = 0;
    
    initializeNeurons();
    createBranches();
    createConnections();
    initializeTravelingNodes();
    lastFrameTime = performance.now(); // Initialize last frame time
    animationFrameId = requestAnimationFrame(render);
  }
  
  // Start the animation
  init();
  
  // Return cleanup function
  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}
