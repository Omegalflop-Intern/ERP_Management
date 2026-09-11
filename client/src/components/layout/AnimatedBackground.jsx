import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function AnimatedBackground() {
  const { designMode, theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none transition-all duration-500">
      {/* Base Canvas */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#EFF6FF] dark:from-[#080911] dark:via-[#0d0f1c] dark:to-[#06070d] transition-colors duration-300" />

      {/* Subtle Dot Grid Texture */}
      {designMode !== 'flat' && (
        <div className="absolute inset-0 bg-dot-grid opacity-35 dark:opacity-20 pointer-events-none" />
      )}

      {/* Mode Specific Dynamic Ambient Lights */}
      {designMode === 'aurora' && (
        <>
          <div className="absolute -top-32 left-1/4 w-[750px] h-[500px] bg-[#9CE700]/18 dark:bg-[#9CE700]/22 rounded-full blur-[140px] pointer-events-none animate-aura-1" />
          <div className="absolute top-1/3 -right-20 w-[600px] h-[600px] bg-[#10b981]/15 dark:bg-[#10b981]/18 rounded-full blur-[160px] pointer-events-none animate-aura-2" />
          <div className="absolute -bottom-32 left-1/3 w-[800px] h-[550px] bg-[#9CE700]/14 dark:bg-[#9CE700]/18 rounded-full blur-[150px] pointer-events-none animate-blob-float-1" />
        </>
      )}

      {designMode === 'glassmorphismpro' && (
        <>
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-[#9CE700]/12 dark:bg-[#9CE700]/16 rounded-full blur-[120px] pointer-events-none animate-ambient-glow-1" />
          <div className="absolute top-1/2 -left-32 w-[550px] h-[550px] bg-slate-300/30 dark:bg-neutral-800/40 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-[650px] h-[650px] bg-[#9CE700]/10 dark:bg-[#9CE700]/12 rounded-full blur-[140px] pointer-events-none" />
        </>
      )}

      {designMode === 'liquidglass' && (
        <>
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[#9CE700]/10 dark:bg-[#9CE700]/14 rounded-full blur-[140px] pointer-events-none animate-ambient-glow-1" />
          <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-[#9CE700]/6 dark:bg-[#9CE700]/8 rounded-full blur-[150px] pointer-events-none animate-ambient-glow-2" />
          <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-[#9CE700]/6 dark:bg-neutral-900/50 rounded-full blur-[160px] pointer-events-none animate-ambient-glow-3" />
        </>
      )}

      {designMode === 'neumorphism' && (
        <>
          <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-[#9CE700]/5 dark:from-[#9CE700]/5 to-transparent pointer-events-none" />
          <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-slate-200/40 dark:bg-neutral-900/60 rounded-full blur-[160px] pointer-events-none" />
        </>
      )}
    </div>
  );
}

