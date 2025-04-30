
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
      } text-gray-500 hover:text-gray-700 rounded-15 bg-slate-500 hover:bg-slate-400`}
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
