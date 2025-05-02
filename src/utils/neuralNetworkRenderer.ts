
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
      
      const x = 0.5 + 1 * Math.sin(phi) * Math.cos(theta);
      const y = 0.5 + 1 * Math.sin(phi) * Math.sin(theta);
      
      // Add slight random variation
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
    
    // Find neurons that are within the viewport or extended margin
    const neuronsWithConnections = neurons.filter(n => 
      n.connections.length > 0 && 
      isWithinExtendedViewport(n.x, n.y, config.viewportMargin * 2)
    );
    
    if (neuronsWithConnections.length === 0) return;
    
    // Select a random neuron with connections that's in view
    const sourceNeuron = neuronsWithConnections[Math.floor(Math.random() * neuronsWithConnections.length)];
    
    // Filter connections to only include those within a reasonable distance
    // and further reduce maximum distance if performance is low
    const maxDistance = isLowPerformance ? 
                       config.maxDistanceForAnimation * 0.7 : 
                       config.maxDistanceForAnimation;
                       
    const viableConnections = sourceNeuron.connections.filter(conn => {
      const distance = calculateDistance(
        sourceNeuron.x, sourceNeuron.y, 
        conn.target.x, conn.target.y
      );
      
      return distance <= maxDistance && 
             isWithinExtendedViewport(conn.target.x, conn.target.y, config.viewportMargin * 2);
    });
    
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
      pathPoints.push(getPositionAlongPath(connection, t));
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
  
  // Create connections with adaptive complexity
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
              
              controlPoints.push({
                x: baseX + perpX * variance,
                y: baseY + perpY * variance
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
            
            controlPoints.push({
              x: baseX + perpX * variance,
              y: baseY + perpY * variance
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
        1  // Maximum 1 new node per frame for stability
      );
      
      for (let i = 0; i < nodesToAdd; i++) {
        createNewTravelingNode();
      }
    }
  }
  
  // Draw branches with performance optimizations
  function drawBranches(neuron: Neuron, timestamp: number) {
    // Skip if neuron is not within extended viewport
    if (!isWithinExtendedViewport(neuron.x, neuron.y)) {
      return;
    }
    
    // Skip some branches on very low performance
    const branchesCount = isVeryLowPerformance ? 
                         Math.min(1, neuron.branches.length) : 
                         neuron.branches.length;
                         
    for (let i = 0; i < branchesCount; i++) {
      const branch = neuron.branches[i];
      
      // Update flow phase more slowly on low performance
      branch.flowPhase += isLowPerformance ? 0.001 : 0.002;
      if (branch.flowPhase > Math.PI * 2) branch.flowPhase -= Math.PI * 2;
      
      // Draw branch as a bezier curve
      ctx.strokeStyle = config.connectionColor;
      ctx.lineWidth = branch.width * (isLowPerformance ? 
                     1 : // No pulse animation on low performance
                     (0.8 + Math.sin(branch.flowPhase) * 0.2));
      
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
    }
  }
  
  // Draw connections with optimizations for different performance levels
  function drawConnection(connection: Connection, timestamp: number) {
    const { source, target } = connection;
    
    // Skip if both endpoints are outside the extended viewport
    if (!isWithinExtendedViewport(source.x, source.y) && 
        !isWithinExtendedViewport(target.x, target.y)) {
      return;
    }
    
    // Skip if connection distance exceeds allowed maximum
    const connectionDistance = calculateDistance(
      source.x, source.y, target.x, target.y
    );
    
    // Dynamic distance threshold based on performance
    const maxAllowedDistance = isVeryLowPerformance ? 
                              config.maxDistanceForAnimation * 0.6 : 
                              (isLowPerformance ? config.maxDistanceForAnimation * 0.8 : 
                               config.maxDistanceForAnimation * 1.2);
                               
    if (connectionDistance > maxAllowedDistance) {
      return;
    }
    
    // Update flow phase - slower on low performance
    connection.flowPhase += isLowPerformance ? 
                           connection.flowSpeed * 0.5 : 
                           connection.flowSpeed;
                           
    if (connection.flowPhase > Math.PI * 2) connection.flowPhase -= Math.PI * 2;
    
    const { width, controlPoints } = connection;
    
    // Draw connection path
    ctx.strokeStyle = config.connectionColor;
    
    // Simplify animation on low performance devices
    ctx.lineWidth = width * (isLowPerformance ? 
                           1 : // No pulse animation on low performance
                           (0.8 + Math.sin(connection.flowPhase) * 0.2));
    
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
      // Simplify path for low performance
      const pointsToDraw = isLowPerformance ? 
                          Math.min(2, controlPoints.length) : 
                          controlPoints.length;
                          
      for (let i = 0; i < pointsToDraw; i++) {
        const point = controlPoints[i];
        
        // Reduce animation on low performance
        const animationScale = isVeryLowPerformance ? 
                               0 : // No animation on very low performance
                               (isLowPerformance ? 0.5 : 1.5);
        const offsetX = Math.sin(connection.flowPhase + i * 0.7) * width * animationScale;
        const offsetY = Math.cos(connection.flowPhase + i * 0.7) * width * animationScale;
        
        if (i === 0) {
          ctx.quadraticCurveTo(
            point.x + offsetX,
            point.y + offsetY,
            (point.x + (i + 1 < pointsToDraw ? controlPoints[i + 1].x : target.x)) / 2,
            (point.y + (i + 1 < pointsToDraw ? controlPoints[i + 1].y : target.y)) / 2
          );
        } else if (i < pointsToDraw - 1) {
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
  
  /**
   * Calculate position along a bezier curve with performance optimizations
   */
  function getPositionAlongPath(connection: Connection, t: number): Point {
    t = Math.max(0, Math.min(1, t));
    
    const { source, target, controlPoints } = connection;
    
    if (controlPoints.length === 0) {
      // Linear interpolation - most efficient
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
      // Simplified approach for more complex paths
      // Use fewer calculations on low performance devices
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
  
  /**
   * Main render function with adaptive rendering quality
   */
  function render(timestamp: number) {
    // Start peformance monitoring for this frame
    updateFps(timestamp);
    
    // Clear the canvas with appropriate transparency based on performance
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply semi-transparent overlay with adjusted opacity for performance
    const overlayOpacity = isVeryLowPerformance ? 0.7 : 
                          (isLowPerformance ? 0.5 : 0.3);
                          
    ctx.fillStyle = theme === 'dark' 
      ? `rgba(2, 8, 23, ${overlayOpacity})`
      : `rgba(255, 255, 255, ${overlayOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections and branches
    neurons.forEach(neuron => {
      // Skip some neurons entirely on very low performance
      if (isVeryLowPerformance && Math.random() > 0.7) return;
      
      // Draw branches first, so they appear behind
      if (!isVeryLowPerformance || Math.random() > 0.3) { // Skip some branches on very low perf
        drawBranches(neuron, timestamp);
      }
      
      // Draw connections
      if (isWithinExtendedViewport(neuron.x, neuron.y)) {
        neuron.connections.forEach(connection => {
          // Skip some connections on very low performance
          if (isVeryLowPerformance && Math.random() > 0.6) return;
          
          drawConnection(connection, timestamp);
        });
      }
    });
    
    // Update and draw traveling nodes
    updateAndDrawTravelingNodes(timestamp);
    
    // Draw neurons on top
    neurons.forEach(drawNeuron);
    
    // Apply occasional random pulses to neurons - less frequently on low performance
    const pulseInterval = isVeryLowPerformance ? 
                         config.pulseInterval * 2 : 
                         (isLowPerformance ? config.pulseInterval * 1.5 : config.pulseInterval);
                         
    if (timestamp - lastPulseTime > pulseInterval) {
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
    // Clear the canvas first
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Initialize FPS counter and performance tracking
    lastFpsUpdate = performance.now();
    frameCount = 0;
    fpsHistory = [];
    
    // Try to detect initial performance level quickly
    const startTime = performance.now();
    let testCounter = 0;
    
    // Simple benchmark function
    const quickPerformanceTest = () => {
      testCounter++;
      if (testCounter < 100) {
        // Draw 100 random circles and lines for testing GPU/rendering performance
        ctx.clearRect(0, 0, 100, 100);
        for (let i = 0; i < 50; i++) {
          ctx.beginPath();
          ctx.arc(
            Math.random() * 100, 
            Math.random() * 100, 
            Math.random() * 10 + 5,
            0, Math.PI * 2
          );
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(Math.random() * 100, Math.random() * 100);
          ctx.lineTo(Math.random() * 100, Math.random() * 100);
          ctx.stroke();
        }
        requestAnimationFrame(quickPerformanceTest);
      } else {
        // Test complete - evaluate
        const endTime = performance.now();
        const fps = 1000 / ((endTime - startTime) / testCounter);
        
        // Set initial quality based on quick test
        if (fps < 30) {
          // Very low performance
          isVeryLowPerformance = true;
          isLowPerformance = true;
          adaptiveQualityLevel = 3;
        } else if (fps < 55) {
          // Low performance
          isLowPerformance = true;
          adaptiveQualityLevel = 2;
        } else {
          // Good performance
          adaptiveQualityLevel = 1;
        }
        
        // Continue with main initialization
        completeInitialization();
      }
    };
    
    // Start quick performance test
    quickPerformanceTest();
    
    // Function to complete initialization after performance check
    function completeInitialization() {
      // Clear the test area
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Initialize network with quality level-adjusted settings
      initializeNeurons();
      createBranches();
      createConnections();
      initializeTravelingNodes();
      
      lastFrameTime = performance.now();
      animationFrameId = requestAnimationFrame(render);
    }
  }
  
  // Start the animation
  init();
  
  // Return cleanup function
  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    
    if (adaptiveQualityTimeout) {
      clearTimeout(adaptiveQualityTimeout);
    }
  };
}

