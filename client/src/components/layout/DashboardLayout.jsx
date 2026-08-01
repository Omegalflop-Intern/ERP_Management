import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import Bottombar from './Bottombar';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout() {
  useInactivityLogout();

  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const location = useLocation();

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (main) main.scrollTop = 0;
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed);
  }, [collapsed]);

  return (
    <div className="relative h-screen bg-slate-50 dark:bg-[#080d1a] flex flex-col overflow-hidden">
      {/* Liquid Glass Background Ambient Glow Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 opacity-70 dark:opacity-50">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-500/20 dark:bg-red-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-500/20 dark:bg-indigo-600/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[30rem] h-[30rem] bg-purple-500/15 dark:bg-purple-600/25 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          collapsed={collapsed}
        />
        <div className="flex flex-1 min-h-0">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            collapsed={collapsed}
          />
          <main
            id="main-content"
            className="flex-1 p-4 md:p-6 overflow-y-auto overscroll-contain flex flex-col justify-between"
          >
            <div className="flex-1">
              <Outlet />
            </div>
            <Bottombar />
          </main>
        </div>
      </div>
    </div>
  );
}
