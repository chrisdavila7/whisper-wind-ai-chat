
import React from 'react';
import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'full';
  className?: string;
}

const ThemeToggle = ({ variant = 'icon', className = '' }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      onClick={toggleTheme}
      variant="ghost"
      size={variant === 'icon' ? 'icon' : 'default'}
      className={`${className} ${
        variant === 'icon' ? 'flex-shrink-0' : 'justify-start w-full py-6'
      } dark:text-gray-300 text-gray-700 dark:hover:text-gray-100 hover:text-gray-900 rounded-15 bg-white/20 dark:bg-slate-700/30 hover:bg-gray-200/50 dark:hover:bg-slate-600/50 backdrop-blur-sm`}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <>
          <Sun className={variant === 'full' ? 'mr-2 h-5 w-5' : 'h-5 w-5'} />
          {variant === 'full' && <span>Light Mode</span>}
          <span className="sr-only">Switch to light mode</span>
        </>
      ) : (
        <>
          <Moon className={variant === 'full' ? 'mr-2 h-5 w-5' : 'h-5 w-5'} />
          {variant === 'full' && <span>Dark Mode</span>}
          <span className="sr-only">Switch to dark mode</span>
        </>
      )}
    </Button>
  );
};

export default ThemeToggle;
