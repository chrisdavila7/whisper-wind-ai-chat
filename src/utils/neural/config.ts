
import { NeuralNetworkConfig } from '../../types/neural';

/**
 * Creates a configuration object for the neural network based on the theme
 * with performance-optimized parameters
 */
export function createNetworkConfig(theme: 'light' | 'dark' = 'dark'): NeuralNetworkConfig {
  // Use different densities based on device capability
  const isMobileOrTablet = window.innerWidth < 1024;
  const isLowPowerDevice = window.navigator.hardwareConcurrency ? window.navigator.hardwareConcurrency <= 4 : true;
  
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
    
    // Significantly reduced neuron counts for better performance
    neuronCount: isLowPowerDevice ? 15 : (isMobileOrTablet ? 25 : 30),
    minConnections: isLowPowerDevice ? 1 : (isMobileOrTablet ? 1 : 2),
    maxConnections: isLowPowerDevice ? 3 : (isMobileOrTablet ? 4 : 5),
    
    // Ensuring each neuron has at least 3 branches, but not too many on low power devices
    minBranches: 3, // Changed from dynamic to fixed minimum of 3 branches
    maxBranches: isLowPowerDevice ? 4 : (isMobileOrTablet ? 5 : 6), // Slightly increased max
    
    branchLength: { 
      min: isLowPowerDevice ? 50 : (isMobileOrTablet ? 70 : 100), 
      max: isLowPowerDevice ? 100 : (isMobileOrTablet ? 150 : 200) 
    },
    
    // Performance-optimized animation settings
    flowSpeed: 0.005, // Reduced from 0.008
    pulseInterval: isLowPowerDevice ? 3000 : (isMobileOrTablet ? 2500 : 2000), // Less frequent pulses
    glowIntensity: theme === 'dark' ? 0.495 : 0.385, // Reduced from 0.9/0.7 to 0.495/0.385 (45% reduction)
    neuronSize: { 
      min: isLowPowerDevice ? 6 : (isMobileOrTablet ? 8 : 10), 
      max: isLowPowerDevice ? 10 : (isMobileOrTablet ? 12 : 16) 
    },
    
    // Responsive traveling node settings - reduced count
    travelingNodeCount: isLowPowerDevice ? 5 : (isMobileOrTablet ? 8 : 12), // Significantly reduced
    travelingNodeSpeed: { min: 0.2, max: 0.4 }, // Slightly slower
    travelingNodeGlowDuration: 800,
    
    // Performance optimization flags
    useRequestAnimationFrame: true,
    useOffscreenCanvas: 'OffscreenCanvas' in window,
    skipFrames: isLowPowerDevice ? 3 : (isMobileOrTablet ? 2 : 1), // Skip more frames on lower-powered devices
  };
}
