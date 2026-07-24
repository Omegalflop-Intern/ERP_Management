/**
 * ThemeContext.jsx — Compatibility shim
 * All logic moved to Zustand: client/src/store/themeStore.js
 * This file re-exports everything so existing imports continue to work.
 */
export { useTheme, useThemeStore } from '../store/themeStore';

import React, { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

// ThemeProvider now just syncs Zustand state → DOM attributes
export const ThemeProvider = ({ children }) => {
  const { theme, designMode } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('no-transition');
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    requestAnimationFrame(() => root.classList.remove('no-transition'));
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-mode', designMode);
    root.setAttribute('data-theme', theme);
  }, [designMode, theme]);

  return <>{children}</>;
};
