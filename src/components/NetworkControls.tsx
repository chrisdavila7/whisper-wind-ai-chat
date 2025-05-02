
'use client';

import React, { useState, useEffect } from 'react';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { SlidersHorizontal, Settings, Plus, Minus } from 'lucide-react';

// Define the props interface
interface NetworkControlsProps {
  onParametersChange: (parameters: NetworkParameters) => void;
}

// Define the parameters interface
export interface NetworkParameters {
  neuronCount: number;
  connectionDensity: number; // Affects min/max connections
  branchDensity: number; // Affects min/max branches
  flowSpeed: number;
  travelingNodeCount: number;
}

const NetworkControls: React.FC<NetworkControlsProps> = ({ onParametersChange }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [parameters, setParameters] = useState<NetworkParameters>({
    neuronCount: 20,
    connectionDensity: 0.5, // 0-1 range
    branchDensity: 0.5, // 0-1 range
    flowSpeed: 0.0004,
    travelingNodeCount: 15
  });

  // Effect to trigger parent callback when parameters change
  useEffect(() => {
    onParametersChange(parameters);
  }, [parameters, onParametersChange]);

  const handleChange = (key: keyof NetworkParameters, value: number | number[]) => {
    const newValue = Array.isArray(value) ? value[0] : value;
    setParameters(prev => ({ ...prev, [key]: newValue }));
  };

  return (
    <div className={`fixed right-4 top-4 z-40 ${isOpen ? 'w-72' : 'w-auto'}`}>
      {/* Toggle button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="icon"
        className={`rounded-full h-12 w-12 ${theme === 'dark' ? 'bg-slate-800/60' : 'bg-white/60'} backdrop-blur-md border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} shadow-md`}
        title="Network Controls"
      >
        {isOpen ? <Settings className="h-5 w-5" /> : <SlidersHorizontal className="h-5 w-5" />}
      </Button>

      {/* Controls panel */}
      {isOpen && (
        <div className={`mt-3 p-4 rounded-lg shadow-lg ${theme === 'dark' ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-md border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
          <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Network Controls</h3>
          
          {/* Neuron Count */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="neuron-count" className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Neurons
              </Label>
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => handleChange('neuronCount', Math.max(5, parameters.neuronCount - 5))}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {parameters.neuronCount}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => handleChange('neuronCount', Math.min(50, parameters.neuronCount + 5))}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Slider 
              id="neuron-count"
              min={5} 
              max={50} 
              step={1} 
              value={[parameters.neuronCount]} 
              onValueChange={(value) => handleChange('neuronCount', value)}
            />
          </div>

          {/* Connection Density */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="connection-density" className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Connection Density
              </Label>
              <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {Math.round(parameters.connectionDensity * 100)}%
              </span>
            </div>
            <Slider 
              id="connection-density"
              min={0.1} 
              max={1} 
              step={0.05} 
              value={[parameters.connectionDensity]} 
              onValueChange={(value) => handleChange('connectionDensity', value)}
            />
          </div>

          {/* Branch Density */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="branch-density" className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Branch Density
              </Label>
              <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {Math.round(parameters.branchDensity * 100)}%
              </span>
            </div>
            <Slider 
              id="branch-density"
              min={0.1} 
              max={1} 
              step={0.05} 
              value={[parameters.branchDensity]} 
              onValueChange={(value) => handleChange('branchDensity', value)}
            />
          </div>

          {/* Flow Speed */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="flow-speed" className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Animation Speed
              </Label>
              <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {(parameters.flowSpeed * 10000).toFixed(1)}x
              </span>
            </div>
            <Slider 
              id="flow-speed"
              min={0.0001} 
              max={0.001} 
              step={0.0001} 
              value={[parameters.flowSpeed]} 
              onValueChange={(value) => handleChange('flowSpeed', value)}
            />
          </div>

          {/* Traveling Nodes */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="traveling-nodes" className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Traveling Nodes
              </Label>
              <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {parameters.travelingNodeCount}
              </span>
            </div>
            <Slider 
              id="traveling-nodes"
              min={0} 
              max={40} 
              step={1} 
              value={[parameters.travelingNodeCount]} 
              onValueChange={(value) => handleChange('travelingNodeCount', value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkControls;
