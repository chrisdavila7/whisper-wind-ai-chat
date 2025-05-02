
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
    
    // Organic parameters with increased spacing (35% more)
    neuronCount: 20, // Reduced count for less visual clutter
    minConnections: 2, // Reduced for less clutter
    maxConnections: 6, // Reduced for less clutter
    minBranches: 2,
    maxBranches: 5,
    branchLength: { min: 30, max: 120 },
    
    // Animation settings
    flowSpeed: 0.0004, // Slowed down by 60%
    pulseInterval: 3000, // Increased interval for slower pace
    glowIntensity: theme === 'dark' ? 0.7 : 0.5, // Reduced glow intensity for light theme
    neuronSize: { min: 3, max: 8 },
    
    // Traveling node settings - slower by 65%
    travelingNodeCount: 15,
    travelingNodeSpeed: { min: 0.105, max: 0.28 }, // Reduced by 65% from {min: 0.3, max: 0.8}
    travelingNodeGlowDuration: 800, // How long the glow effect lasts in ms
  };
}
