
import { NeuralNetworkConfig } from '../../types/neural';

/**
 * Creates a configuration object for the neural network based on the theme
 * with performance-optimized parameters
 */
export function createNetworkConfig(theme: 'light' | 'dark' = 'dark'): NeuralNetworkConfig {
  // Use different densities based on device capability
  const isMobileOrTablet = window.innerWidth < 1024;
  
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
    
    // Responsive neuron counts based on device capability
    neuronCount: isMobileOrTablet ? 40 : 60,
    minConnections: isMobileOrTablet ? 2 : 4,
    maxConnections: isMobileOrTablet ? 6 : 8,
    minBranches: isMobileOrTablet ? 3 : 5,
    maxBranches: isMobileOrTablet ? 6 : 10,
    branchLength: { 
      min: isMobileOrTablet ? 70 : 100, 
      max: isMobileOrTablet ? 200 : 300 
    },
    
    // Performance-optimized animation settings
    flowSpeed: 0.008,
    pulseInterval: isMobileOrTablet ? 2000 : 1500, // Less frequent pulses on mobile
    glowIntensity: theme === 'dark' ? 0.9 : 0.7,
    neuronSize: { 
      min: isMobileOrTablet ? 8 : 12, 
      max: isMobileOrTablet ? 14 : 20 
    },
    
    // Responsive traveling node settings
    travelingNodeCount: isMobileOrTablet ? 15 : 25,
    travelingNodeSpeed: { min: 0.3, max: 0.5 },
    travelingNodeGlowDuration: 800,
    
    // Performance optimization flags
    useRequestAnimationFrame: true,
    useOffscreenCanvas: 'OffscreenCanvas' in window,
    skipFrames: isMobileOrTablet ? 2 : 1, // Skip frames on lower-powered devices
  };
}
