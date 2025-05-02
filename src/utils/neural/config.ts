
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
    
    // Reduced neuron count and increased spacing for a more zoomed-in appearance
    neuronCount: 15, // Reduced from 20 to make it appear larger
    minConnections: 2,
    maxConnections: 5, // Reduced slightly from 6
    minBranches: 2,
    maxBranches: 5,
    branchLength: { min: 40, max: 150 }, // Increased lengths for more visibility
    
    // Animation settings
    flowSpeed: 0.0004,
    pulseInterval: 3000,
    glowIntensity: theme === 'dark' ? 0.7 : 0.5,
    neuronSize: { min: 4, max: 10 }, // Increased sizes for more visibility
    
    // Traveling node settings - adjusted for zoomed appearance
    travelingNodeCount: 12, // Reduced from 15
    travelingNodeSpeed: { min: 0.105, max: 0.28 },
    travelingNodeGlowDuration: 800,
  };
}
