import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'email_scheduler_theme';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // ignore localStorage errors
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState('dark');

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (currentTheme) => {
      let isDark = false;
      if (currentTheme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = currentTheme === 'dark';
      }

      if (isDark) {
        root.classList.add('dark');
        setResolvedTheme('dark');
      } else {
        root.classList.remove('dark');
        setResolvedTheme('light');
      }
    };

    applyTheme(theme);

    // If in system mode, listen to OS theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  const setTheme = (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark' && newTheme !== 'system') return;
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
