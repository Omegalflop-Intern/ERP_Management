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
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

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
    section: 'Sales',
    items: [
      { path: '/sales', label: 'Sales History', icon: Receipt, permissions: ['sales:view'] },
      {
        path: '/sales/new',
        label: 'New Sale (POS)',
        icon: ShoppingCart,
        permissions: ['sales:create'],
      },
      { path: '/sales/returns', label: 'Returns', icon: RotateCcw, permissions: ['sales:view'] },
    ],
  },
  {
    section: 'Inventory',
    items: [
      { path: '/products', label: 'Products', icon: Package, permissions: ['products:view'] },
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
    section: 'CRM',
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
    section: 'Management',
    items: [
      { path: '/purchases', label: 'Purchases', icon: Truck, permissions: ['purchases:view'] },
      { path: '/suppliers', label: 'Suppliers', icon: Contact, permissions: ['suppliers:view'] },
      { path: '/repairs', label: 'Repairs', icon: Wrench, permissions: ['repairs:view'] },
      {
        path: '/wholesale/orders',
        label: 'Wholesale Orders',
        icon: ShoppingCart,
        permissions: ['wholesale:view'],
      },
    ],
  },
  {
    section: 'Finance & Capital',
    items: [
      {
        label: 'Capital & Investment',
        icon: HandCoins,
        permissions: ['accounting:view'],
        children: [
          {
            path: '/accounting/investors',
            label: 'Investors & Partners',
            icon: Wallet,
            permissions: ['accounting:view'],
          },
          {
            path: '/accounting/expenses',
            label: 'Shop Costing & Expenses',
            icon: Receipt,
            permissions: ['accounting:view'],
          },
          {
            path: '/accounting/assets',
            label: 'Shop Assets & Depreciation',
            icon: Building,
            permissions: ['accounting:view'],
          },
          {
            path: '/accounting/loans',
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
            path: '/accounting/balance-sheet',
            label: 'Balance Sheet',
            icon: Scale,
            permissions: ['accounting:view'],
          },
          {
            path: '/accounting/profit-loss',
            label: 'Profit & Loss',
            icon: FileText,
            permissions: ['accounting:view'],
          },
          {
            path: '/accounting/trial-balance',
            label: 'Trial Balance',
            icon: Receipt,
            permissions: ['accounting:view'],
          },
        ],
      },
    ],
  },
  {
    section: 'HR',
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
    section: 'Administration',
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
      { path: '/settings', label: 'Settings', icon: Settings, permissions: ['settings:view'] },
    ],
  },
];

export default function Sidebar({ isOpen, onClose, collapsed = false }) {
  const { user, hasAnyPermission } = useAuth();
  const { styled } = useTheme();
  const location = useLocation();

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
        h-full bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-gray-800
        flex flex-col justify-between py-4
        transform transition-all duration-200 ease-in-out
        ${collapsed ? 'lg:w-[68px]' : 'lg:w-64'}
        ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0'}
        ${styled ? 'neu-sidebar border-none' : ''}
      `}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 overscroll-contain sidebar-scrollbar">
          {/* Mobile header */}
          <div className="flex items-center justify-between px-3 mb-4 lg:hidden">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-red-600" />
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
          {collapsed && (
            <div className="hidden lg:flex justify-center mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${styled ? 'neu-icon !rounded-xl' : 'bg-red-50 dark:bg-red-900/20'}`}
              >
                <Smartphone className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          )}

          {menuItems.map((group) => {
            const visibleItems = group.items.filter((item) => {
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
                {!collapsed && (
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {group.section}
                  </div>
                )}
                {collapsed && (
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
                            ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                            ${
                              hasActiveChild
                                ? 'bg-red-50/50 dark:bg-red-900/10 text-red-700 dark:text-red-400 font-bold'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                          </div>
                          {!collapsed &&
                            (isOpenMenu ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            ))}
                        </button>

                        {/* Dropdown Children Submenu */}
                        {!collapsed && isOpenMenu && (
                          <div className="pl-4 mt-1 space-y-0.5 border-l-2 border-red-500/20 ml-5">
                            {item.children.map((child) => (
                              <NavLink
                                key={child.path}
                                to={child.path}
                                className={({ isActive }) => `
                                  w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs transition-all
                                  ${
                                    isActive
                                      ? 'bg-red-700 text-white font-bold shadow-xs'
                                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
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
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) => `
                        w-full flex items-center gap-3 rounded-lg font-medium text-sm transition-all mb-0.5
                        ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                        ${
                          isActive
                            ? styled
                              ? 'neu-nav-active bg-red-50/80 dark:bg-red-900/10 text-red-700 dark:text-red-400'
                              : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }
                      `}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {!collapsed && (
          <div
            className={`px-4 py-3 mx-2 rounded-xl text-xs space-y-1.5 ${styled ? 'neu-card-sm' : 'bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800'}`}
          >
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
              <span>Server:</span>
              <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
              <span>Database:</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono text-[11px]">
                MongoDB
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="hidden lg:flex justify-center px-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Online" />
          </div>
        )}
      </aside>
    </>
  );
}
