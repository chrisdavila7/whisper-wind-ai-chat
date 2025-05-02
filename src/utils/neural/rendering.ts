
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
 * Draw organic branches with gentle water-like flow instead of spinning
 */
export function drawBranches(
  ctx: CanvasRenderingContext2D,
  neuron: Neuron, 
  config: NeuralNetworkConfig
): void {
  neuron.branches.forEach(branch => {
    // Update flow phase - faster for more noticeable movement
    branch.flowPhase += 0.003; // Increased from 0.001 to make movement more noticeable
    if (branch.flowPhase > Math.PI * 2) branch.flowPhase -= Math.PI * 2;
    
    // Draw branch as a bezier curve with thicker width
    ctx.strokeStyle = config.connectionColor;
    
    // Width now varies more dramatically creating water-like undulation
    ctx.lineWidth = branch.width * (0.7 + Math.sin(branch.flowPhase) * 0.3); // Increased variation
    
    ctx.beginPath();
    ctx.moveTo(branch.startX, branch.startY);
    
    // Apply more pronounced gentle undulation to all branches
    const waveAmplitude = Math.sin(branch.flowPhase) * (branch.length * 0.1); // Doubled from 0.05
    
    // Calculate a fixed endpoint based on branch direction vector
    const endPointDistance = branch.length;
    const dx = branch.controlPoints.length > 0 ? 
      branch.controlPoints[branch.controlPoints.length - 1].x - branch.startX : 
      Math.cos(branch.flowPhase * 0.1) * endPointDistance;
    const dy = branch.controlPoints.length > 0 ? 
      branch.controlPoints[branch.controlPoints.length - 1].y - branch.startY : 
      Math.sin(branch.flowPhase * 0.1) * endPointDistance;
      
    const distance = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = distance > 0 ? dx / distance : 0;
    const normalizedDy = distance > 0 ? dy / distance : 0;
    
    const endX = branch.startX + normalizedDx * endPointDistance;
    const endY = branch.startY + normalizedDy * endPointDistance;
    
    if (branch.controlPoints.length === 0) {
      // For branches with no control points, add simple undulation
      const midX = (branch.startX + endX) / 2;
      const midY = (branch.startY + endY) / 2;
      
      // Calculate perpendicular vector for undulation
      const perpX = -normalizedDy;
      const perpY = normalizedDx;
      
      const offsetAmount = waveAmplitude * 3; // Increased from 2 to make undulation more noticeable
      
      ctx.quadraticCurveTo(
        midX + perpX * offsetAmount,
        midY + perpY * offsetAmount,
        endX,
        endY
      );
    }
    else if (branch.controlPoints.length === 1) {
      // More pronounced undulating control point for water-like effect
      const offsetX = Math.sin(branch.flowPhase) * (branch.length * 0.06); // Doubled from 0.03
      const offsetY = Math.cos(branch.flowPhase * 0.7) * (branch.length * 0.06); // Doubled from 0.03
      
      ctx.quadraticCurveTo(
        branch.controlPoints[0].x + offsetX, 
        branch.controlPoints[0].y + offsetY,
        endX,
        endY
      );
    } 
    else {
      // For branches with multiple control points
      // More dramatic undulating both control points for a more natural flow
      const offset1X = waveAmplitude * 2.0; // Increased from 1.2
      const offset1Y = waveAmplitude * 1.5; // Increased from 0.8
      const offset2X = waveAmplitude * 1.8; // Increased from 0.9
      const offset2Y = waveAmplitude * 2.0; // Increased from 1.1
      
      // Use first and last control point with undulation
      const firstPoint = branch.controlPoints[0];
      const lastPoint = branch.controlPoints[branch.controlPoints.length - 1];
      
      ctx.bezierCurveTo(
        firstPoint.x + offset1X,
        firstPoint.y + offset1Y,
        lastPoint.x + offset2X,
        lastPoint.y + offset2Y,
        endX,
        endY
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
  
  // Update flow phase - slower for water-like movement
  connection.flowPhase += connection.flowSpeed * 0.6; // Slowed down by 40%
  if (connection.flowPhase > Math.PI * 2) connection.flowPhase -= Math.PI * 2;
  
  // Draw connection path with wider lines
  ctx.strokeStyle = config.connectionColor;
  
  // More subtle width variation for gentler undulation
  ctx.lineWidth = width * 3.6 * (0.9 + Math.sin(connection.flowPhase) * 0.1);
  
  ctx.beginPath();
  ctx.moveTo(source.x, source.y);
  
  if (controlPoints.length === 0) {
    // Simple line with subtle undulation
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const perpX = -(target.y - source.y);
    const perpY = (target.x - source.x);
    const dist = Math.sqrt(perpX * perpX + perpY * perpY);
    const offsetAmount = Math.sin(connection.flowPhase) * (width * 2);
    
    // Add a subtle curve to straight lines
    if (dist > 0) {
      ctx.quadraticCurveTo(
        midX + (perpX / dist) * offsetAmount,
        midY + (perpY / dist) * offsetAmount,
        target.x,
        target.y
      );
    } else {
      ctx.lineTo(target.x, target.y);
    }
  } else if (controlPoints.length === 1) {
    // Quadratic curve with gentle undulation
    const offsetX = Math.sin(connection.flowPhase) * (width * 3);
    const offsetY = Math.cos(connection.flowPhase * 0.7) * (width * 3);
    
    ctx.quadraticCurveTo(
      controlPoints[0].x + offsetX, 
      controlPoints[0].y + offsetY, 
      target.x, 
      target.y
    );
  } else if (controlPoints.length === 2) {
    // Cubic curve with more complex undulation
    const offset1X = Math.sin(connection.flowPhase) * (width * 3);
    const offset1Y = Math.cos(connection.flowPhase * 0.8) * (width * 2.5);
    const offset2X = Math.sin(connection.flowPhase * 0.9) * (width * 2.5);
    const offset2Y = Math.cos(connection.flowPhase * 0.7) * (width * 3);
    
    ctx.bezierCurveTo(
      controlPoints[0].x + offset1X,
      controlPoints[0].y + offset1Y,
      controlPoints[1].x + offset2X,
      controlPoints[1].y + offset2Y,
      target.x,
      target.y
    );
  } else {
    // Complex path with multiple control points
    for (let i = 0; i < controlPoints.length; i++) {
      const point = controlPoints[i];
      
      // Gentler movement for water-like effect
      // Use different frequencies for each point to avoid uniform motion
      const offsetX = Math.sin(connection.flowPhase + i * 0.3) * width * 1.5;
      const offsetY = Math.cos(connection.flowPhase + i * 0.5) * width * 1.5;
      
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
