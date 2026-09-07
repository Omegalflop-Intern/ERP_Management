import {
  Activity,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Database,
  FileCheck,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Shield,
  Settings,
  Sun,
  User,
  UserCog,
  X,
  Sparkles,
  Server,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import React, { Suspense, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import api, { getAssetUrl } from '../lib/api';

const NAV_GROUPS = [
  {
    title: 'Core Command',
    items: [
      { to: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/super-admin/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    title: 'Tenant Governance',
    items: [
      { to: '/super-admin/shops', icon: Building2, label: 'Shop Management' },
      { to: '/super-admin/kyc', icon: FileCheck, label: 'KYC Verification' },
      { to: '/super-admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    ],
  },
  {
    title: 'Communications',
    items: [
      { to: '/super-admin/tickets', icon: LifeBuoy, label: 'Support Tickets' },
      { to: '/super-admin/contacts', icon: MessageSquare, label: 'Inquiries' },
    ],
  },
  {
    title: 'System & Security',
    items: [
      { to: '/super-admin/audit-logs', icon: Activity, label: 'Audit Logs' },
      { to: '/super-admin/backups', icon: Database, label: 'System Backups' },
      { to: '/super-admin/system-admins', icon: UserCog, label: 'System Admins' },
      { to: '/super-admin/settings', icon: Settings, label: 'Platform Settings' },
      { to: '/super-admin/profile', icon: User, label: 'My Profile' },
    ],
  },
];

export default function SuperAdminLayout() {
  useDocumentTitle();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, setUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const { data: profileData } = useQuery({
    queryKey: ['super-admin-layout-profile'],
    queryFn: async () => {
      try {
        const res = await api.get('/super-admin/profile');
        const data = res.data?.data || res.data;
        if (data && setUser) {
          setUser((prev) => ({ ...prev, ...data }));
        }
        return data;
      } catch {
        return null;
      }
    },
    staleTime: 30 * 1000,
  });

  const currentUser = profileData || user;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const rawPhoto = currentUser?.avatar || currentUser?.profilePhoto || currentUser?.profile_photo;
  const photoUrl = rawPhoto ? getAssetUrl(rawPhoto) : null;
  const initials = (currentUser?.fullName || currentUser?.full_name || currentUser?.username || 'SA')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Find active group / page title for breadcrumb
  let activePageName = 'Overview';
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => location.pathname.startsWith(i.to));
    if (item) {
      activePageName = item.label;
      break;
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 select-none">
      {/* Brand Header */}
      <div
        className={`flex items-center gap-3 px-4 py-4 border-b border-slate-200/80 dark:border-slate-800/80 ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/20">
          <Shield className="w-5 h-5 text-white drop-shadow" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none">
                Omni<span className="text-blue-600 dark:text-blue-400">Manage</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                HQ
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide uppercase mt-1">
              Super Admin Console
            </div>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto custom-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed ? (
              <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>{group.title}</span>
              </div>
            ) : (
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2 mx-1" />
            )}

            <div className="space-y-1">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 font-extrabold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/80'
                    } ${collapsed ? 'justify-center px-0 h-10 w-10 mx-auto' : ''}`
                  }
                  title={collapsed ? label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110`}
                  />
                  {!collapsed && <span className="truncate">{label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin Profile & Action Footer */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
        {!collapsed && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-2.5">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={currentUser?.fullName || 'Super Admin'}
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-500/20 shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/20">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-900 dark:text-white font-bold truncate">
                {currentUser?.fullName || currentUser?.username || 'Super Administrator'}
              </div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                Root Access
              </div>
            </div>
          </div>
        )}

        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-2'}`}>
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-800 shadow-sm ${
              collapsed ? 'w-10 h-10 flex items-center justify-center' : 'w-10 h-10 flex items-center justify-center shrink-0'
            }`}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/20 transition-all ${
              collapsed ? 'w-10 h-10 justify-center p-0' : 'flex-1 justify-center'
            }`}
            title="Logout"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-white" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="super-admin-scope flex h-screen bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 relative bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 z-20 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 z-30 w-6 h-6 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-white border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center transition-all shadow-md hover:scale-110"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-72 flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-full shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 z-20"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 md:px-8 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 z-10">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline">
                Super Admin /
              </span>
              <h2 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                {activePageName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Platform Active</span>
            </div>

            {/* Quick Profile Tag */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={currentUser?.fullName || 'Super Admin'}
                  className="w-8 h-8 rounded-xl object-cover ring-2 ring-blue-500/20 shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                  {initials}
                </div>
              )}
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[130px]">
                  {currentUser?.fullName || currentUser?.username}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Super Admin</div>
              </div>
            </div>

            {/* Topbar Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-sm shadow-rose-600/20 border border-rose-600 transition-all duration-150 group"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Router Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 dark:bg-[#090a0f] custom-scrollbar">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs font-semibold text-slate-500">Loading Console...</p>
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
