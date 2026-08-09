import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Base colors: rich light slate-50/90, dark obsidian slate-950 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#EFF6FF] dark:from-[#050810] dark:via-[#0b0f19] dark:to-[#050810] transition-colors duration-300" />

      {/* Subtle Dot Grid Texture */}
      <div className="absolute inset-0 bg-dot-grid opacity-35 dark:opacity-20 pointer-events-none" />

      {/* Enterprise Royal Blue Top-Center Spotlight */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-blue-600/12 dark:bg-blue-600/18 rounded-full blur-[140px] pointer-events-none animate-pulse" />

      {/* Indigo Ambient Left Mesh Orb */}
      <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/12 rounded-full blur-[150px] pointer-events-none" />

      {/* Soft Ambient Corner Glow */}
      <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-blue-500/10 dark:bg-slate-800/30 rounded-full blur-[160px] pointer-events-none" />
    </div>
  );
}
