import React, { createContext, useContext, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Maps any pathname to its parent bottom-tab root.
// Returns null for routes not associated with any tab.
export function getTabForPath(pathname) {
  if (pathname === '/') return '/';
  if (pathname.startsWith('/package')) return '/packages';
  if (pathname.startsWith('/order') || pathname.startsWith('/track')) return '/order';
  if (pathname.startsWith('/wishlist')) return '/wishlist';
  if (
    pathname.startsWith('/profile') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/payment-methods') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/support') ||
    pathname.startsWith('/tickets') ||
    pathname.startsWith('/about')
  ) {
    return '/profile';
  }
  return null;
}

const TabNavContext = createContext();

export function TabNavProvider({ children }) {
  const location = useLocation();
  const lastTabRoutes = useRef({});

  useEffect(() => {
    const tab = getTabForPath(location.pathname);
    if (tab) {
      lastTabRoutes.current[tab] = location.pathname;
    }
  }, [location.pathname]);

  const getTabRoute = (tabRoot) => lastTabRoutes.current[tabRoot] || tabRoot;

  return (
    <TabNavContext.Provider value={{ getTabRoute }}>
      {children}
    </TabNavContext.Provider>
  );
}

export function useTabNav() {
  return useContext(TabNavContext);
}