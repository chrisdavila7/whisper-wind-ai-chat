import { Neuron, Connection, Branch, Point } from '../types/neural';

/**
 * Draws and animates an organic neural network on a canvas
 * With enhanced performance optimizations for smooth animation on all devices
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
    
    // Adaptive parameters based on device performance
    neuronCount: 16, // Further reduced for better performance
    minConnections: 2,
    maxConnections: 4, // Reduced max connections
    minBranches: 1, // Reduced min branches
    maxBranches: 3, // Reduced max branches
    branchLength: { min: 30, max: 100 }, // Slightly reduced max branch length
    
    // Animation settings with performance defaults
    flowSpeed: 0.003, // Slightly reduced speed
    pulseInterval: 4000, // Increased interval for better performance
    glowIntensity: theme === 'dark' ? 0.5 : 0.3, // Further reduced glow intensity
    neuronSize: { min: 2, max: 6 }, // Smaller neurons
    
    // Traveling node settings optimized for performance
    travelingNodeCount: 5, // Reduced count
    travelingNodeSpeedFactor: 0.003, // Slightly slower for consistent movement
    travelingNodeGlowDuration: 6000,
    nodeSamples: 50, // Reduced sample points for paths
    
    // Enhanced performance optimization settings
    maxDistanceForAnimation: 1200, // Reduced maximum distance
    performanceThreshold: 45, // Slightly more aggressive performance threshold
    lowPerformanceThreshold: 30, // Threshold for very low performance
    viewportMargin: 80, // Reduced margin
    fpsUpdateInterval: 1000,
    fpsHistorySize: 5, // Track FPS over time for more stable measurements
    adaptiveRenderingDelay: 300, // ms to wait before adapting rendering quality

    // Safe margins to prevent nodes getting stuck in corners (added)
    safeMargin: 0.15, // 15% margin from edges
  };

  // State
  let neurons: Neuron[] = [];
  let travelingNodes: TravelingNode[] = [];
  let animationFrameId: number;
  let lastPulseTime = 0;
  let lastFrameTime = 0;
  
  // Enhanced performance monitoring
  let frameCount = 0;
  let lastFpsUpdate = 0;
  let currentFps = 60; // Starting assumption
  let isLowPerformance = false;
  let isVeryLowPerformance = false;
  let fpsHistory: number[] = [];
  let adaptiveQualityTimeout: number | null = null;
  let adaptiveQualityLevel = 1; // 1=high, 2=medium, 3=low quality
  
  /**
   * Interface for traveling nodes with performance optimization
   */
  interface TravelingNode {
    x: number;
    y: number;
    targetNeuron: Neuron;
    sourceNeuron: Neuron;
    connection: Connection;
    progress: number;
    speed: number;
    width: number;
    active: boolean;
    path?: Point[];
    pathIndex?: number;
    pathLength?: number;
    isWithinViewport?: boolean;
    // Track skip frames for very low-end devices
    skipFrameCount?: number;
  }
  
  /**
   * Check if a position is within the extended viewport
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
   * Check if a position is within safe area (not too close to edges)
   * This prevents nodes from getting trapped in corners
   */
  function isWithinSafeArea(x: number, y: number): boolean {
    const safeMarginX = canvas.width * config.safeMargin;
    const safeMarginY = canvas.height * config.safeMargin;
    
    return (
      x >= safeMarginX && 
      x <= canvas.width - safeMarginX && 
      y >= safeMarginY && 
      y <= canvas.height - safeMarginY
    );
  }
  
  /**
   * Calculate distance between two points
   */
  function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  
  /**
   * Get average FPS from history for more stable measurements
   */
  function getAverageFps(): number {
    if (fpsHistory.length === 0) return 60;
    return fpsHistory.reduce((sum, fps) => sum + fps, 0) / fpsHistory.length;
  }
  
  /**
   * Monitor and update FPS with enhanced stability measures
   */
  function updateFps(timestamp: number) {
    frameCount++;
    
    // Update FPS counter once per second
    if (timestamp - lastFpsUpdate >= config.fpsUpdateInterval) {
      const newFps = Math.round((frameCount * 1000) / (timestamp - lastFpsUpdate));
      frameCount = 0;
      lastFpsUpdate = timestamp;
      
      // Add to FPS history for more stable measurements
      fpsHistory.push(newFps);
      if (fpsHistory.length > config.fpsHistorySize) {
        fpsHistory.shift(); // Remove oldest entry
      }
      
      // Get average FPS for more stable performance detection
      currentFps = getAverageFps();
      
      // Detect performance issues using average FPS
      isLowPerformance = currentFps < config.performanceThreshold;
      isVeryLowPerformance = currentFps < config.lowPerformanceThreshold;
      
      // Schedule adaptive quality adjustment with debounce
      if (adaptiveQualityTimeout) clearTimeout(adaptiveQualityTimeout);
      adaptiveQualityTimeout = window.setTimeout(() => {
        adaptQualityToPerformance();
      }, config.adaptiveRenderingDelay);
    }
  }
  
  /**
   * Adapt rendering quality based on device performance
   * This function dynamically adjusts visual quality to maintain framerate
   */
  function adaptQualityToPerformance() {
    const averageFps = getAverageFps();
    let newQualityLevel = adaptiveQualityLevel;
    
    // Determine appropriate quality level based on performance
    if (averageFps < config.lowPerformanceThreshold) {
      newQualityLevel = 3; // Low quality
    } else if (averageFps < config.performanceThreshold) {
      newQualityLevel = 2; // Medium quality
    } else {
      // Only upgrade quality if we're well above the threshold
      if (averageFps > config.performanceThreshold + 10) {
        newQualityLevel = 1; // High quality
      }
    }
    
    // Only make changes if quality level changed
    if (newQualityLevel !== adaptiveQualityLevel) {
      adaptiveQualityLevel = newQualityLevel;
      applyAdaptiveQualitySettings();
    }
  }
  
  /**
   * Apply quality settings based on the current adaptive quality level
   * This adjusts visual elements and animation complexity
   */
  function applyAdaptiveQualitySettings() {
    const activeNodes = travelingNodes.filter(n => n.active);
    let maxActiveNodes = config.travelingNodeCount;
    
    // Apply quality-specific settings
    switch (adaptiveQualityLevel) {
      case 3: // Low quality
        // Drastically reduce active nodes
        maxActiveNodes = Math.max(2, Math.floor(config.travelingNodeCount / 3));
        // Deactivate excess nodes immediately
        if (activeNodes.length > maxActiveNodes) {
          let nodesToDeactivate = activeNodes.length - maxActiveNodes;
          for (let i = 0; i < travelingNodes.length && nodesToDeactivate > 0; i++) {
            if (travelingNodes[i].active) {
              travelingNodes[i].active = false;
              nodesToDeactivate--;
            }
          }
        }
        break;
        
      case 2: // Medium quality
        // Moderately reduce active nodes
        maxActiveNodes = Math.max(3, Math.floor(config.travelingNodeCount / 2));
        // Deactivate some excess nodes
        if (activeNodes.length > maxActiveNodes) {
          let nodesToDeactivate = activeNodes.length - maxActiveNodes;
          for (let i = 0; i < travelingNodes.length && nodesToDeactivate > 0; i++) {
            if (travelingNodes[i].active) {
              travelingNodes[i].active = false;
              nodesToDeactivate--;
            }
          }
        }
        break;
        
      case 1: // High quality (default)
      default:
        // Allow creating more nodes if we're below the limit
        if (activeNodes.length < config.travelingNodeCount) {
          // Create new nodes up to the limit
          const nodesToAdd = Math.min(
            config.travelingNodeCount - activeNodes.length,
            1 // Add at most 1 node per quality adjustment to avoid sudden changes
          );
          
          for (let i = 0; i < nodesToAdd; i++) {
            createNewTravelingNode();
          }
        }
        break;
    }
  }
  
  // Initialize neurons with improved distribution and more spacing
  function initializeNeurons() {
    neurons = [];
    // Create neurons with better spherical distribution
    const neuronCount = isLowPerformance ? 
                        Math.floor(config.neuronCount * 0.75) : 
                        config.neuronCount;
                        
    for (let i = 0; i < neuronCount; i++) {
      // Use spherical fibonacci distribution for better coverage
      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      const i_normalized = i / neuronCount;
      const theta = 2 * Math.PI * i_normalized * goldenRatio;
      
      const phi = Math.acos(1 - 2 * i_normalized);
      
      // Apply safe margins to prevent nodes getting stuck in corners or edges
      // Map from 0-1 range to safe area range
      const safeMargin = config.safeMargin;
      const x = safeMargin + (1 - 2 * safeMargin) * 0.5 * (1 + Math.sin(phi) * Math.cos(theta));
      const y = safeMargin + (1 - 2 * safeMargin) * 0.5 * (1 + Math.sin(phi) * Math.sin(theta));
      
      // Add slight random variation that respects safe margins
      const maxJitter = Math.min(0.1, safeMargin * 0.5); // Limit jitter to half of safe margin
      const jitterX = (Math.random() - 0.5) * maxJitter;
      const jitterY = (Math.random() - 0.5) * maxJitter;
      
      // Calculate final position in canvas coordinates with safe margins
      const canvasX = (x + jitterX) * canvas.width;
      const canvasY = (y + jitterY) * canvas.height;
      
      neurons.push({
        id: i,
        x: canvasX,
        y: canvasY,
        size: config.neuronSize.min + Math.random() * (config.neuronSize.max - config.neuronSize.min),
        connections: [],
        branches: [],
        pulseStrength: 0,
      });
    }
  }
  
  // Initialize traveling nodes based on performance capacity
  function initializeTravelingNodes() {
    travelingNodes = [];
    
    // Create initial nodes, adjusted for performance
    const initialNodeCount = isLowPerformance ? 
                            Math.floor(config.travelingNodeCount * 0.5) : 
                            config.travelingNodeCount;
                            
    for (let i = 0; i < initialNodeCount; i++) {
      // Stagger creation slightly to avoid all nodes being synced
      setTimeout(() => {
        createNewTravelingNode();
      }, i * 100); // Stagger by 100ms
    }
  }
  
  /**
   * Calculate the total length of a path
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
   * Create a new traveling node with adaptive performance
   */
  function createNewTravelingNode() {
    if (neurons.length === 0) return;
    
    // Don't create additional nodes if performance is suffering
    if (isLowPerformance && travelingNodes.filter(n => n.active).length >= 
        (isVeryLowPerformance ? 2 : Math.max(2, Math.floor(config.travelingNodeCount / 2)))) {
      return;
    }
    
    // Find neurons that are within the viewport AND safe area (not too close to edges)
    // This prevents nodes from getting trapped in corners
    const neuronsWithConnections = neurons.filter(n => 
      n.connections.length > 0 && 
      isWithinExtendedViewport(n.x, n.y, config.viewportMargin * 2) &&
      isWithinSafeArea(n.x, n.y)
    );
    
    // If no neurons match our criteria, don't create a node
    if (neuronsWithConnections.length === 0) return;
    
    // Select a random neuron with connections that's in view and safe area
    const sourceNeuron = neuronsWithConnections[Math.floor(Math.random() * neuronsWithConnections.length)];
    
    // Filter connections to only include those within safe area
    // This ensures traveling nodes don't move to edge areas where they might get stuck
    const viableConnections = sourceNeuron.connections.filter(conn => {
      const distance = calculateDistance(
        sourceNeuron.x, sourceNeuron.y, 
        conn.target.x, conn.target.y
      );
      
      return distance <= config.maxDistanceForAnimation && 
             isWithinExtendedViewport(conn.target.x, conn.target.y, config.viewportMargin * 2) &&
             isWithinSafeArea(conn.target.x, conn.target.y);
    });
    
    // If no viable connections, don't create a node
    if (viableConnections.length === 0) return;
    
    // Select a random viable connection
    const connection = viableConnections[Math.floor(Math.random() * viableConnections.length)];
    const targetNeuron = connection.target;
    
    // Pre-compute path points - reduce samples for low performance
    const pathPoints: Point[] = [];
    const samples = isVeryLowPerformance ? 
                   Math.floor(config.nodeSamples / 2) : 
                   (isLowPerformance ? Math.floor(config.nodeSamples * 0.75) : config.nodeSamples);
    
    // Generate sample points along the connection path
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const position = getPositionAlongPath(connection, t);
      
      // Additional safety check to ensure path points don't go outside safe area
      if (isWithinSafeArea(position.x, position.y)) {
        pathPoints.push(position);
      } else {
        // If point is outside safe area, adjust it to stay within
        const safePosition = {
          x: Math.max(canvas.width * config.safeMargin, 
                     Math.min(position.x, canvas.width * (1 - config.safeMargin))),
          y: Math.max(canvas.height * config.safeMargin, 
                     Math.min(position.y, canvas.height * (1 - config.safeMargin)))
        };
        pathPoints.push(safePosition);
      }
    }
    
    const pathLength = calculatePathLength(pathPoints);
    
    // Create a traveling node with performance adaptations
    travelingNodes.push({
      x: sourceNeuron.x,
      y: sourceNeuron.y,
      sourceNeuron,
      targetNeuron,
      connection,
      progress: 0,
      // Use consistent speed factor with less variation on low performance devices
      speed: config.travelingNodeSpeedFactor * (isLowPerformance ? 
             (0.9 + Math.random() * 0.2) : (0.8 + Math.random() * 0.4)),
      width: connection.width * 0.6,
      active: true,
      path: pathPoints,
      pathIndex: 0,
      pathLength: pathLength,
      isWithinViewport: true,
      // Skip frames on very low performance devices
      skipFrameCount: isVeryLowPerformance ? Math.floor(Math.random() * 2) : 0
    });
  }
  
  // Create branches with adaptive complexity
  function createBranches() {
    neurons.forEach(neuron => {
      // Reduce branch count for performance
      const maxBranches = isLowPerformance ? 
                         Math.max(1, config.minBranches) : 
                         config.maxBranches;
                         
      const branchCount = config.minBranches + 
                         Math.floor(Math.random() * (maxBranches - config.minBranches + 1));
      
      for (let i = 0; i < branchCount; i++) {
        const angle = Math.PI * 2 * (i / branchCount);
        const length = config.branchLength.min + 
                      Math.random() * (config.branchLength.max - config.branchLength.min);
        
        // Reduce control points for low performance
        const controlPointCount = isLowPerformance ? 1 : (1 + Math.floor(Math.random() * 2));
        const controlPoints: Point[] = [];
        
        for (let j = 0; j < controlPointCount; j++) {
          const segmentLength = length / controlPointCount;
          const segmentPosition = (j + 1) / (controlPointCount + 1);
          const segmentDistance = segmentPosition * length;
          
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
          width: (0.5 + Math.random() * (isLowPerformance ? 0.5 : 1)),
          flowPhase: Math.random() * Math.PI * 2
        });
      }
    });
  }
  
  // Create connections with adaptive complexity and distance checks
  function createConnections() {
    // First ensure each neuron has at least minConnections
    neurons.forEach(neuron => {
      // Find all other neurons that are within safe distance
      const potentialTargets = neurons
        .filter(n => {
          if (n.id === neuron.id) return false;
          
          // Calculate distance
          const distance = Math.sqrt(
            Math.pow(n.x - neuron.x, 2) + 
            Math.pow(n.y - neuron.y, 2)
          );
          
          // Check if the target is within safe distance and not too close
          // This prevents creating connections that could lead to nodes getting stuck
          const maxDistance = isLowPerformance ? 
                            config.maxDistanceForAnimation * 0.7 : 
                            config.maxDistanceForAnimation;
          
          // Connection should be within maxDistance and target neuron should be in safe area
          return distance <= maxDistance && isWithinSafeArea(n.x, n.y);
        })
        .map(n => ({
          neuron: n,
          distance: Math.sqrt(
            Math.pow(n.x - neuron.x, 2) + 
            Math.pow(n.y - neuron.y, 2)
          )
        }));
      
      potentialTargets.sort((a, b) => a.distance - b.distance);
      
      // Reduce connection count for performance
      const maxConnections = isLowPerformance ? 
                            Math.min(3, config.maxConnections) : 
                            config.maxConnections;
                            
      const connectionCount = config.minConnections + 
                             Math.floor(Math.random() * (maxConnections - config.minConnections + 1));
      
      // Divide the circle into sectors for even distribution
      const sectors = isLowPerformance ? 4 : 6; // Reduced sectors for low performance
      const sectorsWithConnections = Array(sectors).fill(0);
      const connectionsPerSector = Math.ceil(connectionCount / sectors);
      
      // Create connections for each sector
      for (let sec = 0; sec < sectors; sec++) {
        const sectorStartAngle = (sec * 2 * Math.PI) / sectors;
        const sectorEndAngle = ((sec + 1) * 2 * Math.PI) / sectors;
        
        const targetsInSector = potentialTargets.filter(target => {
          const angle = Math.atan2(
            target.neuron.y - neuron.y,
            target.neuron.x - neuron.x
          ) + Math.PI; // Normalize to 0-2π
          
          return (angle >= sectorStartAngle && angle < sectorEndAngle);
        });
        
        // Connect to closest targets in this sector
        for (let i = 0; i < Math.min(connectionsPerSector, targetsInSector.length); i++) {
          if (sectorsWithConnections[sec] < connectionsPerSector && 
              targetsInSector[i] && 
              neuron.connections.length < connectionCount) {
            
            const target = targetsInSector[i].neuron;
            const distance = targetsInSector[i].distance;
            
            // Reduce control point count for low performance
            const controlPointCount = isLowPerformance ? 
                                     1 : 
                                     (1 + Math.floor(Math.random() * 2));
            const controlPoints: Point[] = [];
            
            for (let j = 0; j < controlPointCount; j++) {
              const t = (j + 1) / (controlPointCount + 1);
              const baseX = neuron.x + (target.x - neuron.x) * t;
              const baseY = neuron.y + (target.y - neuron.y) * t;
              
              // Reduce variance for low performance
              const perpX = -(target.y - neuron.y) / distance;
              const perpY = (target.x - neuron.x) / distance;
              const variance = (Math.random() * (isLowPerformance ? 0.3 : 0.5) - 
                              (isLowPerformance ? 0.15 : 0.25)) * distance;
              
              // Generate control point and ensure it's within safe area
              let ctrlX = baseX + perpX * variance;
              let ctrlY = baseY + perpY * variance;
              
              // Adjust control point if outside safe area
              if (!isWithinSafeArea(ctrlX, ctrlY)) {
                ctrlX = Math.max(canvas.width * config.safeMargin, 
                               Math.min(ctrlX, canvas.width * (1 - config.safeMargin)));
                ctrlY = Math.max(canvas.height * config.safeMargin, 
                               Math.min(ctrlY, canvas.height * (1 - config.safeMargin)));
              }
              
              controlPoints.push({
                x: ctrlX,
                y: ctrlY
              });
            }
            
            const connection: Connection = {
              id: neuron.connections.length,
              source: neuron,
              target: target,
              width: 0.5 + Math.random() * (isLowPerformance ? 2 : 4), // Reduced width for low performance
              controlPoints,
              flowSpeed: config.flowSpeed * (0.7 + Math.random() * (isLowPerformance ? 2 : 5)),
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
          
          // Simple control points for minimum connections
          const controlPointCount = isLowPerformance ? 1 : 2;
          const controlPoints: Point[] = [];
          
          for (let j = 0; j < controlPointCount; j++) {
            const t = (j + 1) / (controlPointCount + 1);
            const baseX = neuron.x + (target.x - neuron.x) * t;
            const baseY = neuron.y + (target.y - neuron.y) * t;
            
            const perpX = -(target.y - neuron.y) / distance;
            const perpY = (target.x - neuron.x) / distance;
            const variance = (Math.random() * 0.3 - 0.15) * distance;
            
            // Generate control point and ensure it's within safe area
            let ctrlX = baseX + perpX * variance;
            let ctrlY = baseY + perpY * variance;
            
            // Adjust control point if outside safe area
            if (!isWithinSafeArea(ctrlX, ctrlY)) {
              ctrlX = Math.max(canvas.width * config.safeMargin, 
                             Math.min(ctrlX, canvas.width * (1 - config.safeMargin)));
              ctrlY = Math.max(canvas.height * config.safeMargin, 
                             Math.min(ctrlY, canvas.height * (1 - config.safeMargin)));
            }
            
            controlPoints.push({
              x: ctrlX,
              y: ctrlY
            });
          }
          
          const connection: Connection = {
            id: neuron.connections.length,
            source: neuron,
            target: target,
            width: 0.5 + Math.random() * 2,
            controlPoints,
            flowSpeed: config.flowSpeed * (0.7 + Math.random() * 2),
            flowPhase: Math.random() * Math.PI * 2
          };
          
          neuron.connections.push(connection);
        }
      }
    });
  }
  
  // Draw a neuron with adaptive glow effects
  function drawNeuron(neuron: Neuron) {
    if (!isWithinExtendedViewport(neuron.x, neuron.y)) {
      return;
    }

    // Skip glow effects on very low performance
    if (neuron.pulseStrength > 0 && !isVeryLowPerformance) {
      const glowRadius = neuron.size * 3; // Reduced from 4 for better performance
      const glow = ctx.createRadialGradient(
        neuron.x, neuron.y, neuron.size * 0.5,
        neuron.x, neuron.y, glowRadius
      );
      
      // Use reduced glow intensity for better performance
      const baseAlpha = neuron.pulseStrength * 
                      (isLowPerformance ? config.glowIntensity * 0.7 : config.glowIntensity);
      
      glow.addColorStop(0, `rgba(59, 130, 246, ${baseAlpha})`);
      glow.addColorStop(1, 'rgba(59, 130, 246, 0)');

      // Only use shadows for high quality mode
      if (!isLowPerformance) {
        ctx.save();
        ctx.shadowBlur = glowRadius * 1;
        ctx.shadowColor = `rgba(59, 130, 246, ${baseAlpha})`;
      }

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(neuron.x, neuron.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      if (!isLowPerformance) {
        ctx.restore();
      }
    }
    
    // Draw neuron body
    ctx.fillStyle = config.neuronColor.base;
    ctx.beginPath();
    ctx.arc(neuron.x, neuron.y, neuron.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw inner core (skip on very low performance)
    if (!isVeryLowPerformance) {
      ctx.fillStyle = config.neuronColor.core;
      ctx.beginPath();
      ctx.arc(neuron.x, neuron.y, neuron.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Reduce pulse strength - faster decay on low performance
    neuron.pulseStrength *= isLowPerformance ? 0.9 : 0.95;
    if (neuron.pulseStrength < 0.05) neuron.pulseStrength = 0;
  }
  
  /**
   * Update and draw traveling nodes with frame skipping for low-end devices
   */
  function updateAndDrawTravelingNodes(timestamp: number) {
    // Calculate delta time for frame-rate independent movement
    const deltaTime = timestamp - lastFrameTime;
    const deltaFactor = deltaTime / 16.67; // Normalize to ~60fps
    
    let activeNodesInViewport = 0;
    
    for (let i = 0; i < travelingNodes.length; i++) {
      const node = travelingNodes[i];
      if (!node.active) continue;
      
      // Skip frames on very low performance devices
      if (isVeryLowPerformance && node.skipFrameCount && node.skipFrameCount > 0) {
        node.skipFrameCount--;
        continue;
      }
      
      // Reset skip counter for next frame
      if (isVeryLowPerformance) {
        node.skipFrameCount = 1; // Skip every other frame
      }
      
      // Update progress with performance adjustments
      const speedAdjustment = node.pathLength ? 500 / node.pathLength : 1;
      node.progress += node.speed * deltaFactor * speedAdjustment;
      
      // Update position based on progress
      if (node.path && node.path.length > 0) {
        const nextIndex = Math.min(
          Math.floor(node.progress * node.path.length), 
          node.path.length - 1
        );
        
        if (nextIndex >= 0 && nextIndex < node.path.length) {
          node.x = node.path[nextIndex].x;
          node.y = node.path[nextIndex].y;
          node.isWithinViewport = isWithinExtendedViewport(node.x, node.y);
        }
      } else {
        const position = getPositionAlongPath(node.connection, node.progress);
        node.x = position.x;
        node.y = position.y;
        node.isWithinViewport = isWithinExtendedViewport(node.x, node.y);
      }
      
      // Safety check - if node somehow gets outside safe area, deactivate it
      // This prevents edge-case trapped nodes in corners
      if (!isWithinSafeArea(node.x, node.y)) {
        node.active = false;
        continue;
      }
      
      // Check if node has reached target
      if (node.progress >= 1) {
        // Trigger glow effect on target neuron if within viewport
        if (isWithinExtendedViewport(node.targetNeuron.x, node.targetNeuron.y)) {
          node.targetNeuron.pulseStrength = 1;
        }
        
        node.active = false;
        
        // Create a new node with adaptive delay based on performance
        const delay = isVeryLowPerformance ? 
                     Math.random() * 3000 + 1500 :
                     (isLowPerformance ? Math.random() * 2000 + 1000 : Math.random() * 1000);
                     
        setTimeout(() => {
          createNewTravelingNode();
        }, delay);
        
        continue;
      }
      
      // Skip drawing if outside viewport
      if (!node.isWithinViewport) {
        continue;
      }
      
      activeNodesInViewport++;
      
      // Draw traveling node
      ctx.fillStyle = config.connectionColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.width, 0, Math.PI * 2);
      ctx.fill();
      
      // Only add glow effect if performance is good
      if (!isLowPerformance) {
        // Add small glow effect to traveling node
        const nodeGlow = ctx.createRadialGradient(
          node.x, node.y, node.width *
