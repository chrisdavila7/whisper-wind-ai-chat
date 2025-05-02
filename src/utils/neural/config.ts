import { NeuralNetworkConfig } from '../../types/neural';

/**
 * Creates a configuration object for the neural network based on the theme
 * with performance-optimized parameters
 */
export function createNetworkConfig(theme: 'light' | 'dark' = 'dark'): NeuralNetworkConfig {
  // Use different densities based on device capability
  const isMobileOrTablet = window.innerWidth < 1024;
  
  // Calculate neuron opacity with 45% reduction from original values
  // Original dark: rgba(59, 130, 246, 0.7) → reduced to 0.385
  // Original light: rgba(59, 130, 246, 0.6) → reduced to 0.33
  const neuronBaseOpacity = theme === 'dark' ? 0.385 : 0.33; // 45% reduction
  
  // Calculate connection opacity with 45% reduction from original values
  // Original dark: rgba(59, 130, 246, 0.4) → reduced to 0.22
  // Original light: rgba(59, 130, 246, 0.3) → reduced to 0.165
  const connectionOpacity = theme === 'dark' ? 0.22 : 0.165; // 45% reduction
  
  return {
    backgroundColor: theme === 'dark' ? '#020817' : '#FFFFFF', // Background color based on theme
    neuronColor: {
      base: `rgba(59, 130, 246, ${neuronBaseOpacity})`, // Reduced opacity by 45%
      core: theme === 'dark'
        ? 'rgba(219, 234, 254, 0.495)' // Reduced from 0.9 to 0.495 (45% reduction)
        : 'rgba(29, 78, 216, 0.468)' // Reduced from 0.85 to 0.468 (45% reduction)
    },
    connectionColor: `rgba(59, 130, 246, ${connectionOpacity})`, // Reduced opacity by 45%
    
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
    glowIntensity: theme === 'dark' ? 0.495 : 0.385, // Reduced from 0.9/0.7 to 0.495/0.385 (45% reduction)
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
