
import { Neuron, Connection, Branch, Point, TravelingNode } from '../../types/neural';
import { NeuralNetworkConfig } from '../../types/neural';
import { createNewTravelingNode } from './initialization';

/**
 * Draw a neuron with glow effect
 */
export function drawNeuron(
  ctx: CanvasRenderingContext2D,
  neuron: Neuron, 
  config: NeuralNetworkConfig
): void {
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

/**
 * Draw and update traveling nodes
 */
export function updateAndDrawTravelingNodes(
  ctx: CanvasRenderingContext2D,
  travelingNodes: TravelingNode[],
  neurons: Neuron[],
  canvas: HTMLCanvasElement,
  config: NeuralNetworkConfig
): void {
  for (let i = 0; i < travelingNodes.length; i++) {
    const node = travelingNodes[i];
    if (!node.active || !node.targetNeuron) continue;
    
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
        travelingNodes[i] = createNewTravelingNode(neurons, canvas, config);
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

/**
 * Draw organic branches
 */
export function drawBranches(
  ctx: CanvasRenderingContext2D,
  neuron: Neuron, 
  config: NeuralNetworkConfig
): void {
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

/**
 * Draw a connection with organic, flowing path
 */
export function drawConnection(
  ctx: CanvasRenderingContext2D,
  connection: Connection, 
  config: NeuralNetworkConfig
): void {
  const { source, target, width, controlPoints } = connection;
  
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

/**
 * Calculate position along a bezier curve with multiple control points
 */
export function getPositionAlongPath(connection: Connection, t: number): Point {
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
