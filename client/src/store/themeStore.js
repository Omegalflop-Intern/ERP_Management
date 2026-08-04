import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      designMode: 'flat',

      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setDesignMode: (mode) => set({ designMode: mode }),
      toggleDesignMode: () =>
        set((s) => ({ designMode: s.designMode === 'flat' ? 'glass' : 'flat' })),
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
    styled: designMode === 'glass',
  };
};
