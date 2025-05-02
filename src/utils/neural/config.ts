
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
    
    // Increased counts to ensure sufficient density when zoomed out
    neuronCount: 40, // Increased from 25 to ensure more visible connections when zoomed out
    minConnections: 4, // Increased from 3 to have more visible connections
    maxConnections: 8, // Increased from 6 to have more visible connections
    minBranches: 4, // Increased from 3 to have more visible branches
    maxBranches: 8, // Increased from 6 to have more visible branches
    branchLength: { min: 80, max: 250 }, // Increased from {min:50, max:180} for more visibility when zoomed out
    
    // Animation settings - enhanced for randomized flow
    flowSpeed: 0.008, // Base flow speed, individual elements will have randomized speeds
    pulseInterval: 1500, // Decreased from 1800 for more frequent pulsing when zoomed out
    glowIntensity: theme === 'dark' ? 0.9 : 0.7, // Increased from 0.8/0.6 for more visible glows when zoomed out
    neuronSize: { min: 10, max: 18 }, // Increased from {min:7, max:14} for more visibility when zoomed out
    
    // Traveling node settings
    travelingNodeCount: 20, // Increased from 15 to add more visible movement when zoomed out
    travelingNodeSpeed: { min: 0.3, max: 0.5 }, // Increased from {min:0.2, max:0.4} for more noticeable movement
    travelingNodeGlowDuration: 800,
  };
}
