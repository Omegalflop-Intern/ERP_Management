import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Smartphone, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { menuItems } from '../../config/sidebar.config';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

function SidebarLink({ item, isCollapsed, onNavigate }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/dashboard'}
      title={isCollapsed ? item.label : undefined}
      onClick={onNavigate}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 rounded-xl font-medium text-sm transition-all duration-200 mb-1 ${
          isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3.5 py-2.5'
        } ${
          isActive
            ? 'bg-[#2563EB] text-white font-bold shadow-md shadow-[#2563EB]/25'
            : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
        }`
      }
    >
      <item.icon className="w-4 h-4 shrink-0 stroke-[2.2]" />
      {!isCollapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

function SubmenuGroup({ item, isCollapsed, openSubmenus, toggleSubmenu, location, onNavigate }) {
  const isOpen = !!openSubmenus[item.label];
  const hasActiveChild = item.children.some(
    (c) => location.pathname === c.path || (c.path !== '/' && location.pathname.startsWith(c.path))
  );

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => toggleSubmenu(item.label)}
        className={`w-full flex items-center justify-between rounded-xl font-medium text-sm transition-all duration-200 ${
          isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3.5 py-2.5'
        } ${
          hasActiveChild
            ? 'bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 font-bold border border-blue-200/80 dark:border-blue-800/50'
            : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
        }`}
      >
        <div className="flex items-center gap-3">
          <item.icon className="w-4 h-4 shrink-0 text-[#2563EB] dark:text-blue-400 stroke-[2.2]" />
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
        <div className="pl-4 mt-1 space-y-1 border-l-2 border-[#2563EB]/30 ml-5">
          {item.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-xs transition-all duration-200 ${
                  isActive
                    ? 'bg-[#2563EB] text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`
              }
            >
              <child.icon className="w-3.5 h-3.5 shrink-0 stroke-[2]" />
              <span className="truncate">{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarMenu({ isCollapsed, location, onNavigate }) {
  const { hasAnyPermission } = useAuth();
  const [openSubmenus, setOpenSubmenus] = useState({});

  useEffect(() => {
    const next = {};
    menuItems.forEach((group) => {
      group.items.forEach((item) => {
        if (
          item.children?.some(
            (c) =>
              location.pathname === c.path ||
              (c.path !== '/' && location.pathname.startsWith(c.path))
          )
        ) {
          next[item.label] = true;
        }
      });
    });
    setOpenSubmenus((prev) => ({ ...prev, ...next }));
  }, [location.pathname]);

  const toggle = (label) => setOpenSubmenus((p) => ({ ...p, [label]: !p[label] }));

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-14 overscroll-contain sidebar-scrollbar">
      {menuItems.map((group, idx) => {
        const visible = group.items.filter((item) => {
          const perms = item.children
            ? item.children.flatMap((c) => c.permissions || [])
            : item.permissions || [];
          return perms.length === 0 || hasAnyPermission(perms);
        });
        if (!visible.length) return null;

        const isLastGroup = idx === menuItems.length - 1;

        return (
          <div key={group.section} className={isLastGroup ? 'mb-4' : 'mb-2'}>
            {!isCollapsed && (
              <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                {group.section}
              </div>
            )}
            {isCollapsed && (
              <div className="mx-2 mb-1 border-t border-slate-200 dark:border-slate-800" />
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
                  onNavigate={onNavigate}
                />
              ) : (
                <SidebarLink key={item.path} item={item} isCollapsed={isCollapsed} onNavigate={onNavigate} />
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

  // Lock body scroll when mobile sidebar is open so background doesn't scroll
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen]);

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
    return <Smartphone className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />;
  };

  return (
    <>
      {/* ── Mobile backdrop ── */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ── Sidebar ── */}
      <aside
        className={`
          z-50 lg:z-30 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isMobile
            ? /* Mobile: floating rounded glass card */
              `fixed top-2 bottom-2 left-2 w-72 h-[calc(100vh-1rem)] glass-primary rounded-[24px] pt-4 pb-2
               shadow-2xl shadow-black/50 border border-white/20 dark:border-slate-800/80
               ${isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'}`
            : /* Desktop: static floating glass card */
              `static h-[calc(100vh-1rem)] my-2 ml-2 glass-primary rounded-[24px] pt-4 pb-2
               translate-x-0
               ${isCollapsed ? 'w-[68px]' : 'w-64'}`
          }
        `}
      >
        {/* Mobile header with close button */}
        <div className="flex items-center justify-between px-4 mb-4 lg:hidden">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-bold text-slate-900 dark:text-slate-100 text-base">Menu</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
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
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/30">
                <Smartphone className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
              </div>
            )}
          </div>
        )}

        <SidebarMenu
          isCollapsed={isCollapsed}
          location={location}
          onNavigate={isMobile ? onClose : undefined}
        />
      </aside>
    </>
  );
}
