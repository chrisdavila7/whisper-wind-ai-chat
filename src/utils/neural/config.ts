
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
    
    // Ensuring at least 3-4 neurons are always visible by increasing count and adjusting distribution
    neuronCount: 25, // Increased from 20 to ensure more visible connections
    minConnections: 3, // Increased from 2 to have more visible connections
    maxConnections: 6, // Increased from 5 to have more visible connections
    minBranches: 3, // Increased from 2 to have more visible branches
    maxBranches: 6, // Increased from 5 to have more visible branches
    branchLength: { min: 50, max: 180 }, // Increased from {min:40, max:150} for more visible branches
    
    // Animation settings - increased for more noticeable movement
    flowSpeed: 0.003, // Increased from 0.001 to make flow more noticeable
    pulseInterval: 1800, // Decreased from 2000 for more frequent pulsing
    glowIntensity: theme === 'dark' ? 0.8 : 0.6, // Increased from 0.7/0.5 for more visible glows
    neuronSize: { min: 7, max: 14 }, // Increased from {min:6, max:12} for more visible neurons
    
    // Traveling node settings
    travelingNodeCount: 15, // Increased from 12 to add more visible movement
    travelingNodeSpeed: { min: 0.2, max: 0.4 }, // Increased from {min:0.15, max:0.35} for more noticeable movement
    travelingNodeGlowDuration: 800,
  };
}
