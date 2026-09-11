import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Base colors: rich light slate-50/90, pure pitch black #000000 in dark mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#EFF6FF] dark:from-[#000000] dark:via-[#050505] dark:to-[#000000] transition-colors duration-300" />

      {/* Subtle Dot Grid Texture */}
      <div className="absolute inset-0 bg-dot-grid opacity-35 dark:opacity-25 pointer-events-none" />

      {/* Lime Green Top-Center Ambient Glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[#9CE700]/8 dark:bg-[#9CE700]/12 rounded-full blur-[140px] pointer-events-none animate-pulse" />

      {/* Ambient Left Mesh Orb */}
      <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-[#9CE700]/5 dark:bg-[#9CE700]/8 rounded-full blur-[150px] pointer-events-none" />

      {/* Soft Ambient Corner Glow */}
      <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-[#9CE700]/5 dark:bg-neutral-900/40 rounded-full blur-[160px] pointer-events-none" />
    </div>
  );
}
