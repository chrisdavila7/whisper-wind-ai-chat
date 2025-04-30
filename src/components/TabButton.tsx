
import React from 'react';
import { Menu } from 'lucide-react';
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
        "absolute top-4 left-4 z-30 flex items-center justify-center ml-[-15px] px-0 py-2 bg-ai-primary text-white transition-transform duration-300",
        isOpen ? "-translate-x-full" : "translate-x-0",
        className
      )}
      aria-label="Toggle side panel"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
};

export default TabButton;
