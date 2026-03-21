import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'ceylonroam_theme';

const ThemeContext = createContext(null);

const getInitialTheme = () => {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light') return 'light';
    if (saved === 'dark') return 'dark';
  } catch {
    // ignore storage issues
  }

  return 'dark';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    return () => {
      try {
        delete document.documentElement.dataset.theme;
      } catch {
        // ignore environment without document
      }
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage issues
    }

    try {
      document.documentElement.dataset.theme = theme;
    } catch {
      // ignore environment without document
    }
  }, [theme]);

  const value = useMemo(() => {
    const isDarkMode = theme === 'dark';

    return {
      theme,
      isDarkMode,
      setTheme,
      toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
