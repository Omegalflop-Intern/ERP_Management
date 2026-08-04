import React, { Suspense, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FileCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Menu,
  X,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ui/ThemeToggle';

const NAV_ITEMS = [
  { to: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/super-admin/shops', icon: Building2, label: 'Shop Management' },
  { to: '/super-admin/kyc', icon: FileCheck, label: 'KYC Verification' },
];

export default function SuperAdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-white leading-tight">Super Admin</div>
            <div className="text-[10px] text-indigo-300 font-medium">Central Management</div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white/12 text-white'
                  : 'text-indigo-200/80 hover:bg-white/6 hover:text-white'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={`px-3 py-4 border-t border-white/10 space-y-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        {!collapsed && (
          <div className="px-3 py-2 rounded-xl bg-white/5 mb-2">
            <div className="text-[11px] text-indigo-300 font-medium truncate">{user?.fullName || user?.username}</div>
            <div className="text-[10px] text-indigo-400 truncate">{user?.email}</div>
          </div>
        )}
        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-2'}`}>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-indigo-200 hover:bg-red-500/20 hover:text-red-300 transition-all ${collapsed ? 'justify-center w-full' : 'flex-1'}`}
            title="Logout"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#08080c] text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 relative bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 border-r border-indigo-800/40 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full z-10 w-5 h-10 bg-indigo-800 hover:bg-indigo-700 text-white rounded-r-lg flex items-center justify-center transition-colors shadow-lg"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 w-64 flex flex-col bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 border-r border-indigo-800/40 h-full shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-indigo-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 md:px-6 bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Super Admin Panel</span>
              <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-indigo-800">
                Central Management
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Logged in as <strong className="text-slate-700 dark:text-slate-200">{user?.fullName || user?.username}</strong>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
