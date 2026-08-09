import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import AnimatedBackground from './AnimatedBackground';
import Bottombar from './Bottombar';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout() {
  useDocumentTitle();

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
    <div className="relative h-screen bg-slate-50 dark:bg-[#0B0F17] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
      {/* Elegant Enterprise Royal Blue Spotlight Backdrop */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-blue-600/10 rounded-full blur-3xl z-0" />
      <AnimatedBackground />

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
