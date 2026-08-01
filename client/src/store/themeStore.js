import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MODES = [
  'flat',
  'neumorphism',
  'glassmorphism',
  'liquidglass',
  'aurora',
  'glassmorphismpro',
];

const MODE_ICONS = {
  flat: 'Flat',
  neumorphism: 'Neumorphism',
  glassmorphism: 'Glassmorphism',
  liquidglass: 'Liquid Glass',
  aurora: 'Aurora',
  glassmorphismpro: 'Glass Pro',
};

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      designMode: 'flat',

      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      setDesignMode: (mode) => set({ designMode: mode }),

      cycleDesignMode: () =>
        set((s) => {
          const idx = MODES.indexOf(s.designMode);
          return { designMode: MODES[(idx + 1) % MODES.length] };
        }),

      // Computed getters (called as functions from components)
      isDark: () => get().theme === 'dark',
      styled: () => get().designMode !== 'flat',
      neumorphism: () => get().designMode === 'neumorphism',
      glassmorphism: () => get().designMode === 'glassmorphism',
      liquidglass: () => get().designMode === 'liquidglass',
      neobrutalism: () => false,
      aurora: () => get().designMode === 'aurora',
      glassmorphismpro: () => get().designMode === 'glassmorphismpro',
      modeLabel: () => MODE_ICONS[get().designMode] || 'Flat',
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        theme: state.theme,
        designMode: state.designMode === 'neobrutalism' ? 'flat' : state.designMode,
      }),
    }
  )
);

/**
 * Compatibility hook — same shape as old useTheme() Context.
 * Components using useTheme() can be migrated incrementally.
 */
export const useTheme = () => {
  const { theme, designMode, toggleTheme, cycleDesignMode, setDesignMode } = useThemeStore();
  const currentMode = designMode === 'neobrutalism' ? 'flat' : designMode;

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    designMode: currentMode,
    cycleDesignMode,
    setDesignMode,
    styled: currentMode !== 'flat',
    neumorphism: currentMode === 'neumorphism',
    glassmorphism: currentMode === 'glassmorphism',
    liquidglass: currentMode === 'liquidglass',
    neobrutalism: false,
    aurora: currentMode === 'aurora',
    glassmorphismpro: currentMode === 'glassmorphismpro',
    modeLabel: MODE_ICONS[currentMode] || 'Flat',
  };
};

