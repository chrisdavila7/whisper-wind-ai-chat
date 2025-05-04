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
        ? 'rgba(59, 130, 246, 0.1)' // Blue base for dark mode
        : 'rgba(59, 130, 246, 0.9)', // Slightly more visible blue for light mode
      core: theme === 'dark'
        ? 'rgba(219, 234, 254, 0.3)' // Light blue core for dark mode
        : 'rgba(29, 78, 216, 0.25)' // Darker blue core for light mode for better contrast
    },
    connectionColor: theme === 'dark' 
      ? 'rgba(59, 130, 246, 0.09)' 
      : 'rgba(59, 130, 246, 0.09)', // Slightly more transparent for light mode
    
    // Cylindrical effect settings
    cylindricalEffect: {
      highlightColor: theme === 'dark' ? 'rgba(190, 227, 248, 0.09)' : 'rgba(190, 227, 248, 0.1)',
      shadowColor: theme === 'dark' ? 'rgba(30, 64, 124, 0.2)' : 'rgba(30, 64, 124, 0.1)',
      highlightWidth: 0.3,  // Percentage of the total width for highlight
      shadowWidth: 0.3,     // Percentage of the total width for shadow
    },
    
    // New blur effect settings for connectors and branches
    blurEffect: {
      enabled: true,
      blurAmount: 3,  // Subtle blur amount in pixels
      glowColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.18)', // Subtle glow color
      glowWidth: 1.2, // How much wider the glow is compared to the line
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
    travelingNodeSpeedFactor: 0.002, // Fixed speed factor (distance-independent)
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
          width: (1 + Math.random() * 6), 
          flowSpeed: config.flowSpeed * (0.7 + Math.random() * 0.8),
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
   * Enhanced to ensure all curves are perfectly smooth with no sharp angles
   * Now with blur effect for subtle glow
   */
  function drawCylindricalPath(path: Point[], width: number, flowPhase: number) {
    if (path.length < 2) return;
    
    const { cylindricalEffect, blurEffect } = config;
    
    // Apply blur effect if enabled and performance is good
    const applyBlur = blurEffect.enabled && !isLowPerformance;
    
    // STEP 1: Draw the glow layer first (if blur effect is enabled)
    if (applyBlur) {
      // Save the current context state to restore later
      ctx.save();
      
      // Set blur effect using shadow - more efficient than filter:blur
      ctx.shadowBlur = blurEffect.blurAmount;
      ctx.shadowColor = blurEffect.glowColor;
      
      // Draw wider path for glow effect
      ctx.lineWidth = width * blurEffect.glowWidth;
      ctx.strokeStyle = blurEffect.glowColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Draw the same path with blur
      ctx.beginPath();
      
      // Use the same path drawing logic as the main path
      if (path.length === 2) {
        ctx.moveTo(path[0].x, path[0].y);
        ctx.lineTo(path[1].x, path[1].y);
      } 
      else if (path.length === 3) {
        ctx.moveTo(path[0].x, path[0].y);
        ctx.quadraticCurveTo(path[1].x, path[1].y, path[2].x, path[2].y);
      }
      else {
        ctx.moveTo(path[0].x, path[0].y);
        
        for (let i = 0; i < path.length - 1; i++) {
          const current = path[i];
          const next = path[i + 1];
          
          if (i === 0) {
            if (path.length > 2) {
              const midPoint = {
                x: (current.x + next.x) / 2,
                y: (current.y + next.y) / 2
              };
              ctx.quadraticCurveTo(
                current.x + (next.x - current.x) * 0.5,
                current.y + (next.y - current.y) * 0.5,
                midPoint.x, midPoint.y
              );
            }
          } 
          else if (i === path.length - 2) {
            ctx.quadraticCurveTo(current.x, current.y, next.x, next.y);
          } 
          else {
            const mid2 = {
              x: (current.x + next.x) / 2,
              y: (current.y + next.y) / 2
            };
            
            const distance = Math.sqrt(
              Math.pow(next.x - current.x, 2) + 
              Math.pow(next.y - current.y, 2)
            );
            
            const controlPointDistance = distance * 0.25;
            
            const angle = Math.atan2(next.y - current.y, next.x - current.x);
            
            const cp1x = current.x + Math.cos(angle) * controlPointDistance;
            const cp1y = current.y + Math.sin(angle) * controlPointDistance;
            
            ctx.quadraticCurveTo(cp1x, cp1y, mid2.x, mid2.y);
          }
        }
      }
      
      ctx.stroke();
      
      // Restore context to remove shadow/blur effect for subsequent drawings
      ctx.restore();
    }
    
    // STEP 2: Draw the main cylindrical path with improved smoothing
    ctx.lineWidth = width;
    ctx.strokeStyle = config.connectionColor;
    ctx.lineCap = 'round';  // Rounded ends for smoother appearance
    ctx.lineJoin = 'round'; // Rounded joins to eliminate sharp corners
    
    // ENHANCED PATH SMOOTHING: Use natural cubic spline interpolation for ultra-smooth paths
    ctx.beginPath();
    
    if (path.length === 2) {
      // Simple line for just two points - already smooth
      ctx.moveTo(path[0].x, path[0].y);
      ctx.lineTo(path[1].x, path[1].y);
    } 
    else if (path.length === 3) {
      // For three points, use a single quadratic curve for perfect smoothness
      ctx.moveTo(path[0].x, path[0].y);
      ctx.quadraticCurveTo(path[1].x, path[1].y, path[2].x, path[2].y);
    }
    else {
      // For more complex paths, use a series of bezier curves with tension control
      // Start at first point
      ctx.moveTo(path[0].x, path[0].y);
      
      // For each segment, create a smooth curve
      for (let i = 0; i < path.length - 1; i++) {
        // Current point and next point
        const current = path[i];
        const next = path[i + 1];
        
        if (i === 0) {
          // First segment: Use quadratic curve with the next point as control
          if (path.length > 2) {
            const midPoint = {
              x: (current.x + next.x) / 2,
              y: (current.y + next.y) / 2
            };
            ctx.quadraticCurveTo(
              current.x + (next.x - current.x) * 0.5,
              current.y + (next.y - current.y) * 0.5,
              midPoint.x, midPoint.y
            );
          }
        } 
        else if (i === path.length - 2) {
          // Last segment: Smooth curve to final point
          ctx.quadraticCurveTo(current.x, current.y, next.x, next.y);
        } 
        else {
          // Middle segments: Use midpoint-to-midpoint curves with proper control points
          const mid1 = {
            x: (path[i-1].x + current.x) / 2,
            y: (path[i-1].y + current.y) / 2
          };
          
          const mid2 = {
            x: (current.x + next.x) / 2,
            y: (current.y + next.y) / 2
          };
          
          // Use control points that follow the direction of the curve for smoother bends
          const cpX = current.x;
          const cpY = current.y;
          
          ctx.quadraticCurveTo(cpX, cpY, mid2.x, mid2.y);
        }
      }
      
      ctx.stroke();
      
      // STEP 3: Draw overlay effects for cylindrical appearance
      if (!isLowPerformance) {
        // Highlight side (thin bright line)
        ctx.lineWidth = width * cylindricalEffect.highlightWidth;
        ctx.strokeStyle = cylindricalEffect.highlightColor;
        ctx.beginPath();
        
        // Use the same path drawing logic
        if (path.length === 2) {
          ctx.moveTo(path[0].x, path[0].y);
          ctx.lineTo(path[1].x, path[1].y);
        } 
        else if (path.length === 3) {
          ctx.moveTo(path[0].x, path[0].y);
          ctx.quadraticCurveTo(path[1].x, path[1].y, path[2].x, path[2].y);
        }
        else {
          // Same complex curve logic as above
          ctx.moveTo(path[0].x, path[0].y);
          
          for (let i = 0; i < path.length - 1; i++) {
            const current = path[i];
            const next = path[i + 1];
            
            if (i === 0) {
              if (path.length > 2) {
                const midPoint = {
                  x: (current.x + next.x) / 2,
                  y: (current.y + next.y) / 2
                };
                ctx.quadraticCurveTo(
                  current.x + (next.x - current.x) * 0.5,
                  current.y + (next.y - current.y) * 0.5,
                  midPoint.x, midPoint.y
                );
              }
            } 
            else if (i === path.length - 2) {
              ctx.quadraticCurveTo(current.x, current.y, next.x, next.y);
            } 
            else {
              const mid1 = {
                x: (path[i-1].x + current.x) / 2,
                y: (path[i-1].y + current.y) / 2
              };
              
              const mid2 = {
                x: (current.x + next.x) / 2,
                y: (current.y + next.y) / 2
              };
              
              const cpX = current.x;
              const cpY = current.y;
              
              ctx.quadraticCurveTo(cpX, cpY, mid2.x, mid2.y);
            }
          }
        }
        
        ctx.stroke();
        
        // Shadow side (thin dark line)
        ctx.lineWidth = width * cylindricalEffect.shadowWidth;
        ctx.strokeStyle = cylindricalEffect.shadowColor;
        ctx.beginPath();
        
        // Use the same path drawing logic again
        if (path.length === 2) {
          ctx.moveTo(path[0].x, path[0].y);
          ctx.lineTo(path[1].x, path[1].y);
        } 
        else if (path.length === 3) {
          ctx.moveTo(path[0].x, path[0].y);
          ctx.quadraticCurveTo(path[1].x, path[1].y, path[2].x, path[2].y);
        }
        else {
          // Same complex curve logic as above
          ctx.moveTo(path[0].x, path[0].y);
          
          for (let i = 0; i < path.length - 1; i++) {
            const current = path[i];
            const next = path[i + 1];
            
            if (i === 0) {
              if (path.length > 2) {
                const midPoint = {
                  x: (current.x + next.x) / 2,
                  y: (current.y + next.y) / 2
                };
                ctx.quadraticCurveTo(
                  current.x + (next.x - current.x) * 0.5,
                  current.y + (next.y - current.y) * 0.5,
                  midPoint.x, midPoint.y
                );
              }
            } 
            else if (i === path.length - 2) {
              ctx.quadraticCurveTo(current.x, current.y, next.x, next.y);
            } 
            else {
              const mid1 = {
                x: (path[i-1].x + current.x) / 2,
                y: (path[i-1].y + current.y) / 2
              };
              
              const mid2 = {
                x: (current.x + next.x) / 2,
                y: (current.y + next.y) / 2
              };
              
              const cpX = current.x;
              const cpY = current.y;
              
              ctx.quadraticCurveTo(cpX, cpY, mid2.x, mid2.y);
            }
          }
        }
        
        ctx.stroke();
      }
    }
  }
  
  // Get position along a curved path defined by control points
  function getPositionAlongPath(conn: Connection, t: number): Point {
    const { source, target, controlPoints } = conn;
    
    // Linear interpolation for straight lines (0 control points) or t at extremes
    if (controlPoints.length === 0 || t <= 0) {
      return { x: source.x, y: source.y };
    }
    
    if (t >= 1) {
      return { x: target.x, y: target.y };
    }
    
    // Quadratic bezier for 1 control point
    if (controlPoints.length === 1) {
      const cp = controlPoints[0];
      const x = Math.pow(1 - t, 2) * source.x + 2 * (1 - t) * t * cp.x + Math.pow(t, 2) * target.x;
      const y = Math.pow(1 - t, 2) * source.y + 2 * (1 - t) * t * cp.y + Math.pow(t, 2) * target.y;
      return { x, y };
    }
    
    // For multiple control points, use De Casteljau's algorithm
    // to calculate a point on the bezier curve defined by these points
    const points = [
      { x: source.x, y: source.y },
      ...controlPoints,
      { x: target.x, y: target.y }
    ];
    
    // Apply De Casteljau's algorithm iteratively until we get one point
    return deCasteljau(points, t);
  }
  
  // Implementation of De Casteljau's algorithm for bezier curves
  function deCasteljau(points: Point[], t: number): Point {
    if (points.length === 1) {
      return points[0];
    }
    
    const newPoints: Point[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      newPoints.push({
        x: (1 - t) * points[i].x + t * points[i + 1].x,
        y: (1 - t) * points[i].y + t * points[i + 1].y
      });
    }
    
    return deCasteljau(newPoints, t);
  }
  
  function drawBranches(now: number) {
    neurons.forEach(neuron => {
      if (!isWithinExtendedViewport(neuron.x, neuron.y, config.viewportMargin * 3)) {
        return; // Skip rendering branches for off-screen neurons
      }
      
      neuron.branches.forEach(branch => {
        // Calculate points along the branch's curve
        const points: Point[] = [
          { x: branch.startX, y: branch.startY },
          ...branch.controlPoints
        ];
        
        // Draw cylindrical branch with glow effect
        drawCylindricalPath(points, branch.width, branch.flowPhase + now * branch.flowSpeed);
      });
    });
  }
  
  function drawConnections(now: number) {
    neurons.forEach(neuron => {
      // Skip if the neuron is way off screen with margin
      if (!isWithinExtendedViewport(neuron.x, neuron.y, config.viewportMargin * 2)) {
        return;
      }
      
      neuron.connections.forEach(connection => {
        // Skip if end point is also out of view
        if (!isWithinExtendedViewport(connection.target.x, connection.target.y, config.viewportMargin * 2)) {
          return;
        }
        
        // Collect points along connection's curve
        const points: Point[] = [
          { x: connection.source.x, y: connection.source.y },
          ...connection.controlPoints,
          { x: connection.target.x, y: connection.target.y }
        ];
        
        // Draw cylindrical connection with animated glow based on flow phase
        drawCylindricalPath(points, connection.width, connection.flowPhase + now * connection.flowSpeed);
      });
    });
  }
  
  function pulse(timestamp: number) {
    // Only pulse periodically
    if (timestamp - lastPulseTime < config.pulseInterval) {
      return;
    }
    
    // Find visible neurons for pulsing
    const visibleNeurons = neurons.filter(n => 
      isWithinExtendedViewport(n.x, n.y, config.viewportMargin)
    );
    
    if (visibleNeurons.length === 0) return;
    
    // Select a random visible neuron to pulse
    const neuronToPulse = visibleNeurons[
      Math.floor(Math.random() * visibleNeurons.length)
    ];
    
    neuronToPulse.pulseStrength = 1; // Start the pulse effect
    lastPulseTime = timestamp; // Update the last pulse time
  }
  
  function animate(timestamp: number) {
    // Handle first frame case
    if (!lastFrameTime) lastFrameTime = timestamp;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Optional: Fill with background color first
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Measure and update FPS
    updateFps(timestamp);
    
    // Draw all connections first (they're drawn behind neurons)
    drawConnections(timestamp);
    
    // Draw all branches
    drawBranches(timestamp);
    
    // Draw all neurons
    neurons.forEach(drawNeuron);
    
    // Try periodic pulsing
    pulse(timestamp);
    
    // Update and draw traveling nodes
    updateAndDrawTravelingNodes(timestamp);
    
    // Update lastFrameTime for next animation frame
    lastFrameTime = timestamp;
    
    // Request next frame
    animationFrameId = requestAnimationFrame(animate);
  }
  
  // Initialize neural network
  function initializeNetwork() {
    initializeNeurons();
    createConnections();
    createBranches();
    initializeTravelingNodes();
    
    // Start the animation loop
    animationFrameId = requestAnimationFrame(animate);
  }
  
  // Initialize the neural network
  initializeNetwork();
  
  // Return cleanup function
  return function cleanup() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}
