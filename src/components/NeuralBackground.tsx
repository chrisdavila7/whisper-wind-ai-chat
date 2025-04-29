
'use client';

import { useEffect, useRef } from 'react';

const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Define neuron structure
    const neuronCenter = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 30
    };
    
    // Create dendrites (branches)
    const dendrites: Dendrite[] = [];
    const numDendrites = 20;
    
    for (let i = 0; i < numDendrites; i++) {
      const angle = (i / numDendrites) * Math.PI * 2;
      const length = 100 + Math.random() * 200;
      
      dendrites.push({
        startX: neuronCenter.x,
        startY: neuronCenter.y,
        angle,
        length,
        width: 2,
        segments: generateSegments(neuronCenter.x, neuronCenter.y, angle, length),
        pulses: []
      });
    }
    
    // Generate branching segments for each dendrite
    function generateSegments(startX: number, startY: number, angle: number, length: number, depth = 0): Segment[] {
      if (depth > 3) return [];
      
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;
      
      const segments: Segment[] = [
        { x1: startX, y1: startY, x2: endX, y2: endY }
      ];
      
      // Add branches if not too deep
      if (depth < 2 && Math.random() > 0.3) {
        const branchAngle1 = angle + (Math.random() * 0.5 - 0.25);
        const branchAngle2 = angle + (Math.random() * 0.5 - 0.25);
        const branchLength = length * 0.7;
        
        segments.push(...generateSegments(endX, endY, branchAngle1, branchLength, depth + 1));
        segments.push(...generateSegments(endX, endY, branchAngle2, branchLength, depth + 1));
      }
      
      return segments;
    }
    
    // Animation parameters
    let animationId: number;
    let time = 0;
    
    // Generate a pulse on a random dendrite
    const createRandomPulse = () => {
      const dendriteIndex = Math.floor(Math.random() * dendrites.length);
      dendrites[dendriteIndex].pulses.push({
        position: 0, // 0 to 1 (start to end)
        speed: 0.003 + Math.random() * 0.004,
        size: 4 + Math.random() * 3,
        alpha: 0.8 + Math.random() * 0.2
      });
    };
    
    // Create initial pulses
    for (let i = 0; i < 5; i++) {
      createRandomPulse();
    }
    
    // Set interval to create new pulses
    const pulseInterval = setInterval(createRandomPulse, 1000);
    
    // Main draw function
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      ctx.fillStyle = '#171717';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update time for idle animation
      time += 0.01;
      
      // Draw neuron cell body
      const glow = ctx.createRadialGradient(
        neuronCenter.x, neuronCenter.y, 5,
        neuronCenter.x, neuronCenter.y, neuronCenter.radius * 1.5
      );
      glow.addColorStop(0, 'rgba(14, 165, 233, 0.8)');
      glow.addColorStop(1, 'rgba(14, 165, 233, 0)');
      
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(neuronCenter.x, neuronCenter.y, neuronCenter.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.ellipse(
        neuronCenter.x, 
        neuronCenter.y, 
        neuronCenter.radius, 
        neuronCenter.radius * 0.6, 
        0, 0, Math.PI * 2
      );
      ctx.fill();
      
      // Draw dendrites and animate pulses
      dendrites.forEach((dendrite, i) => {
        // Apply subtle animation to dendrite position
        const offsetMagnitude = 2;
        const offsetX = Math.sin(time + i * 0.5) * offsetMagnitude;
        const offsetY = Math.cos(time + i * 0.7) * offsetMagnitude;
        
        dendrite.segments.forEach(segment => {
          // Draw dendrite with subtle movement
          ctx.strokeStyle = '#0EA5E9';
          ctx.lineWidth = dendrite.width;
          ctx.beginPath();
          ctx.moveTo(segment.x1 + offsetX, segment.y1 + offsetY);
          ctx.lineTo(segment.x2 + offsetX, segment.y2 + offsetY);
          ctx.stroke();
        });
        
        // Update and draw pulses
        dendrite.pulses = dendrite.pulses.filter(pulse => {
          // Move pulse along dendrite
          pulse.position += pulse.speed;
          
          if (pulse.position > 1) return false; // Remove if past end
          
          // Draw pulse on each segment
          dendrite.segments.forEach(segment => {
            const pulseX = segment.x1 + (segment.x2 - segment.x1) * pulse.position + offsetX;
            const pulseY = segment.y1 + (segment.y2 - segment.y1) * pulse.position + offsetY;
            
            const pulseGlow = ctx.createRadialGradient(
              pulseX, pulseY, 0,
              pulseX, pulseY, pulse.size * 2
            );
            pulseGlow.addColorStop(0, `rgba(14, 165, 233, ${pulse.alpha})`);
            pulseGlow.addColorStop(1, 'rgba(14, 165, 233, 0)');
            
            ctx.fillStyle = pulseGlow;
            ctx.beginPath();
            ctx.arc(pulseX, pulseY, pulse.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#e0f2fe';
            ctx.beginPath();
            ctx.arc(pulseX, pulseY, pulse.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
          });
          
          return true;
        });
      });
      
      animationId = requestAnimationFrame(draw);
    };
    
    // Start animation
    animationId = requestAnimationFrame(draw);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
      clearInterval(pulseInterval);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ pointerEvents: 'none' }}
    />
  );
};

// Type definitions
interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Dendrite {
  startX: number;
  startY: number;
  angle: number;
  length: number;
  width: number;
  segments: Segment[];
  pulses: Pulse[];
}

interface Pulse {
  position: number;
  speed: number;
  size: number;
  alpha: number;
}

export default NeuralBackground;
