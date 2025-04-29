
export interface Neuron {
  id: number;
  x: number;
  y: number;
  size: number;
  connections: Connection[];
  pulseStrength: number;
  // Organic features
  branches: Branch[];
}

export interface Branch {
  id: number;
  // Start position relative to neuron
  startX: number;
  startY: number;
  // Control points for curved path
  controlPoints: Point[];
  // Length and thickness
  length: number;
  width: number;
  // Animation phase
  flowPhase: number;
}

export interface Connection {
  id: number;
  source: Neuron;
  target: Neuron;
  width: number;
  // Multiple control points for organic curves
  controlPoints: Point[];
  // Animation properties
  flowSpeed: number;
  flowPhase: number;
}

export interface Point {
  x: number;
  y: number;
}
