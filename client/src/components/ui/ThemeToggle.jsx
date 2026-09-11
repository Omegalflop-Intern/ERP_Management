import { Moon, Sparkles, Sun } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, designMode, toggleDesignMode } = useTheme();

  const modeLabels = {
    liquidglass: 'Liquid Glass (3D Ultra Depth)',
    aurora: 'Aurora Mesh Glow',
    glassmorphismpro: 'Glassmorphism Pro',
    neumorphism: 'Soft Neumorphism 3D',
    flat: 'Minimal Flat',
  };

  const handleToggleMode = () => {
    toggleDesignMode();
    // Fetch next mode for instant toast feedback
    const modes = ['liquidglass', 'aurora', 'glassmorphismpro', 'neumorphism', 'flat'];
    const nextMode = modes[(modes.indexOf(designMode) + 1) % modes.length];
    toast.info(`✨ UI Mode: ${modeLabels[nextMode] || nextMode}`, { duration: 1000 });
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        onClick={handleToggleMode}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 border ${
          designMode !== 'flat'
            ? 'bg-[#9CE700]/10 dark:bg-[#9CE700]/15 border-[#9CE700]/40 text-[#7dbb00] dark:text-[#9CE700] shadow-sm'
            : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 shadow-xs'
        }`}
        aria-label="Switch UI Design Mode"
        title={`UI Mode: ${modeLabels[designMode] || designMode}`}
      >
        <Sparkles
          size={16}
          className="text-[#7dbb00] dark:text-[#9CE700] transition-transform duration-300"
        />
      </button>

      <button
        onClick={toggleTheme}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 active:rotate-45 active:scale-95 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 shadow-xs"
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? (
          <Moon size={16} className="text-[#9CE700] transition-transform duration-300" />
        ) : (
          <Sun size={16} className="text-amber-500 transition-transform duration-300" />
        )}
      </button>
    </div>
  );
}
