import { Diamond, Moon, Sparkles, Sun } from 'lucide-react';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, designMode, toggleDesignMode } = useTheme();

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        onClick={toggleDesignMode}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 border ${
          designMode === 'glass'
            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 shadow-xs'
            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs'
        }`}
        aria-label={designMode === 'glass' ? 'Switch to flat mode' : 'Switch to glass mode'}
        title={designMode === 'glass' ? 'Glass Mode (Active)' : 'Flat Mode (Active)'}
      >
        {designMode === 'glass' ? (
          <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400 transition-transform duration-300" />
        ) : (
          <Diamond size={16} className="text-slate-700 dark:text-slate-200 transition-transform duration-300" />
        )}
      </button>

      <button
        onClick={toggleTheme}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 active:rotate-45 active:scale-95 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? (
          <Moon size={16} className="text-indigo-400 transition-transform duration-300" />
        ) : (
          <Sun size={16} className="text-amber-500 transition-transform duration-300" />
        )}
      </button>
    </div>
  );
}
