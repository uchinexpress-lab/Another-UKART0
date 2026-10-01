import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Staff Admin theme system — independent from the customer app's next-themes.
// Stores preference in localStorage under 'ukart-staff-theme'.
// Applies the 'dark' class to <html> on mount, restores the customer app
// theme on unmount so the shopping app keeps its own preference.

const STORAGE_KEY = 'ukart-staff-theme';
const CUSTOMER_THEME_KEY = 'theme'; // next-themes default key

const StaffThemeContext = createContext(null);

export function useStaffTheme() {
  const ctx = useContext(StaffThemeContext);
  if (!ctx) return { theme: 'system', setTheme: () => {} };
  return ctx;
}

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme) {
  if (theme === 'system') return getSystemTheme();
  return theme;
}

function applyHtmlClass(isDark) {
  const html = document.documentElement;
  if (isDark) html.classList.add('dark');
  else html.classList.remove('dark');
}

export function StaffThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    return localStorage.getItem(STORAGE_KEY) || 'system';
  });

  // Apply theme on mount + whenever it changes
  useEffect(() => {
    applyHtmlClass(resolveTheme(theme) === 'dark');
  }, [theme]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyHtmlClass(getSystemTheme() === 'dark');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // On unmount: restore the customer app's theme so the shopping app
  // keeps its own next-themes preference untouched.
  useEffect(() => {
    return () => {
      const customerTheme = localStorage.getItem(CUSTOMER_THEME_KEY) || 'system';
      applyHtmlClass(resolveTheme(customerTheme) === 'dark');
    };
  }, []);

  const setTheme = useCallback((newTheme) => {
    localStorage.setItem(STORAGE_KEY, newTheme);
    setThemeState(newTheme);
  }, []);

  return (
    <StaffThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </StaffThemeContext.Provider>
  );
}