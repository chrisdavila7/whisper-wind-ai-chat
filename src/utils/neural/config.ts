
import { NeuralNetworkConfig } from '../../types/neural';

/**
 * Creates a configuration object for the neural network based on the theme
 */
export function createNetworkConfig(theme: 'light' | 'dark' = 'dark'): NeuralNetworkConfig {
  return {
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
    
    // Increased counts to ensure sufficient density with zoomed-out appearance
    neuronCount: 60, // Further increased for better distribution when zoomed out
    minConnections: 4,
    maxConnections: 8,
    minBranches: 5, 
    maxBranches: 10, // Increased for more visible branching
    branchLength: { min: 100, max: 300 }, // Increased length for better visibility when zoomed out
    
    // Animation settings - enhanced for randomized flow
    flowSpeed: 0.008, // Base flow speed, individual elements will have randomized speeds
    pulseInterval: 1500,
    glowIntensity: theme === 'dark' ? 0.9 : 0.7,
    neuronSize: { min: 12, max: 20 }, // Slightly increased for better visibility when zoomed out
    
    // Traveling node settings
    travelingNodeCount: 25, // Increased for more visible activity
    travelingNodeSpeed: { min: 0.3, max: 0.5 },
    travelingNodeGlowDuration: 800,
  };
}
