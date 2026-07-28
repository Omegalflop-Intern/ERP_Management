import React from 'react';
import { Smartphone, Code, Heart, ShieldCheck, Cpu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Bottombar() {
  const { styled } = useTheme();

  return (
    <footer
      className={`
      mt-8 pt-3 pb-2 px-4 border-t border-gray-200 dark:border-gray-800/80
      flex flex-col sm:flex-row items-center justify-between gap-3 text-xs
      text-gray-500 dark:text-gray-400 font-medium transition-all
      ${styled ? 'neu-card-sm !border-none !rounded-xl my-2' : 'bg-white/40 dark:bg-gray-900/30 backdrop-blur-xs rounded-xl'}
    `}
    >
      {/* ERP Info */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-red-600/10 text-red-600 flex items-center justify-center font-bold">
          <Smartphone className="w-3.5 h-3.5" />
        </div>
        <span className="font-bold text-gray-900 dark:text-gray-200">Mobile Shop ERP</span>
        <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-mono font-bold text-[10px] border border-red-200 dark:border-red-500/20">
          v1.0.0
        </span>
        <span className="hidden sm:inline text-gray-300 dark:text-gray-700">•</span>
        <span className="hidden sm:inline text-gray-500 dark:text-gray-400 font-mono text-[11px]">
          Enterprise Edition
        </span>
      </div>

      {/* Connection & Status */}
      <div className="flex items-center gap-3 text-[11px]">
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> DB Connected &
          Active
        </span>
      </div>

      {/* Developer Credit */}
      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
        <span>Developed & Maintained with</span>
        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-bounce" />
        <span>by</span>
        <a
          href="https://salahuddin.codes"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-red-700 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors flex items-center gap-1 bg-red-50 dark:bg-red-900/30 px-2.5 py-0.5 rounded-lg border border-red-200 dark:border-red-500/20 shadow-2xs"
        >
          <Code className="w-3.5 h-3.5 text-red-600 dark:text-red-400" /> Salah Uddin Kader
        </a>
      </div>
    </footer>
  );
}
