'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/hooks/use-theme';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ThemeToggle({ className, variant = 'ghost', size = 'icon' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4 rotate-0 scale-100 transition-all" />;
      case 'dark':
        return <Moon className="h-4 w-4 rotate-0 scale-100 transition-all" />;
      case 'system':
        return <Monitor className="h-4 w-4 rotate-0 scale-100 transition-all" />;
      default:
        return <Sun className="h-4 w-4 rotate-0 scale-100 transition-all" />;
    }
  };

  const getTooltip = () => {
    switch (theme) {
      case 'light':
        return 'Switch to dark mode';
      case 'dark':
        return 'Switch to system mode';
      case 'system':
        return 'Switch to light mode';
      default:
        return 'Toggle theme';
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:scale-105',
        'bg-gradient-to-r from-orange-400 to-pink-400 dark:from-blue-500 dark:to-purple-600',
        'hover:from-orange-500 hover:to-pink-500 dark:hover:from-blue-600 dark:hover:to-purple-700',
        'shadow-lg hover:shadow-xl',
        'border-0 text-white',
        className
      )}
      title={getTooltip()}
      aria-label={getTooltip()}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex items-center justify-center">{getIcon()}</div>
    </Button>
  );
}

// Alternative minimalist version
export function ThemeToggleMinimal({
  className,
  variant = 'ghost',
  size = 'icon',
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4 transition-transform duration-300 hover:rotate-12" />;
      case 'dark':
        return <Moon className="h-4 w-4 transition-transform duration-300 hover:rotate-12" />;
      case 'system':
        return <Monitor className="h-4 w-4 transition-transform duration-300 hover:scale-110" />;
      default:
        return <Sun className="h-4 w-4 transition-transform duration-300 hover:rotate-12" />;
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        'transition-all duration-300 hover:scale-105',
        'border border-border/50 hover:border-border',
        'hover:bg-accent/50',
        className
      )}
      title={`Current: ${theme} mode`}
      aria-label={`Switch theme (current: ${theme})`}
    >
      {getIcon()}
    </Button>
  );
}

// Fancy animated version
export function ThemeToggleFancy({
  className,
  variant = 'ghost',
  size = 'icon',
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        'relative group overflow-hidden transition-all duration-500',
        'bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500',
        'dark:from-slate-800 dark:via-slate-700 dark:to-slate-600',
        'hover:from-amber-500 hover:via-orange-600 hover:to-pink-600',
        'dark:hover:from-slate-700 dark:hover:via-slate-600 dark:hover:to-slate-500',
        'shadow-lg hover:shadow-2xl hover:shadow-orange-500/25 dark:hover:shadow-slate-500/25',
        'border-0 text-white dark:text-slate-200',
        'transform hover:scale-110 hover:rotate-3',
        'animate-pulse hover:animate-none',
        className
      )}
      title={`${theme} mode`}
      aria-label={`Switch theme (current: ${theme})`}
    >
      {/* Background animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

      {/* Icon container */}
      <div className="relative z-10 transition-transform duration-300 group-hover:rotate-180">
        {theme === 'light' && <Sun className="h-4 w-4" />}
        {theme === 'dark' && <Moon className="h-4 w-4" />}
        {theme === 'system' && <Monitor className="h-4 w-4" />}
      </div>

      {/* Sparkle effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full animate-ping" />
        <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full animate-ping animation-delay-300" />
        <div className="absolute bottom-1 left-2 w-1 h-1 bg-white rounded-full animate-ping animation-delay-600" />
      </div>
    </Button>
  );
}
