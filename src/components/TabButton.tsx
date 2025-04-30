
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabButtonProps {
  onClick: () => void;
  isOpen: boolean;
  className?: string;
}

const TabButton: React.FC<TabButtonProps> = ({ onClick, isOpen, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute top-24 z-30 flex items-center justify-center px-3 py-2 bg-ai-primary text-white rounded-r-15 rounded-l-none transition-transform duration-300",
        isOpen ? "-translate-x-full" : "translate-x-0",
        className
      )}
      aria-label="Toggle side panel"
    >
      <ChevronRight className="h-5 w-5" />
      <span className="ml-1">Menu</span>
    </button>
  );
};

export default TabButton;
