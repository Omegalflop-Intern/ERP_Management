import { Code, Heart, Smartphone } from 'lucide-react';
import React from 'react';

export default function Bottombar() {
  return (
    <footer className="mt-8 pt-3 pb-2 px-4 border-t border-gray-200 dark:border-gray-800/80 flex flex-col sm:flex-row items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium transition-all bg-white/40 dark:bg-gray-900/30 backdrop-blur-xs rounded-xl">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center font-bold">
          <Smartphone className="w-3.5 h-3.5" />
        </div>
        <span className="font-bold text-gray-900 dark:text-gray-200">Omni-Manage</span>
        <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-400 font-mono font-bold text-[10px] border border-blue-200 dark:border-blue-500/20">
          v2.4.5
        </span>
        <span className="hidden sm:inline text-gray-300 dark:text-gray-700">•</span>
        <span className="hidden sm:inline text-gray-500 dark:text-gray-400 font-mono text-[11px]">
          Enterprise Edition
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
        <span className="hidden sm:inline">Developed & Maintained with</span>
        <Heart className="w-3.5 h-3.5 text-[#2563EB] fill-[#2563EB] animate-bounce" />
        <span className="hidden sm:inline">by</span>
        <a
          href="https://salahuddin.codes"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-[#2563EB] dark:text-blue-400 hover:text-[#1D4ED8] dark:hover:text-blue-300 transition-colors flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-500/20 shadow-2xs"
        >
          <Code className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" /> Salah Uddin Kader
        </a>
      </div>
    </footer>
  );
}
