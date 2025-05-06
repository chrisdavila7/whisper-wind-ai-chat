
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
      } ${
        theme === 'dark' 
          ? 'dark:text-gray-300 dark:hover:text-gray-100 dark:bg-ai-primary/20 dark:hover:bg-ai-primary/30'
          : 'text-gray-700 hover:text-gray-900 bg-ai-primary/10 hover:bg-ai-primary/20'
      } rounded-15 backdrop-blur-sm shadow-sm font-merriweather`}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <>
          <Sun className={variant === 'full' ? 'mr-2 h-5 w-5' : 'h-5 w-5'} />
          {variant === 'full' && <span className="merriweather-regular">Light Mode</span>}
          <span className="sr-only">Switch to light mode</span>
        </>
      ) : (
        <>
          <Moon className={variant === 'full' ? 'mr-2 h-5 w-5' : 'h-5 w-5'} />
          {variant === 'full' && <span className="merriweather-regular">Dark Mode</span>}
          <span className="sr-only">Switch to dark mode</span>
        </>
      )}
    </Button>
  );
};

export default ThemeToggle;
