
import React from 'react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter
} from './ui/drawer';
import { Button } from './ui/button';
import { X, List, ListOrdered, ListVideo, Plus } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose }) => {
  const menuItems = [
    { icon: List, label: 'My Chats' },
    { icon: ListOrdered, label: 'Recent Activity' },
    { icon: ListVideo, label: 'Saved Responses' },
    { icon: Plus, label: 'New Chat' }
  ];

  return (
    <Drawer open={isOpen} onOpenChange={onClose} shouldScaleBackground={false}>
      <DrawerContent className="fixed left-0 right-auto w-72 h-full rounded-r-15 rounded-l-none">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle>Menu</DrawerTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>
        <div className="px-4 py-2 space-y-4">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start text-left py-6"
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.label}
            </Button>
          ))}
          
          {/* Theme Toggle Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <ThemeToggle variant="full" />
          </div>
        </div>
        <DrawerFooter>
          <p className="text-sm text-muted-foreground">
            AI Chat v1.0
          </p>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default SidePanel;
