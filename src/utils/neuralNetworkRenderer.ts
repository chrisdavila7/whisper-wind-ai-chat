import { Neuron, Connection, Branch, Point } from '../types/neural';

/**
 * Draws a minimalist neural network on a canvas with a clean, modern style
 */
export function drawMinimalistNeuralNetwork(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, theme: 'light' | 'dark' = 'dark') {
  // Configuration
  const config = {
    // Base colors
    backgroundColor: theme === 'dark' ? '#0F1520' : '#EDF2F7',
    // Connection color - subtle blue with low opacity
    connectionColor: theme === 'dark' 
      ? 'rgba(65, 90, 120, 0.2)' // Lower opacity for dark mode
      : 'rgba(65, 90, 120, 0.15)', // Lower opacity for light mode
    
    // Neuron colors - with flatter look
    neuronColor: {
      base: theme === 'dark' 
        ? 'rgba(75, 100, 140, 0.5)' // Flatter blue (dark mode)
        : 'rgba(75, 100, 140, 0.4)', // Flatter blue (light mode),
      core: theme === 'dark'
        ? 'rgba(85, 110, 150, 0.6)' // Slightly darker center (dark mode)
        : 'rgba(85, 110, 150, 0.5)', // Slightly darker center (light mode),
    },
    
    // Arrival effect colors
    arrivalGlowColor: theme === 'dark'
      ? 'rgba(120, 160, 220, 0.7)' // Brighter blue for dark mode arrival
      : 'rgba(100, 140, 200, 0.6)', // Brighter blue for light mode arrival
    
    // Network structure parameters
    neuronCount: 8, // Keep previous value
    minConnections: 2,
    maxConnections: 5,
    
    // No branches for minimalist style
    useBranches: false,
    
    // Animation settings
    flowSpeed: 0.0001, // Very slow flow
    pulseInterval: 4000, // Longer intervals between pulses
    glowIntensity: 0.2, // Increased glow intensity (doubled)
    
    // Neuron size
    neuronSize: { min: 10, max: 18 }, // Keep previous value
    neuronCoreScale: 1.5, // Less contrast
    
    // Traveling nodes
    travelingNodeCount: 50,
    travelingNodeSpeedFactor: 0.005,
    arrivalEffectDuration: 500, // milliseconds for arrival effect
    arrivalPulseIntensity: 7.5, // Reduced glow intensity (halved for less blur)
    arrivalSizeFactor: 1.5, // How much bigger node gets on arrival pulse
    
    // Line thickness
    connectionWidth: { min: 1, max: 2 }, // Keep previous value
    
    // Performance optimization
    maxDistanceForAnimation: 1500,
    performanceThreshold: 40,
    viewportMargin: 100,
    fpsUpdateInterval: 1000,
    connectionCurvinessFactor: 0.3, // How much connections curve (0 = straight, 1 = more curve)
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
    
    // Arrival state
    isArriving?: boolean;
    arrivalStartTime?: number;
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
  
  // Initialize neurons with spacing
  function initializeNeurons() {
    neurons = [];
    
    // Create neurons in a grid-like pattern with some variation
    for (let i = 0; i < config.neuronCount; i++) {
      // Use golden ratio for better distribution
      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      const i_normalized = i / config.neuronCount;
      
      // Create a spiral-like pattern with more spacing
      const angle = 2 * Math.PI * i_normalized * goldenRatio * 2;
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
    
    // Limit traveling nodes if performance is low
    if (isLowPerformance && travelingNodes.filter(n => n.active).length >= Math.max(2, Math.floor(config.travelingNodeCount / 2))) {
      return;
    }
    
    // Find neurons with connections that are visible
    const neuronsWithConnections = neurons.filter(n => 
      n.connections.length > 0 && 
      isWithinExtendedViewport(n.x, n.y, config.viewportMargin * 2)
    );
    
    if (neuronsWithConnections.length === 0) return;
    
    // Pick a random source neuron
    const sourceNeuron = neuronsWithConnections[Math.floor(Math.random() * neuronsWithConnections.length)];
    
    // Find viable connections within animation distance
    const viableConnections = sourceNeuron.connections.filter(conn => {
      const distance = calculateDistance(
        sourceNeuron.x, sourceNeuron.y, 
        conn.target.x, conn.target.y
      );
      
      return distance <= config.maxDistanceForAnimation && 
             isWithinExtendedViewport(conn.target.x, conn.target.y, config.viewportMargin * 2);
    });
    
    if (viableConnections.length === 0) return;
    
    // Pick a random connection
    const connection = viableConnections[Math.floor(Math.random() * viableConnections.length)];
    const targetNeuron = connection.target;
    
    // Sample points along the path for smooth movement
    const pathPoints: Point[] = calculatePathPoints(connection);
    
    // Only proceed if we have valid path points
    if (pathPoints.length < 2) return;
    
    const pathLength = calculatePathLength(pathPoints);
    
    // Create the traveling node
    const newNode = {
      x: sourceNeuron.x,
      y: sourceNeuron.y,
      sourceNeuron,
      targetNeuron,
      connection,
      progress: 0,
      speed: config.travelingNodeSpeedFactor * (0.8 + Math.random() * 0.2), // Keep speed random
      width: connection.width, // Make nodes exactly the width of the path
      active: true,
      path: pathPoints,
      pathIndex: 0,
      pathLength: pathLength,
      isWithinViewport: true,
    };
    
    travelingNodes.push(newNode);
  }
  
  /**
   * Calculate points along the connection path for traveling nodes.
   */
  function calculatePathPoints(connection: Connection): Point[] {
    const points: Point[] = [];
    const p0 = connection.source;
    const p2 = connection.target;
    const steps = 20; // Number of segments to approximate the curve

    // Use the single control point for quadratic curve calculation
    if (connection.controlPoints && connection.controlPoints.length > 0) {
      const p1 = connection.controlPoints[0];

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const tInv = 1 - t;
        const tInvSq = tInv * tInv;
        const tSq = t * t;

        // Quadratic Bezier formula: B(t) = (1-t)^2*P0 + 2*(1-t)*t*P1 + t^2*P2
        const x = tInvSq * p0.x + 2 * tInv * t * p1.x + tSq * p2.x;
        const y = tInvSq * p0.y + 2 * tInv * t * p1.y + tSq * p2.y;
        points.push({ x, y });
      }
    } else {
      // Fallback for straight line (if no control point somehow)
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = p0.x + (p2.x - p0.x) * t;
        const y = p0.y + (p2.y - p0.y) * t;
        points.push({ x, y });
      }
    }

    return points;
  }
  
  /**
   * Draw and update traveling nodes - with null checks to fix errors
   */
  function updateAndDrawTravelingNodes(timestamp: number) {
    const deltaTime = timestamp - lastFrameTime;
    const deltaFactor = deltaTime / 16.67;
    
    let activeNodesInViewport = 0;
    
    // Filter out any nodes with invalid paths before processing
    travelingNodes = travelingNodes.filter(node => 
      node.active && node.path && node.path.length > 1
    );
    
    for (let i = travelingNodes.length - 1; i >= 0; i--) { // Iterate backwards for safe removal
      const node = travelingNodes[i];
      if (!node.active || !node.path || node.path.length < 2) continue;
      
      // Update progress
      const speedAdjustment = node.pathLength ? 500 / node.pathLength : 1;
      node.progress += node.speed * deltaFactor * speedAdjustment;
      
      // Update position using path points
      if (node.path && node.path.length > 0) {
        const exactIndex = Math.min(
          node.progress * (node.path.length - 1),
          node.path.length - 1
        );
        
        const index = Math.floor(exactIndex);
        const fraction = exactIndex - index;
        
        // Ensure we're not accessing invalid indices
        if (index < node.path.length - 1 && index >= 0) {
          const currentPoint = node.path[index];
          const nextPoint = node.path[index + 1];
          
          if (currentPoint && nextPoint) {
            let currentX = currentPoint.x + (nextPoint.x - currentPoint.x) * fraction;
            let currentY = currentPoint.y + (nextPoint.y - currentPoint.y) * fraction;
            
            node.x = currentX;
            node.y = currentY;
          }
        } else if (index >= 0 && index < node.path.length) {
          const point = node.path[index];
          if (point) {
            node.x = point.x;
            node.y = point.y;
          }
        }
        
        node.isWithinViewport = isWithinExtendedViewport(node.x, node.y);
      } else {
        // Use fallback method if path is invalid
        const position = getPositionAlongPath(node.connection, node.progress);
        if (position) {
          node.x = position.x;
          node.y = position.y;
          node.isWithinViewport = isWithinExtendedViewport(node.x, node.y);
        }
      }
      
      // --- Arrival Logic --- 
      if (node.progress >= 1 && !node.isArriving) {
        node.isArriving = true;
        node.targetNeuron.pulseStrength = 1; // Trigger pulse on target neuron
        node.arrivalStartTime = timestamp;
        // Snap position exactly to target neuron
        node.x = node.targetNeuron.x;
        node.y = node.targetNeuron.y;
        // Keep node active during arrival animation
      } else if (node.isArriving && node.arrivalStartTime) {
        const elapsed = timestamp - node.arrivalStartTime;
        if (elapsed > config.arrivalEffectDuration) {
          // Effect finished, deactivate and replace
          node.active = false;
          createNewTravelingNode();
          continue; // Skip drawing this frame
        }
      }
      
      // --- Drawing Logic --- 
      // Check if node is within the *extended* viewport for drawing
      const drawNode = isWithinExtendedViewport(node.x, node.y);
      
      if (drawNode) { // Only draw if within extended bounds
        activeNodesInViewport++;
        
        // Draw arrival effect or normal traveling node
        if (node.isArriving && node.arrivalStartTime) {
          const elapsed = timestamp - node.arrivalStartTime;
          const pulse = Math.sin((elapsed / config.arrivalEffectDuration) * Math.PI); // 0 -> 1 -> 0
          
          ctx.shadowBlur = pulse * config.arrivalPulseIntensity;
          ctx.shadowColor = config.arrivalGlowColor;
          ctx.fillStyle = config.arrivalGlowColor; // Use glow color for the node itself too
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.width * (1 + pulse * (config.arrivalSizeFactor - 1)), 0, Math.PI * 2);
          ctx.fill();
          
          // Reset shadow
          ctx.shadowBlur = 0;
          ctx.shadowColor = 'transparent';
          
        } else {
          // Draw normal traveling node
          // Make node half as bright as the target neuron's base color
          const targetNeuronColor = config.neuronColor.base;
          const nodeColor = adjustRgbaAlpha(targetNeuronColor, 0.5); // Adjust alpha by 50%
          ctx.fillStyle = nodeColor;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.width, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Deactivate and replace node if it moved far out of view (unless arriving)
      if (!node.isWithinViewport && !node.isArriving && node.progress < 1) { 
        const distance = calculateDistance(node.x, node.y, canvas.width / 2, canvas.height / 2);
        if (distance > Math.max(canvas.width, canvas.height)) { // Check if very far
          node.active = false;
          createNewTravelingNode();
        }
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
   * Draw a path with the clean, minimalist style
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
   * Calculate position along a bezier curve with safety checks
   */
  function getPositionAlongPath(connection: Connection, t: number): Point | null {
    t = Math.max(0, Math.min(1, t));
    
    const { source, target, controlPoints } = connection;
    
    if (!source || !target) return null;
    
    if (controlPoints.length === 0) {
      return {
        x: source.x + (target.x - source.x) * t,
        y: source.y + (target.y - source.y) * t
      };
    } else if (controlPoints.length === 1) {
      const cp = controlPoints[0];
      if (!cp) return null;
      
      const mt = 1 - t;
      return {
        x: mt * mt * source.x + 2 * mt * t * cp.x + t * t * target.x,
        y: mt * mt * source.y + 2 * mt * t * cp.y + t * t * target.y
      };
    } else if (controlPoints.length === 2) {
      const cp1 = controlPoints[0];
      const cp2 = controlPoints[1];
      if (!cp1 || !cp2) return null;
      
      const mt = 1 - t;
      return {
        x: mt * mt * mt * source.x + 3 * mt * mt * t * cp1.x + 
           3 * mt * t * t * cp2.x + t * t * t * target.x,
        y: mt * mt * mt * source.y + 3 * mt * mt * t * cp1.y + 
           3 * mt * t * t * cp2.y + t * t * t * target.y
      };
    } else {
      return null;
    }
  }
  
  /**
   * Adjusts the alpha channel of an RGBA color string.
   * @param rgbaColor The input color string (e.g., 'rgba(r, g, b, a)').
   * @param factor The factor to multiply the alpha by (e.g., 0.5 for 50% alpha).
   * @returns New RGBA color string with adjusted alpha.
   */
  function adjustRgbaAlpha(rgbaColor: string, factor: number): string {
    const match = rgbaColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/i);
    if (match) {
      const r = match[1];
      const g = match[2];
      const b = match[3];
      const a = match[4] !== undefined ? parseFloat(match[4]) : 1; // Default alpha to 1 if missing
      const newAlpha = Math.max(0, Math.min(1, a * factor)); // Clamp alpha between 0 and 1
      return `rgba(${r}, ${g}, ${b}, ${newAlpha.toFixed(3)})`;
    }
    return rgbaColor; // Return original if parsing fails
  }
  
  // Create connections between neurons
  function createConnections() {
    for (let i = 0; i < neurons.length; i++) {
      const neuron = neurons[i];
      
      // Randomly connect to other neurons
      for (let j = 0; j < neurons.length; j++) {
        if (i === j) continue;
        
        const otherNeuron = neurons[j];
        
        // Only connect if within a certain distance
        const dx = otherNeuron.x - neuron.x;
        const dy = otherNeuron.y - neuron.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > config.maxDistanceForAnimation) continue;
        
        // Randomly decide whether to connect
        if (Math.random() < 0.5) continue;
        
        // --- Generate single control point for quadratic curve ---
        const midpointX = neuron.x + dx * 0.5;
        const midpointY = neuron.y + dy * 0.5;
        
        // Perpendicular vector (normalized)
        const perpX = -dy / distance;
        const perpY = dx / distance;
        
        // Random offset distance
        const offset = distance * config.connectionCurvinessFactor * (Math.random() - 0.5) * 2;
        
        const controlPoint: Point = {
          x: midpointX + perpX * offset,
          y: midpointY + perpY * offset,
        };
        
        // Create a connection with a random width
        const width = config.connectionWidth.min + Math.random() * (config.connectionWidth.max - config.connectionWidth.min);
        
        neuron.connections.push({
          id: neuron.connections.length, // Add missing ID
          source: neuron,
          target: otherNeuron,
          width,
          controlPoints: [controlPoint], // Store single control point
          flowPhase: 0,
          flowSpeed: config.flowSpeed
        });
      }
    }
  }
  
  // Draw a neuron with a clean, minimalist style
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
    
    // Draw neuron with flat, solid color
    ctx.fillStyle = config.neuronColor.base;
    ctx.beginPath();
    ctx.arc(neuron.x, neuron.y, neuron.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw subtle inner core
    const coreSize = neuron.size / config.neuronCoreScale;
    
    ctx.fillStyle = config.neuronColor.core;
    ctx.beginPath();
    ctx.arc(neuron.x, neuron.y, coreSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Reduce pulse strength
    neuron.pulseStrength *= 0.95;
    if (neuron.pulseStrength < 0.05) neuron.pulseStrength = 0;
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
        ctx.beginPath();
        ctx.moveTo(connection.source.x, connection.source.y);
        
        if (connection.controlPoints && connection.controlPoints.length > 0) {
          // Draw quadratic curve using the single control point
          ctx.quadraticCurveTo(
            connection.controlPoints[0].x,
            connection.controlPoints[0].y,
            connection.target.x,
            connection.target.y
          );
        } else {
          // Fallback to straight line if no control point
          ctx.lineTo(connection.target.x, connection.target.y);
        }
        
        // Style the connection line
        ctx.strokeStyle = config.connectionColor; // Use the base color
        ctx.lineWidth = connection.width;
        ctx.stroke();
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
