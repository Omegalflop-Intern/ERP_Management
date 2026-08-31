import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Smartphone, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { menuItems } from '../../config/sidebar.config';
import { useAuth } from '../../context/AuthContext';
import api, { getAssetUrl } from '../../lib/api';

function SidebarLink({ item, isCollapsed, onNavigate }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/dashboard'}
      title={isCollapsed ? item.label : undefined}
      onClick={onNavigate}
      className={({ isActive }) =>
        `w-full flex items-center gap-2.5 rounded-xl text-[13px] transition-colors duration-150 py-2.5 group border ${
          isCollapsed ? 'justify-center px-2' : 'px-3'
        } ${
          isActive
            ? 'bg-blue-600/15 text-blue-700 dark:text-blue-400 font-bold border-blue-500/20 shadow-xs'
            : 'text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium border-transparent'
        }`
      }
    >
      <item.icon className="w-4 h-4 shrink-0 stroke-[2] text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
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
    <div>
      <button
        type="button"
        onClick={() => toggleSubmenu(item.label)}
        title={isCollapsed ? item.label : undefined}
        className={`w-full flex items-center justify-between rounded-xl text-[13px] transition-colors duration-150 py-2.5 group border ${
          isCollapsed ? 'justify-center px-2' : 'px-3'
        } ${
          hasActiveChild
            ? 'text-blue-700 dark:text-blue-400 font-bold bg-blue-600/10 border-blue-500/20'
            : 'text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <item.icon className="w-4 h-4 shrink-0 stroke-[2] text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </div>

        {!isCollapsed && (
          <span className="shrink-0 text-slate-500 dark:text-slate-400 ml-1">
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 stroke-[2]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
            )}
          </span>
        )}
      </button>

      {!isCollapsed && isOpen && (
        <div className="pl-3.5 mt-1 space-y-0.5 border-l-2 border-blue-500/20 dark:border-blue-500/30 ml-4 py-0.5">
          {item.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 group border ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-700 dark:text-blue-400 font-semibold border-blue-500/20'
                    : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 font-medium border-transparent'
                }`
              }
            >
              <child.icon className="w-3.5 h-3.5 shrink-0 stroke-[2] text-slate-700 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              <span className="truncate">{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ isOpen, onClose, collapsed = false }) {
  const location = useLocation();
  const { user, hasAnyPermission } = useAuth();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [logoError, setLogoError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  const toggleSubmenu = (label) => setOpenSubmenus((p) => ({ ...p, [label]: !p[label] }));

  const shopName = settings?.companyName || user?.shopName || 'Omni-Manage';
  const roleName = user?.roleName || (user?.role && user?.role.name) || 'STAFF';

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar container */}
      <aside
        className={`
          z-50 lg:z-30 flex flex-col
          transition-all duration-200 ease-in-out select-none
          bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md
          border-r border-slate-200/70 dark:border-slate-800/70
          ${
            isMobile
              ? `fixed top-0 bottom-0 left-0 w-64 h-full shadow-2xl
                 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
              : `static h-[calc(100vh-4rem)]
                 translate-x-0
                 ${isCollapsed ? 'w-[64px]' : 'w-60'}`
          }
        `}
      >
        {/* Minimal Header */}
        <div className="h-14 px-3.5 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 overflow-hidden">
              {settings?.companyLogo && !logoError ? (
                <img
                  src={getAssetUrl(settings.companyLogo)}
                  alt="Logo"
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Smartphone className="w-4 h-4" />
              )}
            </div>

            {!isCollapsed && (
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate tracking-tight">
                {shopName}
              </span>
            )}
          </div>

          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-4 overscroll-contain sidebar-scrollbar">
          {menuItems.map((group) => {
            const visible = group.items.filter((item) => {
              const perms = item.children
                ? item.children.flatMap((c) => c.permissions || [])
                : item.permissions || [];
              return perms.length === 0 || hasAnyPermission(perms);
            });
            if (!visible.length) return null;

            return (
              <div key={group.section} className="space-y-0.5">
                {!isCollapsed && (
                  <div className="px-2.5 pb-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {group.section}
                  </div>
                )}
                {isCollapsed && (
                  <div className="mx-2 my-1 border-t border-slate-200/50 dark:border-slate-800/50" />
                )}

                {visible.map((item) =>
                  item.children ? (
                    <SubmenuGroup
                      key={item.label}
                      item={item}
                      isCollapsed={isCollapsed}
                      openSubmenus={openSubmenus}
                      toggleSubmenu={toggleSubmenu}
                      location={location}
                      onNavigate={isMobile ? onClose : undefined}
                    />
                  ) : (
                    <SidebarLink
                      key={item.path}
                      item={item}
                      isCollapsed={isCollapsed}
                      onNavigate={isMobile ? onClose : undefined}
                    />
                  )
                )}
              </div>
            );
          })}
        </div>

        {/* Minimal Footer */}
        <div className="p-2 border-t border-slate-200/50 dark:border-slate-800/50">
          <NavLink
            to="/profile"
            onClick={isMobile ? onClose : undefined}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
            title="Profile"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs shrink-0 overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
              {user?.avatar && !avatarError ? (
                <img
                  src={getAssetUrl(user.avatar)}
                  alt={user?.fullName || user?.username || 'User'}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : user?.fullName ? (
                user.fullName.charAt(0).toUpperCase()
              ) : user?.username ? (
                user.username.charAt(0).toUpperCase()
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {user?.fullName || user?.username || 'Staff'}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider truncate">
                  {roleName}
                </div>
              </div>
            )}
          </NavLink>
        </div>
      </aside>
    </>
  );
}
