import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  Bell,
  BookOpen,
  Building,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Contact,
  FileBarChart,
  FileText,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Package,
  Receipt,
  RotateCcw,
  Scale,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Store,
  Tags,
  Truck,
  User,
  UserCog,
  Users,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

const menuItems = [
  {
    section: 'Main',
    items: [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        permissions: ['dashboard:view'],
      },
    ],
  },
  {
    section: 'Sales & Orders',
    items: [
      {
        path: '/sales/new',
        label: 'New Sale (POS)',
        icon: ShoppingCart,
        permissions: ['sales:create'],
      },
      { path: '/sales', label: 'Sales History', icon: Receipt, permissions: ['sales:view'] },
      { path: '/sales/returns', label: 'Returns', icon: RotateCcw, permissions: ['sales:view'] },
      {
        path: '/wholesale/orders',
        label: 'Wholesale Orders',
        icon: ShoppingCart,
        permissions: ['wholesale:view'],
      },
    ],
  },
  {
    section: 'Products & Stock',
    items: [
      {
        path: '/products',
        label: 'Products & Stock',
        icon: Package,
        permissions: ['products:view'],
      },
      {
        path: '/products/categories',
        label: 'Categories',
        icon: Tags,
        permissions: ['categories:manage'],
      },
      {
        path: '/inventory',
        label: 'IMEI Tracker',
        icon: Smartphone,
        permissions: ['inventory:view'],
      },
      { path: '/stock', label: 'Stock Overview', icon: BarChart3, permissions: ['stock:view'] },
      {
        path: '/stock-transfer',
        label: 'Stock Transfer',
        icon: ArrowRightLeft,
        permissions: ['stock:transfer'],
      },
    ],
  },
  {
    section: 'Customers & Dues',
    items: [
      { path: '/customers', label: 'Customers', icon: Users, permissions: ['customers:view'] },
      {
        path: '/customers/due-collection',
        label: 'Due Collection',
        icon: CircleDollarSign,
        permissions: ['customers:view'],
      },
      {
        path: '/warranties',
        label: 'Warranty Claims',
        icon: Shield,
        permissions: ['warranties:view'],
      },
      {
        path: '/warranties/report',
        label: 'Warranty Report',
        icon: FileBarChart,
        permissions: ['warranties:view'],
      },
    ],
  },
  {
    section: 'Purchases & Repairs',
    items: [
      { path: '/purchases', label: 'Purchases', icon: Truck, permissions: ['purchases:view'] },
      { path: '/suppliers', label: 'Suppliers', icon: Contact, permissions: ['suppliers:view'] },
      {
        path: '/repairs',
        label: 'Repairs & Services',
        icon: Wrench,
        permissions: ['repairs:view'],
      },
      {
        label: 'Costing & Capital',
        icon: HandCoins,
        permissions: ['accounting:view'],
        children: [
          {
            path: '/expenses',
            label: 'Shop Costing & Expenses',
            icon: Receipt,
            permissions: ['accounting:view'],
          },
          {
            path: '/investors',
            label: 'Investors & Partners',
            icon: Wallet,
            permissions: ['accounting:view'],
          },
          {
            path: '/assets',
            label: 'Shop Assets & Equipment',
            icon: Building,
            permissions: ['accounting:view'],
          },
          {
            path: '/loans',
            label: 'Loans & Liabilities',
            icon: Landmark,
            permissions: ['accounting:view'],
          },
        ],
      },
      {
        label: 'Accounting & Reports',
        icon: FileBarChart,
        permissions: ['accounting:view'],
        children: [
          {
            path: '/reports',
            label: 'Financial Reports',
            icon: FileBarChart,
            permissions: ['reports:view'],
          },
          {
            path: '/accounting',
            label: 'Chart of Accounts',
            icon: Landmark,
            permissions: ['accounting:view'],
          },
          {
            path: '/accounting/journal-entries',
            label: 'Journal Entries',
            icon: BookOpen,
            permissions: ['accounting:view'],
          },
          {
            path: '/reports/balance-sheet',
            label: 'Balance Sheet',
            icon: Scale,
            permissions: ['accounting:view'],
          },
          {
            path: '/reports/profit-loss',
            label: 'Profit & Loss',
            icon: FileText,
            permissions: ['accounting:view'],
          },
          {
            path: '/reports/trial-balance',
            label: 'Trial Balance',
            icon: Receipt,
            permissions: ['accounting:view'],
          },
        ],
      },
    ],
  },
  {
    section: 'HR & Payroll',
    items: [
      { path: '/hr/employees', label: 'Employees', icon: Users, permissions: ['employees:view'] },
      {
        path: '/hr/attendance',
        label: 'Attendance',
        icon: ClipboardList,
        permissions: ['attendance:view'],
      },
      {
        path: '/hr/leaves',
        label: 'Leave Management',
        icon: FileText,
        permissions: ['leaves:view'],
      },
      { path: '/hr/payroll', label: 'Payroll', icon: Wallet, permissions: ['payroll:view'] },
    ],
  },
  {
    section: 'System Administration',
    items: [
      { path: '/profile', label: 'My Profile', icon: User, permissions: [] },
      { path: '/users', label: 'Users', icon: UserCog, permissions: ['users:view'] },
      {
        path: '/roles',
        label: 'Roles & Permissions',
        icon: ShieldCheck,
        permissions: ['roles:view'],
      },
      { path: '/branches', label: 'Branches', icon: Building2, permissions: ['branches:view'] },
      {
        path: '/activity-logs',
        label: 'Activity Logs',
        icon: ClipboardList,
        permissions: ['users:view'],
      },
      {
        path: '/system-analytics',
        label: 'System Analytics',
        icon: Activity,
        permissions: ['settings:view'],
      },
      {
        path: '/saas/tenants',
        label: 'Shop Management',
        icon: Building2,
        permissions: ['saas:manage'],
      },
      { path: '/settings', label: 'Settings', icon: Settings, permissions: ['settings:view'] },
    ],
  },
];

export default function Sidebar({ isOpen, onClose, collapsed = false }) {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isCollapsed = collapsed && !isMobile;

  // Fetch settings for company logo
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data?.data || res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const companyLogo = settings?.companyLogo;

  // Manage open state of collapsible submenus
  const [openSubmenus, setOpenSubmenus] = useState({});

  useEffect(() => {
    // Automatically expand submenu if current pathname matches a child route
    const newOpenState = { ...openSubmenus };
    menuItems.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some((child) => location.pathname === child.path);
          if (hasActiveChild) {
            newOpenState[item.label] = true;
          }
        }
      });
    });
    setOpenSubmenus(newOpenState);
  }, [location.pathname]);

  const toggleSubmenu = (label) => {
    setOpenSubmenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50
        h-[calc(100vh-1rem)] lg:h-auto my-2 ml-2 lg:my-0 lg:ml-0 glass-primary rounded-[24px]
        flex flex-col justify-between py-4
        transform transition-all duration-250 ease-in-out
        ${isCollapsed ? 'lg:w-[68px]' : 'lg:w-64'}
        ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0'}
      `}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 overscroll-contain sidebar-scrollbar">
          {/* Mobile header */}
          <div className="flex items-center justify-between px-3 mb-4 lg:hidden">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt="Shop Logo"
                    className="w-5 h-5 rounded object-cover"
                  />
                ) : (
                  <Smartphone className="w-5 h-5 text-[#2563EB]" />
                )}
                <span className="font-bold text-gray-900 dark:text-gray-100">Menu</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ml-auto"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Desktop collapsed logo */}
          {isCollapsed && (
            <div className="hidden lg:flex justify-center mb-4">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt="Shop Logo"
                  className="w-10 h-10 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20"
                >
                  <Smartphone className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
                </div>
              )}
            </div>
          )}

          {menuItems.map((group) => {
            const visibleItems = group.items.filter((item) => {
              // Hide SaaS Tenants control panel from Shop Owners & Staff
              if (item.path === '/saas/tenants' && user?.tenantId) {
                return false;
              }
              if (item.children) {
                return item.children.some(
                  (child) =>
                    !child.permissions ||
                    child.permissions.length === 0 ||
                    hasAnyPermission(child.permissions)
                );
              }
              return (
                !item.permissions ||
                item.permissions.length === 0 ||
                hasAnyPermission(item.permissions)
              );
            });
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.section} className="mb-3">
                {!isCollapsed && (
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {group.section}
                  </div>
                )}
                {isCollapsed && (
                  <div className="mx-2 mb-1 border-t border-gray-200 dark:border-gray-800" />
                )}

                {visibleItems.map((item) => {
                  if (item.children) {
                    const isOpenMenu = !!openSubmenus[item.label];
                    const hasActiveChild = item.children.some((c) => location.pathname === c.path);

                    return (
                      <div key={item.label} className="mb-1">
                        <button
                          onClick={() => toggleSubmenu(item.label)}
                          className={`
                            w-full flex items-center justify-between rounded-lg font-medium text-sm transition-all
                            ${isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                            ${
                              hasActiveChild
                                ? 'bg-blue-50/80 dark:bg-blue-900/20 text-[#2563EB] dark:text-blue-400 font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-4 h-4 shrink-0 text-[#2563EB] dark:text-blue-400" />
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                          </div>
                          {!isCollapsed &&
                            (isOpenMenu ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            ))}
                        </button>

                        {/* Dropdown Children Submenu */}
                        {!isCollapsed && isOpenMenu && (
                          <div className="pl-4 mt-1 space-y-0.5 border-l-2 border-[#2563EB]/20 ml-5">
                            {item.children.map((child) => (
                              <NavLink
                                key={child.path}
                                to={child.path}
                                className={({ isActive }) => `
                                  w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-xs transition-all
                                  ${
                                    isActive
                                      ? 'bg-[#2563EB] text-white font-bold shadow-xs'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
                                  }
                                `}
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

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={isCollapsed ? item.label : undefined}
                      className={({ isActive }) => `
                        w-full flex items-center gap-3 rounded-xl font-medium text-sm transition-all mb-0.5
                        ${isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                        ${
                          isActive
                            ? 'bg-blue-50/80 dark:bg-blue-900/20 text-[#2563EB] dark:text-blue-400 font-semibold border border-blue-200/60 dark:border-blue-800/40 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                        }
                      `}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
