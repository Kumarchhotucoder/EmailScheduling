import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light', label: 'Light mode', icon: Sun },
    { value: 'dark', label: 'Dark mode', icon: Moon },
    { value: 'system', label: 'System preference', icon: Laptop },
  ];

  return (
    <div
      role="group"
      aria-label="Theme preference switcher"
      className={`inline-flex items-center p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/80 border border-zinc-300/60 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400 ${className}`}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            id={`theme-btn-${opt.value}`}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-pressed={isActive}
            title={opt.label}
            className={`relative p-1.5 rounded-lg transition-all text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isActive
                ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 shadow-sm border border-zinc-200/80 dark:border-zinc-700/80'
                : 'hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/40'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="sr-only">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
