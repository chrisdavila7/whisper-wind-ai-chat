
import { Neuron, Connection, Branch, Point } from '../types/neural';

/**
 * Draws a minimalist neural network on a canvas with a clean, modern style
 * that matches the reference image
 */
export function drawMinimalistNeuralNetwork(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, theme: 'light' | 'dark' = 'dark') {
  // Configuration
  const config = {
    // Base colors - dark deep blue background with subtle blue connections
    backgroundColor: theme === 'dark' ? '#0F1520' : '#EDF2F7',
    // Connection color - subtle blue with very low opacity to match reference
    connectionColor: theme === 'dark' 
      ? 'rgba(65, 90, 120, 0.4)' // Subtle blue with low opacity (dark mode)
      : 'rgba(65, 90, 120, 0.3)', // Subtle blue with low opacity (light mode)
    
    // Neuron colors - slightly brighter blue nodes
    neuronColor: {
      base: theme === 'dark' 
        ? 'rgba(75, 100, 140, 0.8)' // Slightly brighter blue (dark mode)
        : 'rgba(75, 100, 140, 0.6)', // Slightly brighter blue (light mode)
      core: theme === 'dark'
        ? 'rgba(85, 110, 150, 0.9)' // Brighter center (dark mode)
        : 'rgba(85, 110, 150, 0.7)', // Brighter center (light mode)
    },
    
    // Network structure parameters
    neuronCount: 8, // Fewer neurons for the minimalist look
    minConnections: 3,
    maxConnections: 6,
    
    // No branches for this minimalist style
    useBranches: false,
    
    // Animation settings
    flowSpeed: 0.0002, // Slow, subtle flow
    pulseInterval: 300000,
    glowIntensity: 0.2, // Reduced glow
    
    // Neuron size - larger neurons as per reference
    neuronSize: { min: 12, max: 20 }, // Larger neurons
    neuronCoreScale: 1.5, // Less contrast between core and outer
    
    // Traveling nodes - reduced for minimalist look
    travelingNodeCount: 5,
    travelingNodeSpeedFactor: 0.001, // Slower nodes
    
    // Line thickness - thicker lines as in reference
    connectionWidth: { min: 1.5, max: 2.5 },
    
    // Performance optimization
    maxDistanceForAnimation: 1800,
    performanceThreshold: 40,
    viewportMargin: 100,
    fpsUpdateInterval: 1000,
  };

  // State
  let neurons: Neuron[] = [];
  let travelingNodes: TravelingNode[] = [];
  let animationFrameId: number;
  let lastPulseTime = 0;
  let lastFrameTime = 0;
  
  // Performance monitoring
  let frameCount = 0;
  let lastFpsUpdate = 0;
  let currentFps = 60;
  let isLowPerformance = false;
  
  /**
   * Interface for traveling nodes
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
   * Monitor and update FPS (frames per second)
   */
  function updateFps(timestamp: number) {
    frameCount++;
    
    if (timestamp - lastFpsUpdate >= config.fpsUpdateInterval) {
      currentFps = Math.round((frameCount * 1000) / (timestamp - lastFpsUpdate));
      frameCount = 0;
      lastFpsUpdate = timestamp;
      
      isLowPerformance = currentFps < config.performanceThreshold;
    }
  }
  
  // Initialize neurons with spacing matching the reference image
  function initializeNeurons() {
    neurons = [];
    
    // Create neurons in a grid-like pattern with some variation
    // This pattern better matches the reference image
    for (let i = 0; i < config.neuronCount; i++) {
      // Use golden ratio for better distribution
      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      const i_normalized = i / config.neuronCount;
      
      // Create a spiral-like pattern with more spacing
      const angle = 2 * Math.PI * i_normalized * goldenRatio * 2; // Multiplied by 2 for wider spread
      const distance = 0.3 + 0.5 * i_normalized; // Variable distance from center
      
      // Calculate position with more spacing around the edges
      const x = 0.5 + distance * Math.cos(angle);
      const y = 0.5 + distance * Math.sin(angle);
      
      // Add random variation for organic feel
      const jitterX = (Math.random() - 0.5) * 0.1;
      const jitterY = (Math.random() - 0.5) * 0.1;
      
      neurons.push({
        id: i,
        x: (x + jitterX) * canvas.width,
        y: (y + jitterY) * canvas.height,
        size: config.neuronSize.min + Math.random() * (config.neuronSize.max - config.neuronSize.min),
        connections: [],
        branches: [], // No branches in this design
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
   * Create a new traveling node
   */
  function createNewTravelingNode() {
    if (neurons.length === 0) return;
    
    if (isLowPerformance && travelingNodes.filter(n => n.active).length >= Math.max(2, Math.floor(config.travelingNodeCount / 2))) {
      return;
    }
    
    const neuronsWithConnections = neurons.filter(n => 
      n.connections.length > 0 && 
      isWithinExtendedViewport(n.x, n.y, config.viewportMargin * 2)
    );
    
    if (neuronsWithConnections.length === 0) return;
    
    const sourceNeuron = neuronsWithConnections[Math.floor(Math.random() * neuronsWithConnections.length)];
    
    const viableConnections = sourceNeuron.connections.filter(conn => {
      const distance = calculateDistance(
        sourceNeuron.x, sourceNeuron.y, 
        conn.target.x, conn.target.y
      );
      
      return distance <= config.maxDistanceForAnimation && 
             isWithinExtendedViewport(conn.target.x, conn.target.y, config.viewportMargin * 2);
    });
    
    if (viableConnections.length === 0) return;
    
    const connection = viableConnections[Math.floor(Math.random() * viableConnections.length)];
    const targetNeuron = connection.target;
    
    const pathPoints: Point[] = [];
    const samples = 100;
    
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      pathPoints.push(getPositionAlongPath(connection, t));
    }
    
    const pathLength = calculatePathLength(pathPoints);
    
    travelingNodes.push({
      x: sourceNeuron.x,
      y: sourceNeuron.y,
      sourceNeuron,
      targetNeuron,
      connection,
      progress: 0,
      speed: config.travelingNodeSpeedFactor * (0.8 + Math.random() * 0.2),
      width: connection.width * 0.8,
      active: true,
      path: pathPoints,
      pathIndex: 0,
      pathLength: pathLength,
      isWithinViewport: true,
    });
  }
  
  // Create connections between neurons with the minimalist style from the reference
  function createConnections() {
    neurons.forEach(neuron => {
      // Find potential targets
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
      
      // Connect to nearest neurons for the minimalist design
      const connectionCount = config.minConnections + 
        Math.floor(Math.random() * (config.maxConnections - config.minConnections + 1));
      
      // Create smoother, more organic curves for connections like in reference
      for (let i = 0; i < Math.min(connectionCount, potentialTargets.length); i++) {
        const target = potentialTargets[i].neuron;
        const distance = potentialTargets[i].distance;
        
        // Create smoother curves with more control points
        const controlPointCount = 2 + Math.floor(Math.random());
        const controlPoints: Point[] = [];
        
        for (let j = 0; j < controlPointCount; j++) {
          const t = (j + 1) / (controlPointCount + 1);
          
          // Create smoother, more organic curves
          const baseX = neuron.x + (target.x - neuron.x) * t;
          const baseY = neuron.y + (target.y - neuron.y) * t;
          
          // Calculate perpendicular vector for curve control
          const perpX = -(target.y - neuron.y) / distance;
          const perpY = (target.x - neuron.x) / distance;
          
          // Create more organic, wider curves as in reference
          const variance = (Math.random() * 0.3 + 0.1) * distance;
          
          controlPoints.push({
            x: baseX + perpX * variance,
            y: baseY + perpY * variance
          });
        }
        
        // Thicker lines for the minimalist style
        const width = config.connectionWidth.min + 
          Math.random() * (config.connectionWidth.max - config.connectionWidth.min);
        
        const connection: Connection = {
          id: neuron.connections.length,
          source: neuron,
          target: target,
          width: width,
          controlPoints,
          flowSpeed: config.flowSpeed * (0.7 + Math.random() * 0.6),
          flowPhase: Math.random() * Math.PI * 2
        };
        
        neuron.connections.push(connection);
      }
    });
  }
  
  // Draw a neuron with the clean, minimalist style from the reference
  function drawNeuron(neuron: Neuron) {
    if (!isWithinExtendedViewport(neuron.x, neuron.y)) {
      return;
    }

    // Draw subtle glow if neuron is pulsing
    if (neuron.pulseStrength > 0) {
      const glowRadius = neuron.size * 2;
      const glow = ctx.createRadialGradient(
        neuron.x, neuron.y, neuron.size * 0.5,
        neuron.x, neuron.y, glowRadius
      );
      
      const baseAlpha = neuron.pulseStrength * config.glowIntensity;
      glow.addColorStop(0, `rgba(85, 110, 150, ${baseAlpha * 0.8})`);
      glow.addColorStop(1, 'rgba(85, 110, 150, 0)');

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(neuron.x, neuron.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw neuron with flat, solid color as in reference
    ctx.fillStyle = config.neuronColor.base;
    ctx.beginPath();
    ctx.arc(neuron.x, neuron.y, neuron.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw subtle inner core
    const coreSize = neuron.size * config.neuronCoreScale;
    
    ctx.fillStyle = config.neuronColor.core;
    ctx.beginPath();
    ctx.arc(neuron.x, neuron.y, coreSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Reduce pulse strength
    neuron.pulseStrength *= 0.95;
    if (neuron.pulseStrength < 0.05) neuron.pulseStrength = 0;
  }
  
  /**
   * Draw and update traveling nodes
   */
  function updateAndDrawTravelingNodes(timestamp: number) {
    const deltaTime = timestamp - lastFrameTime;
    const deltaFactor = deltaTime / 16.67;
    
    let activeNodesInViewport = 0;
    
    for (let i = 0; i < travelingNodes.length; i++) {
      const node = travelingNodes[i];
      if (!node.active) continue;
      
      // Update progress
      const speedAdjustment = node.pathLength ? 500 / node.pathLength : 1;
      node.progress += node.speed * deltaFactor * speedAdjustment;
      
      // Update position
      if (node.path && node.path.length > 0) {
        const exactIndex = Math.min(
          node.progress * (node.path.length - 1),
          node.path.length - 1
        );
        
        const index = Math.floor(exactIndex);
        const fraction = exactIndex - index;
        
        if (index < node.path.length - 1) {
          const currentPoint = node.path[index];
          const nextPoint = node.path[index + 1];
          
          node.x = currentPoint.x + (nextPoint.x - currentPoint.x) * fraction;
          node.y = currentPoint.y + (nextPoint.y - currentPoint.y) * fraction;
        } else {
          node.x = node.path[index].x;
          node.y = node.path[index].y;
        }
        
        node.isWithinViewport = isWithinExtendedViewport(node.x, node.y);
      } else {
        const position = getPositionAlongPath(node.connection, node.progress);
        node.x = position.x;
        node.y = position.y;
        
        node.isWithinViewport = isWithinExtendedViewport(node.x, node.y);
      }
      
      // Check if node has reached target
      if (node.progress >= 1) {
        if (isWithinExtendedViewport(node.targetNeuron.x, node.targetNeuron.y)) {
          node.targetNeuron.pulseStrength = 1;
        }
        
        node.active = false;
        
        const delay = isLowPerformance ? Math.random() * 2000 + 1000 : Math.random() * 1000;
        setTimeout(() => {
          createNewTravelingNode();
        }, delay);
        
        continue;
      }
      
      if (!node.isWithinViewport) {
        continue;
      }
      
      activeNodesInViewport++;
      
      // Draw traveling node - almost invisible in the minimalist design
      ctx.fillStyle = config.connectionColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.width, 0, Math.PI * 2);
      ctx.fill();
      
      // Subtle glow for traveling nodes
      if (!isLowPerformance) {
        const nodeGlow = ctx.createRadialGradient(
          node.x, node.y, node.width * 0.5,
          node.x, node.y, node.width * 2
        );
        
        nodeGlow.addColorStop(0, 'rgba(85, 110, 150, 0.2)');
        nodeGlow.addColorStop(1, 'rgba(85, 110, 150, 0)');
        
        ctx.fillStyle = nodeGlow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.width * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Add more nodes if needed and performance allows
    if (activeNodesInViewport < config.travelingNodeCount && !isLowPerformance) {
      const nodesToAdd = Math.min(
        config.travelingNodeCount - activeNodesInViewport,
        2
      );
      
      for (let i = 0; i < nodesToAdd; i++) {
        createNewTravelingNode();
      }
    }
  }
  
  /**
   * Draw a path with the clean, minimalist style from the reference
   */
  function drawMinimalistPath(path: Point[], width: number) {
    if (path.length < 2) return;
    
    // Anti-aliasing for smooth lines
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 1;
    
    // Draw main path with the subtle blue color
    ctx.lineWidth = width;
    ctx.strokeStyle = config.connectionColor;
    
    ctx.beginPath();
    
    // Draw the path
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
        if (i === 0) {
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
          const p0 = path[i-1];
          const p1 = path[i];
          const p2 = path[i+1];
          
          const cp1x = p1.x + (p2.x - p1.x) / 3;
          const cp1y = p1.y + (p2.y - p1.y) / 3;
          
          ctx.quadraticCurveTo(cp1x, cp1y, p2.x, p2.y);
        }
        else {
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
    
    if (typeof ctx.imageSmoothingQuality !== 'undefined') {
      // @ts-ignore
      ctx.imageSmoothingQuality = 'high';
    }
    ctx.stroke();
    
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
  }
  
  // Draw a connection with the minimalist style
  function drawConnection(connection: Connection, timestamp: number) {
    const { source, target } = connection;
    
    if (!isWithinExtendedViewport(source.x, source.y) && 
        !isWithinExtendedViewport(target.x, target.y)) {
      return;
    }
    
    const connectionDistance = calculateDistance(
      source.x, source.y, target.x, target.y
    );
    if (connectionDistance > config.maxDistanceForAnimation * 1.5) {
      return;
    }
    
    // Update flow phase
    connection.flowPhase += connection.flowSpeed;
    if (connection.flowPhase > Math.PI * 2) connection.flowPhase -= Math.PI * 2;
    
    const { width, controlPoints } = connection;
    
    // Prepare path points
    const pathPoints: Point[] = [{ x: source.x, y: source.y }];
    
    if (controlPoints.length === 0) {
      pathPoints.push({ x: target.x, y: target.y });
    } else {
      // Add control points with subtle animation
      controlPoints.forEach((point, i) => {
        const animationScale = isLowPerformance ? 0.2 : 0.5; // Reduced movement
        const offsetX = Math.sin(connection.flowPhase + i * 0.7) * width * animationScale;
        const offsetY = Math.cos(connection.flowPhase + i * 0.7) * width * animationScale;
        
        pathPoints.push({
          x: point.x + offsetX,
          y: point.y + offsetY
        });
      });
      
      pathPoints.push({ x: target.x, y: target.y });
    }
    
    // Draw using the minimalist path function
    const pulsingWidth = width * (0.8 + Math.sin(connection.flowPhase) * 0.2);
    drawMinimalistPath(pathPoints, pulsingWidth);
  }
  
  /**
   * Calculate position along a bezier curve
   */
  function getPositionAlongPath(connection: Connection, t: number): Point {
    t = Math.max(0, Math.min(1, t));
    
    const { source, target, controlPoints } = connection;
    
    if (controlPoints.length === 0) {
      return {
        x: source.x + (target.x - source.x) * t,
        y: source.y + (target.y - source.y) * t
      };
    } else if (controlPoints.length === 1) {
      const mt = 1 - t;
      return {
        x: mt * mt * source.x + 2 * mt * t * controlPoints[0].x + t * t * target.x,
        y: mt * mt * source.y + 2 * mt * t * controlPoints[0].y + t * t * target.y
      };
    } else if (controlPoints.length === 2) {
      const mt = 1 - t;
      return {
        x: mt * mt * mt * source.x + 3 * mt * mt * t * controlPoints[0].x + 
           3 * mt * t * t * controlPoints[1].x + t * t * t * target.x,
        y: mt * mt * mt * source.y + 3 * mt * mt * t * controlPoints[0].y + 
           3 * mt * t * t * controlPoints[1].y + t * t * t * target.y
      };
    } else {
      const points = [
        { x: source.x, y: source.y },
        ...controlPoints,
        { x: target.x, y: target.y }
      ];
      
      return deCasteljauPoint(points, t);
    }
  }
  
  /**
   * De Casteljau algorithm for precise bezier curve calculation
   */
  function deCasteljauPoint(points: Point[], t: number): Point {
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
    
    return deCasteljauPoint(newPoints, t);
  }
  
  // Main render function
  function render(timestamp: number) {
    updateFps(timestamp);
    
    // Clear the canvas with the deep blue background
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply a subtle overlay for trail effect
    ctx.fillStyle = theme === 'dark' 
      ? 'rgba(15, 21, 32, 0.2)' // Very subtle trail for dark mode
      : 'rgba(237, 242, 247, 0.3)'; // Very subtle trail for light mode
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections
    neurons.forEach(neuron => {
      neuron.connections.forEach(connection => {
        drawConnection(connection, timestamp);
      });
    });
    
    // Update and draw traveling nodes
    updateAndDrawTravelingNodes(timestamp);
    
    // Draw neurons on top
    neurons.forEach(drawNeuron);
    
    // Occasional random pulses
    if (timestamp - lastPulseTime > config.pulseInterval) {
      const visibleNeurons = neurons.filter(n => isWithinExtendedViewport(n.x, n.y));
      
      if (visibleNeurons.length > 0) {
        const randomNeuron = visibleNeurons[Math.floor(Math.random() * visibleNeurons.length)];
        randomNeuron.pulseStrength = 1;
      }
      lastPulseTime = timestamp;
    }
    
    lastFrameTime = timestamp;
    
    // Continue animation
    animationFrameId = requestAnimationFrame(render);
  }
  
  // Initialize and start animation
  function init() {
    if (typeof ctx.imageSmoothingEnabled !== 'undefined') {
      ctx.imageSmoothingEnabled = true;
    }
    if (typeof ctx.imageSmoothingQuality !== 'undefined') {
      // @ts-ignore
      ctx.imageSmoothingQuality = 'high';
    }
    
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    lastFpsUpdate = performance.now();
    frameCount = 0;
    
    initializeNeurons();
    createConnections();
    initializeTravelingNodes();
    lastFrameTime = performance.now();
    animationFrameId = requestAnimationFrame(render);
  }
  
  // Start the animation
  init();
  
  // Return cleanup function
  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}
