import { Moon, Sun, Diamond, Sparkles } from 'lucide-react';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, designMode, toggleDesignMode } = useTheme();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={toggleDesignMode}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-blue-500/10 active:scale-90 ${
          designMode === 'glass'
            ? 'bg-blue-500/15 ring-1 ring-blue-400/30'
            : ''
        }`}
        aria-label={designMode === 'glass' ? 'Switch to flat mode' : 'Switch to glass mode'}
        title={designMode === 'glass' ? 'Flat Mode' : 'Glass Mode'}
      >
        {designMode === 'glass' ? (
          <Sparkles size={18} className="text-blue-400 transition-all duration-500" />
        ) : (
          <Diamond size={18} className="text-slate-400 transition-all duration-500" />
        )}
      </button>
      <button
        onClick={toggleTheme}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-blue-500/10 active:rotate-180 active:scale-90"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Moon size={20} className="text-slate-400 transition-all duration-500" />
        ) : (
          <Sun size={20} className="text-amber-500 transition-all duration-500" />
        )}
      </button>
    </div>
  );
}
