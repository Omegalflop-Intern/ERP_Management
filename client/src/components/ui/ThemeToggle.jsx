import React from 'react';
import {
  Sun,
  Moon,
  Layers,
  Sparkles,
  CircleDot,
  Droplets,
  Square,
  Zap,
  Diamond,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const MODE_CONFIG = {
  flat: { icon: CircleDot, label: 'Flat', color: 'text-gray-400' },
  neumorphism: { icon: Layers, label: 'Neumorphism', color: 'text-red-500' },
  glassmorphism: { icon: Sparkles, label: 'Glassmorphism', color: 'text-cyan-500' },
  liquidglass: { icon: Droplets, label: 'Liquid Glass', color: 'text-blue-400' },
  neobrutalism: { icon: Square, label: 'Neo Brutalism', color: 'text-pink-500' },
  aurora: { icon: Zap, label: 'Aurora', color: 'text-violet-500' },
  glassmorphismpro: { icon: Diamond, label: 'Glass Pro', color: 'text-indigo-500' },
};

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, designMode, cycleDesignMode } = useTheme();
  const config = MODE_CONFIG[designMode] || MODE_CONFIG.flat;
  const ModeIcon = config.icon;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggleTheme}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-red-500/10 active:rotate-180 active:scale-90 ${className}`}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Moon size={20} className="text-gray-400 transition-all duration-500" />
        ) : (
          <Sun size={20} className="text-amber-500 transition-all duration-500" />
        )}
      </button>
      <button
        onClick={cycleDesignMode}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
          designMode !== 'flat'
            ? 'bg-red-500/15 text-red-500 scale-110'
            : 'hover:bg-red-500/10 text-gray-400'
        }`}
        aria-label="Toggle design mode"
        title={`Design: ${config.label}`}
      >
        <ModeIcon
          size={20}
          className={`transition-all duration-300 ${
            designMode !== 'flat' ? 'drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]' : ''
          }`}
        />
      </button>
    </div>
  );
}
