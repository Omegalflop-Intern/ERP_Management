import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicFooter from '../components/public/PublicFooter';
import PublicNavbar from '../components/public/PublicNavbar';
import ScrollToTopButton from '../components/public/ScrollToTopButton';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <PublicNavbar />
      <main className="flex-1 pt-16 sm:pt-20">{children || <Outlet />}</main>
      <PublicFooter />
      <ScrollToTopButton />
    </div>
  );
}
