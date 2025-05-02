
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

export interface TravelingNode {
  x: number;
  y: number;
  targetNeuron: Neuron | null;
  progress: number;  // 0 to 1, representing progress to target
  speed: number;
  width: number;
  active: boolean;
}

export interface NeuralNetworkConfig {
  backgroundColor: string;
  neuronColor: {
    base: string;
    core: string;
  };
  connectionColor: string;
  neuronCount: number;
  minConnections: number;
  maxConnections: number;
  minBranches: number;
  maxBranches: number;
  branchLength: { min: number; max: number };
  flowSpeed: number;
  pulseInterval: number;
  glowIntensity: number;
  neuronSize: { min: number; max: number };
  travelingNodeCount: number;
  travelingNodeSpeed: { min: number; max: number };
  travelingNodeGlowDuration: number;
}
