
export interface Neuron {
  id: number;
  x: number;
  y: number;
  size: number;
  connections: NeuronConnection[];
  pulseStrength: number;
}

export interface NeuronConnection {
  id: number;
  source: Neuron;
  target: Neuron;
  width: number;
  controlPoints: {
    x: number;
    y: number;
  };
}

export interface Signal {
  id: number;
  connection: NeuronConnection;
  position: number; // 0-1, position along the connection
  speed: number;
  size: number;
}
