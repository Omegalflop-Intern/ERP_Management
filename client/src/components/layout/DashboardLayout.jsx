import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Bottombar from './Bottombar';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';

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
    <div className="h-screen bg-gray-50 dark:bg-[#0b0f19] flex flex-col overflow-hidden">
      <Topbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        collapsed={collapsed}
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={collapsed} />
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
  );
}
