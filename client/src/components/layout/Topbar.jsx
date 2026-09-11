import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Command,
  Diamond,
  DollarSign,
  FileText,
  Lock,
  LogIn,
  LogOut,
  Moon,
  Package,
  Palette,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Sun,
  User,
  Users,
  Wifi,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { detectSubdomain, getBaseDomain } from '../../utils/subdomain';
import ThemeToggle from '../ui/ThemeToggle';
import api, { getAssetUrl } from '../../lib/api';

function UserAvatar({ user, size = 'md', online = true }) {
  const [imgError, setImgError] = useState(false);
  const sizes = { sm: 'w-8 h-8 text-sm', md: 'w-9 h-9 text-sm', lg: 'w-10 h-10 text-base' };
  const sz = sizes[size] || sizes.md;

  useEffect(() => {
    setImgError(false);
  }, [user?.avatar]);

  const dotSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  return (
    <div className="relative inline-block flex-shrink-0">
      <div
        className={`${sz} rounded-full overflow-hidden flex items-center justify-center font-bold border border-slate-200 dark:border-neutral-800 ${user?.avatar && !imgError
            ? ''
            : 'bg-[#9CE700]/15 text-[#9CE700]'
          }`}
      >
        {user?.avatar && !imgError ? (
          <img
            src={getAssetUrl(user.avatar)}
            alt={user.username || 'User'}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          user?.username?.[0]?.toUpperCase() || '?'
        )}
      </div>
      <span
        className={`absolute bottom-0 right-0 ${dotSize} rounded-full ring-2 ring-white dark:ring-black flex items-center justify-center`}
      >
        {online ? (
          <span className="relative flex h-full w-full">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9CE700] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-full w-full bg-[#9CE700]"></span>
          </span>
        ) : (
          <span className="inline-flex rounded-full h-full w-full bg-amber-500"></span>
        )}
      </span>
    </div>
  );
}

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const pagesList = [
    { title: 'Dashboard Overview', path: '/dashboard', icon: Sparkles, category: 'Navigation' },
    { title: 'New Sale (POS)', path: '/sales/new', icon: ShoppingCart, category: 'Sales' },
    { title: 'Sales Invoices', path: '/sales', icon: ShoppingCart, category: 'Sales' },
    { title: 'Sales Returns', path: '/sales/returns', icon: ShoppingCart, category: 'Sales' },
    { title: 'Product Catalog', path: '/products', icon: Package, category: 'Inventory' },
    { title: 'IMEI Tracker', path: '/inventory', icon: Smartphone, category: 'Inventory' },
    { title: 'Stock Overview', path: '/stock', icon: Package, category: 'Inventory' },
    { title: 'Customer List', path: '/customers', icon: Users, category: 'CRM' },
    { title: 'Due Collection', path: '/customers/due-collection', icon: Users, category: 'CRM' },
    { title: 'Warranty Claims', path: '/warranties', icon: FileText, category: 'Services' },
    { title: 'Repair Services', path: '/repairs', icon: Wrench, category: 'Services' },
    { title: 'Shop Costing & Expenses', path: '/expenses', icon: DollarSign, category: 'Costing' },
    { title: 'Investors & Partners', path: '/investors', icon: Users, category: 'Costing' },
    { title: 'Loans & Liabilities', path: '/loans', icon: DollarSign, category: 'Costing' },
    {
      title: 'Profit & Loss Statement',
      path: '/reports/profit-loss',
      icon: FileText,
      category: 'Reports',
    },
    { title: 'Balance Sheet', path: '/reports/balance-sheet', icon: FileText, category: 'Reports' },
    {
      title: 'Trial Balance Report',
      path: '/reports/trial-balance',
      icon: FileText,
      category: 'Reports',
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setProducts([]);
      setCustomers([]);
      setSales([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [prodRes, custRes, saleRes] = await Promise.allSettled([
          api.get('/products', { params: { search: query, limit: 4 } }),
          api.get('/customers', { params: { search: query, limit: 4 } }),
          api.get('/sales', { params: { search: query, limit: 4 } }),
        ]);

        if (prodRes.status === 'fulfilled') {
          const data = prodRes.value.data?.data;
          setProducts(Array.isArray(data) ? data : data?.products || []);
        }
        if (custRes.status === 'fulfilled') {
          const data = custRes.value.data?.data;
          setCustomers(Array.isArray(data) ? data : data?.customers || []);
        }
        if (saleRes.status === 'fulfilled') {
          const data = saleRes.value.data?.data;
          setSales(Array.isArray(data) ? data : data?.sales || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const filteredPages = query.trim()
    ? pagesList.filter(
      (p) =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
    )
    : pagesList.slice(0, 6);

  const handleSelect = (path) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  const hasResults =
    filteredPages.length > 0 || products.length > 0 || customers.length > 0 || sales.length > 0;

  return (
    <div
      className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-2"
      ref={searchRef}
    >
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`relative flex items-center w-full px-3.5 py-2 rounded-full border text-xs cursor-text transition-all bg-slate-50 dark:bg-[#121524] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-xs ${isOpen
            ? 'ring-2 ring-[#9CE700]/30 border-[#9CE700] dark:border-[#9CE700] bg-white dark:bg-[#121524]'
            : ''
          }`}
      >
        <Search className={`w-4 h-4 mr-2 flex-shrink-0 stroke-[2] transition-colors ${isOpen ? 'text-[#9CE700]' : 'text-slate-400 dark:text-neutral-500'}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search products, customers, IMEIs, sales... (Ctrl+K)"
          className="global-search-input w-full bg-transparent border-0 ring-0 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-0 text-xs font-medium"
        />
        {query ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setQuery('');
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-[#171a2d] text-[10px] font-mono text-slate-600 dark:text-neutral-400 flex-shrink-0 ml-1 border border-slate-300/60 dark:border-white/10">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        )}
      </div>

      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs z-[190] sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:left-0 sm:right-0 sm:-left-16 sm:-right-16 md:-left-28 md:-right-28 sm:top-full sm:mt-2 bg-white dark:bg-[#121524] border border-slate-200 dark:border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[200] max-h-[75vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
            {filteredPages.length > 0 && (
              <div className="p-2.5">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#9CE700]" /> Navigation & Features
                </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                {filteredPages.map((page, idx) => {
                  const Icon = page.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(page.path)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-neutral-900 transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 flex items-center justify-center group-hover:bg-[#9CE700]/15 group-hover:text-[#9CE700] transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-[#9CE700] dark:group-hover:text-[#9CE700] transition-colors truncate">
                          {page.title}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">{page.category}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 opacity-0 group-hover:opacity-100 group-hover:text-[#9CE700] transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loading && (
            <div className="p-4 text-center text-xs text-slate-400 dark:text-neutral-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#9CE700]" /> Searching database...
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#9CE700]" /> Products & IMEIs
              </div>
              <div className="space-y-1 mt-1">
                {products.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => handleSelect('/products')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-neutral-900 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#9CE700]/15 text-[#9CE700] flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-[#9CE700] dark:group-hover:text-[#9CE700] truncate transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">
                          {p.brand} | {p.category?.name || 'Device'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-xs font-bold text-[#9CE700] font-mono">
                        ৳{p.sellingPrice?.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-neutral-500">Stock: {p.stockQuantity ?? 0}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && customers.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#9CE700]" /> Customers
              </div>
              <div className="space-y-1 mt-1">
                {customers.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => handleSelect(`/customers/${c._id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-neutral-900 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#9CE700]/15 text-[#9CE700] flex items-center justify-center flex-shrink-0 font-bold text-xs">
                        {c.name?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-[#9CE700] dark:group-hover:text-[#9CE700] truncate transition-colors">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">
                          {c.phone || c.email || 'No contact'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#9CE700]/15 text-[#9CE700] font-medium capitalize">
                      {c.type || 'Retail'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && sales.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-[#9CE700]" /> Sales Invoices
              </div>
              <div className="space-y-1 mt-1">
                {sales.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => handleSelect(`/sales/${s._id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-neutral-900 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#9CE700]/15 text-[#9CE700] flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-[#9CE700] dark:group-hover:text-[#9CE700] font-mono truncate transition-colors">
                          {s.invoiceNo}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500 truncate">
                          {s.customer?.name || 'Walk-in Customer'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-xs font-bold text-[#9CE700] font-mono">
                        ৳{s.grandTotal?.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-neutral-500">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && query.length >= 2 && !hasResults && (
            <div className="p-6 text-center text-xs text-slate-400 dark:text-neutral-500">
              No products, customers, or invoices match "
              <span className="font-semibold text-slate-700 dark:text-neutral-300">{query}</span>"
            </div>
          )}

          <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#080808] border-t border-slate-100 dark:border-neutral-850 text-[10px] text-slate-500 dark:text-neutral-500 flex items-center justify-between">
            <span>
              Press{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 rounded font-mono border border-slate-300/50 dark:border-neutral-700">Esc</kbd>{' '}
              to close
            </span>
            <span className="text-[#9CE700] font-bold tracking-wide">Omni-Manage Quick Search</span>
          </div>
        </div>
      </>
    )}
    </div>
  );
}

function getNotificationIcon(type) {
  switch (type) {
    case 'LOW_STOCK':
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    case 'DUE_REMINDER':
      return (
        <div className="w-8 h-8 rounded-lg bg-[#9CE700]/15 text-[#9CE700] flex items-center justify-center flex-shrink-0">
          <DollarSign className="w-4 h-4" />
        </div>
      );
    case 'SALE_COMPLETED':
      return (
        <div className="w-8 h-8 rounded-lg bg-[#9CE700]/15 text-[#9CE700] flex items-center justify-center flex-shrink-0">
          <ShoppingCart className="w-4 h-4" />
        </div>
      );
    case 'WARRANTY_EXPIRING':
      return (
        <div className="w-8 h-8 rounded-lg bg-[#9CE700]/15 text-[#9CE700] flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4" />
        </div>
      );
    case 'SYSTEM':
      return (
        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-400 flex items-center justify-center flex-shrink-0">
          <Bell className="w-4 h-4" />
        </div>
      );
  }
}

export default function Topbar({ onToggleSidebar, onToggleCollapse, collapsed }) {
  const { user, logout, setUser } = useAuth();
  const { theme, toggleTheme, designMode, toggleDesignMode } = useTheme();
  const styled =
    designMode === 'liquidglass' ||
    designMode === 'glassmorphismpro' ||
    designMode === 'neumorphism';
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const subdomain = detectSubdomain();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  useEffect(() => {
    setShowNotifs(false);
    setShowUserMenu(false);
    setShowMobileSettings(false);
  }, [location.pathname]);
  const [online, setOnline] = useState(navigator.onLine);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    api
      .get('/users/me')
      .then((r) => {
        const fresh = r.data?.data;
        if (fresh) setUser((prev) => ({ ...(prev || {}), ...fresh }));
      })
      .catch(() => { });
  }, []);

  const { data: tenantInfo } = useQuery({
    queryKey: ['my-tenant-info', user?.tenantId],
    queryFn: async () => {
      const r = await api.get('/tenants/me');
      return r.data?.data;
    },
    enabled: !!user?.tenantId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data?.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const [logoError, setLogoError] = useState(false);
  const shopLogo = tenantInfo?.logo || user?.tenant?.logo || settings?.companyLogo;

  useEffect(() => {
    setLogoError(false);
  }, [shopLogo]);

  const userMenuRef = useRef(null);
  const mobileSettingsRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (mobileSettingsRef.current && !mobileSettingsRef.current.contains(e.target))
        setShowMobileSettings(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const r = await api.get('/notifications', { params: { limit: 15 } });
        return r.data?.data || { notifications: [], unreadCount: 0 };
      } catch {
        return { notifications: [], unreadCount: 0 };
      }
    },
    refetchInterval: 20000,
    retry: 2,
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-14 glass-primary rounded-[20px] m-2 px-3 md:px-6 flex items-center justify-between sticky top-2 z-[100] shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors lg:hidden ${styled ? 'neu-btn !p-2' : ''}`}
        >
          <PanelLeftOpen className="w-5 h-5 text-slate-700 dark:text-slate-200 stroke-[2]" />
        </button>
        <button
          onClick={onToggleCollapse}
          className={`hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${styled ? 'neu-btn !p-2' : ''}`}
        >
          {collapsed ? (
            <PanelLeft className="w-5 h-5 text-slate-700 dark:text-slate-200 stroke-[2]" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-slate-700 dark:text-slate-200 stroke-[2]" />
          )}
        </button>
        <div className="flex items-center gap-2 font-bold text-xl text-[#9CE700] dark:text-[#9CE700]">
          <div
            className={`w-9 h-9 rounded-xl bg-[#9CE700]/10 dark:bg-[#9CE700]/15 border border-[#9CE700]/30 dark:border-[#9CE700]/30 flex items-center justify-center text-[#7dbb00] dark:text-[#9CE700] overflow-hidden shrink-0 ${styled ? 'neu-icon !bg-[#9CE700]/10 !border-none' : ''}`}
          >
            {shopLogo && !logoError ? (
              <img
                src={getAssetUrl(shopLogo)}
                alt="Logo"
                className="w-full h-full object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Building2 className="w-5 h-5" />
            )}
          </div>
          <span className="hidden md:inline-flex items-center gap-1.5 font-extrabold text-base tracking-tight text-slate-800 dark:text-slate-100">
            <span>
              {tenantInfo?.shopName ||
                user?.tenant?.shopName ||
                user?.shopName ||
                (user?.tenantId ? 'OmniManage' : 'Super Admin Portal')}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${user?.tenantId
                  ? 'bg-[#9CE700]/10 text-[#7dbb00] dark:text-[#9CE700] border border-[#9CE700]/30'
                  : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-300/40 dark:border-violet-500/30'
                }`}
            >
              {tenantInfo?.plan ||
                user?.tenant?.plan ||
                (user?.tenantId ? 'STARTER' : 'SUPER ADMIN')}
            </span>
          </span>
        </div>
      </div>

      <GlobalSearch />

      <div className="flex items-center gap-1.5 md:gap-2">
        <div className="hidden md:block">
          <ThemeToggle />
        </div>

        <div className="relative md:hidden" ref={mobileSettingsRef}>
          <button
            onClick={() => {
              setShowMobileSettings(!showMobileSettings);
              setShowUserMenu(false);
              setShowNotifs(false);
            }}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${styled ? 'neu-btn !p-2' : ''}`}
          >
            <Palette className="w-5 h-5 text-slate-700 dark:text-slate-200 stroke-[2]" />
          </button>
          {showMobileSettings && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#121524] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-[#171a2d]">
                Theme & Design
              </div>
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-[#171a2d] text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-[#9CE700]" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                <span className="ml-auto text-[10px] text-slate-400">
                  {theme === 'dark' ? 'ON' : 'OFF'}
                </span>
              </button>
              <button
                onClick={() => {
                  toggleDesignMode();
                  const modes = ['liquidglass', 'aurora', 'glassmorphismpro', 'neumorphism', 'flat'];
                  const nextMode = modes[(modes.indexOf(designMode) + 1) % modes.length];
                  const labels = {
                    liquidglass: 'Liquid Glass',
                    aurora: 'Aurora Mesh',
                    glassmorphismpro: 'Glassmorphism Pro',
                    neumorphism: 'Neumorphism 3D',
                    flat: 'Minimal Flat',
                  };
                  toast.info(`✨ Mode: ${labels[nextMode] || nextMode}`, { duration: 1000 });
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-[#171a2d] text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <Sparkles className="w-4 h-4 text-[#9CE700]" />
                <span className="capitalize">{designMode || 'liquidglass'}</span>
                <span className="ml-auto text-[10px] text-[#7dbb00] dark:text-[#9CE700] font-bold">
                  Switch
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              const nextState = !showNotifs;
              setShowNotifs(nextState);
              setShowUserMenu(false);
              setShowMobileSettings(false);
              if (nextState) qc.invalidateQueries({ queryKey: ['notifications'] });
            }}
            className={`relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#171a2d] transition-colors ${styled ? 'neu-btn !p-2' : ''}`}
          >
            <Bell className="w-5 h-5 text-slate-700 dark:text-slate-200 stroke-[2]" />
            {notifData?.unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#9CE700] text-black text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                {notifData.unreadCount > 9 ? '9+' : notifData.unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#121524] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[9999] max-h-96 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#171a2d]">
                <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Notifications
                </h3>
                {notifData?.unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs text-[#7dbb00] dark:text-[#9CE700] hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {!notifData?.notifications?.length ? (
                <div className="px-4 py-8 text-center text-slate-400 text-xs">No notifications</div>
              ) : (
                notifData.notifications.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => {
                      markReadMutation.mutate(n._id);
                      if (n.link) navigate(n.link);
                      setShowNotifs(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#171a2d] border-b border-slate-100 dark:border-white/5 transition-colors ${!n.isRead ? 'bg-[#9CE700]/10 dark:bg-[#9CE700]/10' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(n.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {n.title}
                          </div>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#9CE700] flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">
                          {n.message}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifs(false);
                setShowMobileSettings(false);
              }}
              className={`md:hidden ${styled ? 'neu-icon !rounded-full !border-none !p-0' : ''}`}
            >
              <UserAvatar user={user} size="md" online={online} />
            </button>

            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifs(false);
                setShowMobileSettings(false);
              }}
              className={`hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all ${styled
                  ? 'neu-flat !border-none !shadow-none hover:bg-white/10 dark:hover:bg-neutral-800/40'
                  : 'bg-white/60 dark:bg-[#171a2d] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-sm'
                }`}
            >
              <UserAvatar user={user} size="sm" online={online} />
              <div className="text-left leading-tight min-w-0">
                <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                  {user.fullName || user.username}
                </div>
                <div className="text-[10px] text-[#7dbb00] dark:text-[#9CE700] font-bold uppercase tracking-wider truncate max-w-[120px]">
                  {user.roleDisplayName || user.roleName || user.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5 flex-shrink-0" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-[#121524] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="md:hidden px-3 py-3 border-b border-gray-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar user={user} size="lg" online={online} />
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {user.fullName || user.username}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {user.roleDisplayName || user.roleName || user.role}
                      </div>
                      {user.phone && (
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!user.tenantId && user.roleName === 'ADMIN' && (
                  <button
                    onClick={() => {
                      navigate('/super-admin/dashboard');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#9CE700]/10 text-sm text-[#9CE700] font-bold transition-colors border-b border-gray-100 dark:border-neutral-800"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#9CE700]" />
                    Super Admin Console
                  </button>
                )}
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-neutral-900/60 text-sm text-gray-700 dark:text-gray-300 transition-colors border-b border-gray-100 dark:border-neutral-800"
                >
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  My Profile
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-sm text-rose-600 dark:text-rose-400 font-semibold transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
