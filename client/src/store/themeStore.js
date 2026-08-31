import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DESIGN_MODES = ['liquidglass', 'aurora', 'glassmorphismpro', 'neumorphism', 'flat'];

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      designMode: 'liquidglass',

      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setDesignMode: (mode) => set({ designMode: mode }),
      toggleDesignMode: () =>
        set((s) => {
          const idx = DESIGN_MODES.indexOf(s.designMode);
          const nextMode = DESIGN_MODES[(idx + 1) % DESIGN_MODES.length];
          return { designMode: nextMode };
        }),
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        theme: state.theme,
        designMode: state.designMode,
      }),
    }
  )
);

/**
 * Compatibility hook — same shape as old useTheme() Context.
 * Components using useTheme() can be migrated incrementally.
 */
export const useTheme = () => {
  const { theme, designMode, toggleTheme, setDesignMode, toggleDesignMode } = useThemeStore();

  return {
    theme,
    designMode,
    toggleTheme,
    setDesignMode,
    toggleDesignMode,
    isDark: theme === 'dark',
    styled:
      designMode === 'liquidglass' ||
      designMode === 'glassmorphismpro' ||
      designMode === 'neumorphism',
  };
};
