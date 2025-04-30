import React from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
interface TabButtonProps {
  onClick: () => void;
  isOpen: boolean;
  className?: string;
}
const TabButton: React.FC<TabButtonProps> = ({
  onClick,
  isOpen,
  className
}) => {
  return <button onClick={onClick} className={cn("absolute top-4 left-4 z-30 flex items-center justify-center mt-[2px] ml-[-15px] px-3.5 py-1.5 rounded-l-none bg-ai-primary text-white transition-transform duration-300", isOpen ? "-translate-x-full" : "translate-x-0", className)} aria-label="Toggle side panel">
      <Menu className="h-5 w-5 mx-0 ml-[-4px]" />
    </button>;
};
export default TabButton;