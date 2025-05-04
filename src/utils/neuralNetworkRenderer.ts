
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
    
    // Cylindrical effect settings
    cylindricalEffect: {
      highlightColor: theme === 'dark' ? 'rgba(190, 227, 248, 0.4)' : 'rgba(190, 227, 248, 0.5)',
      shadowColor: theme === 'dark' ? 'rgba(30, 64, 124, 0.6)' : 'rgba(30, 64, 124, 0.5)',
      highlightWidth: 0.3,  // Percentage of the total width for highlight
      shadowWidth: 0.3,     // Percentage of the total width for shadow
    },
    
    // Organic parameters with increased spacing (35% more)
    neuronCount: 20, // Reduced count for less visual clutter
    minConnections: 2, // Reduced for less clutter
    maxConnections: 6, // Reduced for less clutter
    minBranches: 2,
    maxBranches: 5,
    branchLength: { min: 30, max: 120 },
    
    // Animation settings
    flowSpeed: 0.0005,
    pulseInterval: 300000, // Increased interval for slower pace
    glowIntensity: theme === 'dark' ? 0.7 : 0.5, // Reduced glow intensity for light theme
    neuronSize: { min: 3, max: 8 },
    
    // Traveling node settings - use fixed speed that's frame-rate independent
    travelingNodeCount: 7,
    // Using consistent speeds instead of random values for smoother animation
    travelingNodeSpeedFactor: 0.0002, // Fixed speed factor (distance-independent)
    travelingNodeGlowDuration: 8000, // How long the glow effect lasts in ms
    nodeSamples: 1000, // How many points to sample for precise path following
    
    // Performance optimization settings
    maxDistanceForAnimation: 1500, // Maximum distance in pixels to create animation nodes
    performanceThreshold: 50, // FPS threshold below which we optimize further
    viewportMargin: 100, // Extra margin around viewport to pre-load animations
    fpsUpdateInterval: 1000, // How often to update the FPS counter (ms)
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
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
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
          const ctrlAngle = angle + (Math.random() * 0.8 - 0.3);
          
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
          width: (0.5 + Math.random() * 1), // Increased width by 25% (from base width)
          // Updated to match connection flow animation instead of spin animation
          flowSpeed: config.flowSpeed * (0.7 + Math.random() * 0.6),
          flowPhase: Math.random() * Math.PI * 2
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
              width: 0.5 + Math.random() * 4,
              controlPoints,
              flowSpeed: config.flowSpeed * (0.7 + Math.random() * 5),
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
            width: 0.5 + Math.random() * 4,
            controlPoints,
            flowSpeed: config.flowSpeed * (0.7 + Math.random() * 5),
            flowPhase: Math.random() * Math.PI * 2
          };
          
          neuron.connections.push(connection);
        }
      }
    });
  }
  
  // Draw a neuron with glow effect
  function drawNeuron(neuron: Neuron) {
    // Performance optimization: Only render neurons that are within viewport or close enough
    if (!isWithinExtendedViewport(neuron.x, neuron.y)) {
      return; // Skip rendering entirely if too far from view
    }

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

      // Save context state
      ctx.save();

      // Apply blur via shadow
      ctx.shadowBlur = glowRadius * 1;  // Adjust for stronger/weaker blur
      ctx.shadowColor = `rgba(59, 130, 246, ${baseAlpha})`;

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(neuron.x, neuron.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Restore context state to prevent blur leaking into other elements
      ctx.restore();
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
  
  /**
   * Draw and update traveling nodes with enhanced path following and performance optimizations
   * Uses pre-computed path points for more accurate curve following and handles nodes outside viewport
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
      
      // Update position based on progress
      if (node.path && node.path.length > 0) {
        // Get the current position from the pre-computed path
        const nextIndex = Math.min(
          Math.floor(node.progress * node.path.length), 
          node.path.length - 1
        );
        
        if (nextIndex >= 0 && nextIndex < node.path.length) {
          node.x = node.path[nextIndex].x;
          node.y = node.path[nextIndex].y;
          
          // Update visibility status based on current position
          node.isWithinViewport = isWithinExtendedViewport(node.x, node.y);
        }
      } else {
        // Fallback to bezier calculation if path doesn't exist
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
   * Draw a path with cylindrical effect (highlighting and shadows)
   * Used for both branches and connections
   * Enhanced to maintain smooth curvature
   */
  function drawCylindricalPath(path: Point[], width: number, flowPhase: number) {
    if (path.length < 2) return;
    
    // Enhanced approach for smoother curve rendering
    const { cylindricalEffect } = config;
    
    // Create a smooth path using quadratic curves for better visual quality
    // This ensures the cylindrical shape follows a smooth path
    
    // Draw the main cylindrical path
    ctx.lineWidth = width;
    ctx.strokeStyle = config.connectionColor;
    ctx.lineCap = 'round'; // Rounded ends for smoother appearance
    
    // Use bezier curves for smoother path rendering
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    
    // Use smooth curve interpolation between points
    if (path.length === 2) {
      // Simple line for just two points
      ctx.lineTo(path[1].x, path[1].y);
    } else {
      // For multiple points, use quadratic or bezier curves for smoother bends
      for (let i = 0; i < path.length - 1; i++) {
        if (i === path.length - 2) {
          // Last segment - draw to the final point
          ctx.lineTo(path[i + 1].x, path[i + 1].y);
        } else {
          // Calculate midpoint for smoother curve
          const midX = (path[i].x + path[i + 1].x) / 2;
          const midY = (path[i].y + path[i + 1].y) / 2;
          
          // Use quadratic curve to maintain organic feel with smoother bends
          ctx.quadraticCurveTo(path[i].x, path[i].y, midX, midY);
        }
      }
    }
    ctx.stroke();
    
    // Skip complex effects in low performance mode
    if (isLowPerformance) return;
    
    // Draw highlight (top of cylinder) with same smooth curve approach
    ctx.lineWidth = width * cylindricalEffect.highlightWidth;
    ctx.strokeStyle = cylindricalEffect.highlightColor;
    
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    if (path.length === 2) {
      ctx.lineTo(path[1].x, path[1].y);
    } else {
      for (let i = 0; i < path.length - 1; i++) {
        if (i === path.length - 2) {
          ctx.lineTo(path[i + 1].x, path[i + 1].y);
        } else {
          const midX = (path[i].x + path[i + 1].x) / 2;
          const midY = (path[i].y + path[i + 1].y) / 2;
          ctx.quadraticCurveTo(path[i].x, path[i].y, midX, midY);
        }
      }
    }
    ctx.stroke();
    
    // Draw shadow (bottom of cylinder) with same smooth curve approach
    // Slight offset for 3D effect while maintaining the same smooth curvature
    ctx.lineWidth = width * cylindricalEffect.shadowWidth;
    ctx.strokeStyle = cylindricalEffect.shadowColor;
    
    // Create shadow path with slight offset for 3D effect
    const shadowPath = path.map(p => ({
      x: p.x + width * 0.2,
      y: p.y + width * 0.2
    }));
    
    ctx.beginPath();
    ctx.moveTo(shadowPath[0].x, shadowPath[0].y);
    if (shadowPath.length === 2) {
      ctx.lineTo(shadowPath[1].x, shadowPath[1].y);
    } else {
      for (let i = 0; i < shadowPath.length - 1; i++) {
        if (i === shadowPath.length - 2) {
          ctx.lineTo(shadowPath[i + 1].x, shadowPath[i + 1].y);
        } else {
          const midX = (shadowPath[i].x + shadowPath[i + 1].x) / 2;
          const midY = (shadowPath[i].y + shadowPath[i + 1].y) / 2;
          ctx.quadraticCurveTo(shadowPath[i].x, shadowPath[i].y, midX, midY);
        }
      }
    }
    ctx.stroke();
    
    // Reset line cap
    ctx.lineCap = 'butt';
  }
  
  // Draw organic branches with performance optimization and cylindrical effect
  function drawBranches(neuron: Neuron, timestamp: number) {
    // Skip if neuron is not within extended viewport
    if (!isWithinExtendedViewport(neuron.x, neuron.y)) {
      return;
    }
    
    neuron.branches.forEach(branch => {
      // Update flow phase using same animation as connections
      branch.flowPhase += branch.flowSpeed;
      if (branch.flowPhase > Math.PI * 2) branch.flowPhase -= Math.PI * 2;
      
      // Prepare path points for cylindrical drawing with smooth curvature
      const pathPoints: Point[] = [{ x: neuron.x, y: neuron.y }]; // Start from neuron center
      
      // Add control points to maintain organic shape of branches
      branch.controlPoints.forEach(point => {
        pathPoints.push(point);
      });
      
      // Add endpoint with subtle flow animation (matching connection style)
      const endPoint = {
        // Animate endpoint with subtle waviness instead of circular motion
        x: branch.controlPoints.length > 0 
          ? branch.controlPoints[branch.controlPoints.length - 1].x + Math.cos(branch.flowPhase * 0.2) * branch.width * 2
          : branch.startX + Math.cos(branch.flowPhase * 0.2) * branch.length * 0.05 + branch.length * 0.95,
        y: branch.controlPoints.length > 0
          ? branch.controlPoints[branch.controlPoints.length - 1].y + Math.sin(branch.flowPhase * 0.2) * branch.width * 2
          : branch.startY + Math.sin(branch.flowPhase * 0.2) * branch.length * 0.05
      };
      pathPoints.push(endPoint);
      
      // Draw using the cylindrical path function with pulsing width
      const pulsingWidth = branch.width * (0.8 + Math.sin(branch.flowPhase) * 0.2);
      drawCylindricalPath(pathPoints, pulsingWidth, branch.flowPhase);
    });
  }
  
  // Draw a connection with organic, flowing path, with performance optimizations and cylindrical effect
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
    
    // Prepare path points for cylindrical drawing with smooth curvature
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
    
    // Draw using the cylindrical path function with pulsing width
    const pulsingWidth = width * (0.8 + Math.sin(connection.flowPhase) * 0.2);
    drawCylindricalPath(pathPoints, pulsingWidth, connection.flowPhase);
  }
  
  /**
   * Calculate position along a bezier curve with multiple control points
   * Enhanced for more accurate path following
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
  
  // Main render function with performance monitoring and optimization
  function render(timestamp: number) {
    // Update FPS counter and performance metrics
    updateFps(timestamp);
    
    // First completely clear the canvas to prevent trail artifacts between theme changes
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Now apply the semi-transparent overlay for the trail effect
    // Use a more transparent effect if performance is low
    ctx.fillStyle = theme === 'dark' 
      ? `rgba(2, 8, 23, ${isLowPerformance ? 0.5 : 0.3})` // Adjust transparency based on performance
      : `rgba(255, 255, 255, ${isLowPerformance ? 0.5 : 0.3})`;
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
