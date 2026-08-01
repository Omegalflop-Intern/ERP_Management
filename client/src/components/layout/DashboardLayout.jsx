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
    <div className="relative h-screen bg-[#F8FAFC] dark:bg-[#0b0f17] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
      {/* Dynamic Animated Ambient Background Mesh & Subtle Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-40 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] dark:opacity-40" />
      <div className="pointer-events-none absolute -top-48 -left-48 w-[550px] h-[550px] bg-blue-500/20 dark:bg-blue-600/25 rounded-full blur-[130px] animate-glass-float-1" />
      <div className="pointer-events-none absolute top-1/3 -right-48 w-[550px] h-[550px] bg-sky-400/20 dark:bg-indigo-600/20 rounded-full blur-[130px] animate-glass-float-2" />
      <div className="pointer-events-none absolute -bottom-48 left-1/3 w-[550px] h-[550px] bg-indigo-500/18 dark:bg-blue-800/20 rounded-full blur-[130px] animate-glass-float-3" />

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
            className="flex-1 p-4 md:p-6 lg:p-7 w-full overflow-y-auto overscroll-contain flex flex-col justify-between"
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
