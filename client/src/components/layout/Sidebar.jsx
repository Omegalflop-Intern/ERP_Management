import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { menuItems } from '../../config/sidebar.config';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

function SidebarLink({ item, isCollapsed, isActive }) {
  return (
    <NavLink
      to={item.path}
      title={isCollapsed ? item.label : undefined}
      className={`w-full flex items-center gap-3 rounded-xl font-medium text-sm transition-all mb-1
        ${isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
        ${
          isActive
            ? 'bg-blue-50/80 dark:bg-blue-900/20 text-[#2563EB] dark:text-blue-400 font-semibold border border-blue-200/60 dark:border-blue-800/50'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/60'
        }`}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {!isCollapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

function SubmenuGroup({ item, isCollapsed, openSubmenus, toggleSubmenu, location }) {
  const isOpen = !!openSubmenus[item.label];
  const hasActiveChild = item.children.some((c) => location.pathname === c.path);

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => toggleSubmenu(item.label)}
        className={`w-full flex items-center justify-between rounded-xl font-medium text-sm transition-all
          ${isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
          ${
            hasActiveChild
              ? 'bg-blue-50/80 dark:bg-blue-900/20 text-[#2563EB] dark:text-blue-400 font-semibold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
      >
        <div className="flex items-center gap-3">
          <item.icon className="w-4 h-4 shrink-0 text-[#2563EB] dark:text-blue-400" />
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </div>
        {!isCollapsed &&
          (isOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          ))}
      </button>

      {!isCollapsed && isOpen && (
        <div className="pl-4 mt-1 space-y-0.5 border-l-2 border-[#2563EB]/20 ml-5">
          {item.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              className={({
                isActive,
              }) => `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs transition-all
                ${
                  isActive
                    ? 'bg-[#2563EB] text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/70'
                }`}
            >
              <child.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarMenu({ isCollapsed, location }) {
  const { hasAnyPermission } = useAuth();
  const [openSubmenus, setOpenSubmenus] = useState({});

  useEffect(() => {
    const next = {};
    menuItems.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children?.some((c) => location.pathname === c.path)) {
          next[item.label] = true;
        }
      });
    });
    setOpenSubmenus((prev) => ({ ...prev, ...next }));
  }, [location.pathname]);

  const toggle = (label) => setOpenSubmenus((p) => ({ ...p, [label]: !p[label] }));

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 overscroll-contain sidebar-scrollbar">
      {menuItems.map((group) => {
        const visible = group.items.filter((item) => {
          const perms = item.children
            ? item.children.flatMap((c) => c.permissions || [])
            : item.permissions || [];
          return perms.length === 0 || hasAnyPermission(perms);
        });
        if (!visible.length) return null;

        return (
          <div key={group.section} className="mb-1.5">
            {!isCollapsed && (
              <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                {group.section}
              </div>
            )}
            {isCollapsed && (
              <div className="mx-2 mb-1 border-t border-gray-200 dark:border-gray-800" />
            )}

            {visible.map((item) =>
              item.children ? (
                <SubmenuGroup
                  key={item.label}
                  item={item}
                  isCollapsed={isCollapsed}
                  openSubmenus={openSubmenus}
                  toggleSubmenu={toggle}
                  location={location}
                />
              ) : (
                <SidebarLink key={item.path} item={item} isCollapsed={isCollapsed} />
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Sidebar({ isOpen, onClose, collapsed = false }) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isCollapsed = collapsed && !isMobile;

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data?.data || res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const Logo = () => {
    if (settings?.companyLogo) {
      return (
        <img src={settings.companyLogo} alt="Shop Logo" className="w-5 h-5 rounded object-cover" />
      );
    }
    return <Smartphone className="w-5 h-5 text-[#2563EB]" />;
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50
          h-[calc(100vh-1rem)] lg:h-auto my-2 ml-2 lg:my-0 lg:ml-0 glass-primary rounded-[24px]
          flex flex-col justify-between py-4
          transform transition-all duration-250 ease-in-out
          ${isCollapsed ? 'lg:w-[68px]' : 'lg:w-64'}
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between px-3 mb-4 lg:hidden">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Logo />
              <span className="font-bold text-gray-900 dark:text-gray-100">Menu</span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ml-auto"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Desktop collapsed logo */}
        {isCollapsed && (
          <div className="hidden lg:flex justify-center mb-4">
            {settings?.companyLogo ? (
              <img
                src={settings.companyLogo}
                alt="Shop Logo"
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20">
                <Smartphone className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
              </div>
            )}
          </div>
        )}

        <SidebarMenu isCollapsed={isCollapsed} location={location} />
      </aside>
    </>
  );
}
