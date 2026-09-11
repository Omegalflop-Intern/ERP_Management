import { Code, Heart, Smartphone } from 'lucide-react';
import React from 'react';

export default function Bottombar() {
  return (
    <footer className="mt-8 pt-3 pb-2 px-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center gap-2 text-xs text-slate-500 dark:text-[#8892B0] font-medium transition-all bg-white/40 dark:bg-[#121524]/60 backdrop-blur-xs rounded-xl">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-[#9CE700]/10 text-[#9CE700] flex items-center justify-center font-bold">
          <Smartphone className="w-3.5 h-3.5" />
        </div>
        <span className="font-bold text-slate-900 dark:text-slate-200">Omni-Manage</span>
        <span className="px-2 py-0.5 rounded-full bg-[#9CE700]/10 text-[#7dbb00] dark:text-[#9CE700] font-mono font-bold text-[10px] border border-[#9CE700]/30">
          v2.4.5
        </span>
        <span className="hidden sm:inline text-gray-300 dark:text-gray-700">•</span>
        <span className="hidden sm:inline text-gray-500 dark:text-gray-400 font-mono text-[11px]">
          Enterprise Edition
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#8892B0]">
        <span className="hidden sm:inline">Developed & Maintained with</span>
        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-bounce" />
        <span className="hidden sm:inline">by</span>
        <a
          href="https://salahuddin.codes"
          target="_blank"
          rel="noreferrer"
          className="font-bold text-slate-800 dark:text-slate-200 hover:text-[#9CE700] transition-colors"
        >
          Salah Uddin Kader
        </a>
        <span className="hidden sm:inline">&</span>
        <span className="font-bold text-[#7dbb00] dark:text-[#9CE700] flex items-center gap-1 bg-[#9CE700]/10 px-2.5 py-0.5 rounded-lg border border-[#9CE700]/30 shadow-2xs">
          <Code className="w-3.5 h-3.5 text-[#7dbb00] dark:text-[#9CE700]" /> OmegaFlop
        </span>
      </div>
    </footer>
  );
}
