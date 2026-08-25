import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  Check,
  ChevronDown,
  Command,
  Diamond,
  DollarSign,
  FileText,
  Lock,
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
import { useAuth } from '../../context/AuthContext';
import { useBranchStore } from '../../store/branchStore';
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
        className={`${sz} rounded-full overflow-hidden flex items-center justify-center font-bold border border-blue-200 dark:border-blue-500/30 ${
          user?.avatar && !imgError
            ? ''
            : 'bg-green-600/10 dark:bg-green-600/20 text-green-700 dark:text-green-400'
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
      {/* Online/Offline Status Indicator Dot */}
      <span
        className={`absolute bottom-0 right-0 ${dotSize} rounded-full ring-2 ring-white dark:ring-slate-900 flex items-center justify-center`}
      >
        {online ? (
          <span className="relative flex h-full w-full">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500"></span>
          </span>
        ) : (
          <span className="inline-flex rounded-full h-full w-full bg-amber-500"></span>
        )}
      </span>
    </div>
  );
}

function BranchSwitcher({ user }) {
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  const branches = useBranchStore((s) => s.branches);
  const fetchBranches = useBranchStore((s) => s.fetchBranches);
  const setActiveBranchId = useBranchStore((s) => s.setActiveBranchId);
  const syncUserBranch = useBranchStore((s) => s.syncUserBranch);
  const tenantPlan = useBranchStore((s) => s.tenantPlan);
  const maxBranches = useBranchStore((s) => s.maxBranches);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (user) syncUserBranch(user);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleName = (user?.roleName || user?.role?.name || '').toUpperCase();
  const isAdmin = roleName === 'ADMIN' || user?.isSuperAdmin;
  const isBranchLocked = !isAdmin && !!user?.branchId;

  const currentBranch = branches.find((b) => String(b.id || b._id) === String(activeBranchId));
  const activeLabel =
    activeBranchId === 'all' ? 'All Outlets' : currentBranch?.name || 'Selected Branch';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          if (!isBranchLocked) setIsOpen(!isOpen);
        }}
        disabled={isBranchLocked}
        title={isBranchLocked ? 'Locked to assigned branch' : 'Switch active branch context'}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
          isBranchLocked
            ? 'bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/60 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-white/60 dark:bg-white/[0.05] border-white/40 dark:border-white/[0.1] hover:bg-white/90 dark:hover:bg-white/[0.1] text-gray-800 dark:text-gray-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
          {isBranchLocked ? (
            <Lock className="w-3 h-3 text-amber-500" />
          ) : (
            <Building2 className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="text-left hidden sm:block max-w-[130px] truncate">
          <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1">
            <span>Outlet</span>
            {isBranchLocked && (
              <span className="text-[9px] text-amber-500 font-bold">(Assigned)</span>
            )}
          </div>
          <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {activeLabel}
          </div>
        </div>
        {!isBranchLocked && <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />}
      </button>

      {isOpen && !isBranchLocked && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[115] overflow-hidden">
          <div className="px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-500" /> Switch Active Outlet
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              {branches.length} / {maxBranches === 999 ? '∞' : maxBranches} ({tenantPlan})
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            <button
              onClick={() => {
                setActiveBranchId('all');
                qc.invalidateQueries();
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                activeBranchId === 'all'
                  ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>All Outlets (Main Shop)</span>
              </div>
              {activeBranchId === 'all' && (
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
            </button>

            {branches.map((b) => {
              const bId = String(b.id || b._id);
              const isSelected = activeBranchId === bId;
              return (
                <button
                  key={bId}
                  onClick={() => {
                    setActiveBranchId(bId, b.name);
                    qc.invalidateQueries();
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="truncate">{b.name}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {isAdmin && (
            <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/branches');
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Manage / Add Outlets
              </button>
            </div>
          )}
        </div>
      )}
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
    { title: 'Stock Transfer', path: '/stock-transfer', icon: Package, category: 'Inventory' },
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
      {/* Search Bar Input Container */}
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`relative flex items-center w-full px-3.5 py-2 rounded-xl border text-xs cursor-text transition-all bg-white dark:bg-[#0d1117] border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm ${
          isOpen
            ? 'ring-2 ring-[#2563EB]/30 border-[#2563EB] dark:border-blue-500 bg-white dark:bg-[#0d1117]'
            : ''
        }`}
      >
        <Search className="w-4 h-4 text-slate-600 dark:text-slate-300 mr-2 flex-shrink-0 stroke-[2]" />
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
          className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-xs font-medium"
        />
        {query ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setQuery('');
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 flex-shrink-0 ml-1 border border-slate-300/40 dark:border-slate-700/40">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        )}
      </div>

      {/* Global Search Results Dropdown Overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[130] max-h-[80vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {/* Section: Pages / Quick Navigation */}
          {filteredPages.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#2563EB]" /> Navigation & Features
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                {filteredPages.map((page, idx) => {
                  const Icon = page.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(page.path)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center group-hover:bg-[#2563EB]/10 group-hover:text-[#2563EB] transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#2563EB] dark:group-hover:text-blue-400 truncate">
                          {page.title}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">{page.category}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" /> Searching database...
            </div>
          )}

          {/* Section: Products / Inventory */}
          {!loading && products.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3 h-3 text-blue-500" /> Products & IMEIs
              </div>
              <div className="space-y-1 mt-1">
                {products.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => handleSelect('/products')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {p.brand} | {p.category?.name || 'Device'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        ৳{p.sellingPrice?.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400">Stock: {p.stockQuantity ?? 0}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Customers */}
          {!loading && customers.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3 h-3 text-emerald-500" /> Customers
              </div>
              <div className="space-y-1 mt-1">
                {customers.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => handleSelect(`/customers/${c._id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                        {c.name?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {c.phone || c.email || 'No contact'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium capitalize">
                      {c.type || 'Retail'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Sales & Invoices */}
          {!loading && sales.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="w-3 h-3 text-purple-500" /> Sales Invoices
              </div>
              <div className="space-y-1 mt-1">
                {sales.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => handleSelect(`/sales/${s._id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 font-mono">
                          {s.invoiceNo}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {s.customer?.name || 'Walk-in Customer'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">
                        ৳{s.grandTotal?.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {!loading && query.length >= 2 && !hasResults && (
            <div className="p-6 text-center text-xs text-gray-400">
              No products, customers, or invoices match "
              <span className="font-semibold text-gray-300">{query}</span>"
            </div>
          )}

          {/* Footer hint */}
          <div className="px-4 py-2 bg-gray-50/50 dark:bg-gray-900/40 text-[10px] text-gray-400 flex items-center justify-between">
            <span>
              Press{' '}
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded font-mono">Esc</kbd>{' '}
              to close
            </span>
            <span className="text-[#2563EB] font-medium">Omni-Manage Quick Search</span>
          </div>
        </div>
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
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
          <DollarSign className="w-4 h-4" />
        </div>
      );
    case 'SALE_COMPLETED':
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
          <ShoppingCart className="w-4 h-4" />
        </div>
      );
    case 'WARRANTY_EXPIRING':
      return (
        <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4" />
        </div>
      );
    case 'SYSTEM':
      return (
        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-lg bg-gray-500/10 text-gray-500 flex items-center justify-center flex-shrink-0">
          <Bell className="w-4 h-4" />
        </div>
      );
  }
}

export default function Topbar({ onToggleSidebar, onToggleCollapse, collapsed }) {
  const { user, logout, setUser } = useAuth();
  const { theme, toggleTheme, designMode, toggleDesignMode } = useTheme();
  const { activeBranchId, branches = [], maxBranches = 2, setActiveBranchId } = useBranchStore();
  const styled = designMode === 'liquidglass' || designMode === 'glassmorphismpro' || designMode === 'neumorphism';
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

  // Fetch fresh profile on mount to ensure avatar & latest data is shown
  useEffect(() => {
    if (!user) return;
    api
      .get('/users/me')
      .then((r) => {
        const fresh = r.data?.data;
        if (fresh) setUser((prev) => ({ ...(prev || {}), ...fresh }));
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch tenant info (shop name + plan + logo) for the logged-in shop user
  const { data: tenantInfo } = useQuery({
    queryKey: ['my-tenant-info', user?.tenantId],
    queryFn: async () => {
      const r = await api.get('/tenants/me');
      return r.data?.data;
    },
    enabled: !!user?.tenantId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch settings for companyLogo fallback
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
    <header className="h-14 glass-primary rounded-[20px] m-2 px-3 md:px-6 flex items-center justify-between sticky top-2 z-30 shadow-sm">
      {/* Left: menu + brand */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden ${styled ? 'neu-btn !p-2' : ''}`}
        >
          <PanelLeftOpen className="w-5 h-5 text-slate-700 dark:text-slate-200 stroke-[2]" />
        </button>
        <button
          onClick={onToggleCollapse}
          className={`hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${styled ? 'neu-btn !p-2' : ''}`}
        >
          {collapsed ? (
            <PanelLeft className="w-5 h-5 text-slate-700 dark:text-slate-200 stroke-[2]" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-slate-700 dark:text-slate-200 stroke-[2]" />
          )}
        </button>
        <div className="flex items-center gap-2 font-bold text-xl text-[#2563EB] dark:text-blue-400">
          <div
            className={`w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-[#2563EB] dark:text-blue-400 overflow-hidden shrink-0 ${styled ? 'neu-icon !bg-blue-50 !border-none' : ''}`}
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
            {user?.tenantId && (
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/40">
                {activeBranchId === 'all'
                  ? 'All Outlets'
                  : branches.find((b) => String(b.id || b._id) === String(activeBranchId))?.name ||
                    'Active Outlet'}
              </span>
            )}
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                user?.tenantId
                  ? 'bg-blue-500/10 text-[#2563EB] dark:text-blue-400 border border-blue-300/40 dark:border-blue-500/30'
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

      {/* Middle: Global Search Bar */}
      <GlobalSearch />

      {/* Right: controls */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Desktop: ThemeToggle inline */}
        <div className="hidden md:block">
          <ThemeToggle />
        </div>

        {/* Mobile: settings gear/dots button → popover */}
        <div className="relative md:hidden" ref={mobileSettingsRef}>
          <button
            onClick={() => {
              setShowMobileSettings(!showMobileSettings);
              setShowUserMenu(false);
              setShowNotifs(false);
            }}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${styled ? 'neu-btn !p-2' : ''}`}
          >
            <Palette className="w-5 h-5 text-slate-700 dark:text-slate-200 stroke-[2]" />
          </button>
          {showMobileSettings && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-[110] overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Theme
              </div>
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-sm text-gray-700 dark:text-gray-300"
              >
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-blue-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                <span className="ml-auto text-[10px] text-gray-400">
                  {theme === 'dark' ? 'ON' : 'OFF'}
                </span>
              </button>
              <button
                onClick={() => {
                  toggleDesignMode();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-sm text-gray-700 dark:text-gray-300"
              >
                {designMode === 'glass' ? (
                  <Sparkles className="w-4 h-4 text-blue-400" />
                ) : (
                  <Diamond className="w-4 h-4 text-gray-400" />
                )}
                {designMode === 'glass' ? 'Glass Mode' : 'Flat Mode'}
                <span className="ml-auto text-[10px] text-gray-400">
                  {designMode === 'glass' ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Active Branch Switcher */}
        {user && <BranchSwitcher user={user} />}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              const nextState = !showNotifs;
              setShowNotifs(nextState);
              setShowUserMenu(false);
              setShowMobileSettings(false);
              if (nextState) qc.invalidateQueries({ queryKey: ['notifications'] });
            }}
            className={`relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${styled ? 'neu-btn !p-2' : ''}`}
          >
            <Bell className="w-5 h-5 text-slate-700 dark:text-slate-200 stroke-[2]" />
            {notifData?.unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#2563EB] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {notifData.unreadCount > 9 ? '9+' : notifData.unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[110] max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  Notifications
                </h3>
                {notifData?.unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs text-[#2563EB] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {!notifData?.notifications?.length ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">No notifications</div>
              ) : (
                notifData.notifications.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => {
                      markReadMutation.mutate(n._id);
                      if (n.link) navigate(n.link);
                      setShowNotifs(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 transition-colors ${!n.isRead ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(n.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {n.title}
                          </div>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {n.message}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
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

        {/* User profile */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            {/* Mobile: just avatar */}
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

            {/* Desktop: compact sleek profile button */}
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifs(false);
                setShowMobileSettings(false);
              }}
              className={`hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all ${
                styled
                  ? 'neu-flat !border-none !shadow-none hover:bg-white/10 dark:hover:bg-gray-800/40'
                  : 'bg-gradient-to-br from-white/60 to-white/30 dark:from-white/[0.08] dark:to-white/[0.02] backdrop-blur-[24px] saturate-[1.7] border border-white/40 dark:border-white/[0.08] hover:from-white/70 hover:to-white/40 dark:hover:from-white/[0.12] dark:hover:to-white/[0.04] shadow-[0_2px_16px_rgba(15,23,42,0.04)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.2)]'
              }`}
            >
              <UserAvatar user={user} size="sm" online={online} />
              <div className="text-left leading-tight min-w-0">
                <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                  {user.fullName || user.username}
                </div>
                <div className="text-[10px] text-[#2563EB] dark:text-blue-400 font-bold uppercase tracking-wider truncate max-w-[120px]">
                  {user.roleDisplayName || user.roleName || user.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5 flex-shrink-0" />
            </button>

            {/* Dropdown menu (both mobile and desktop) */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-[110] overflow-hidden">
                {/* Mobile only: show user info at top */}
                <div className="md:hidden px-3 py-3 border-b border-gray-100 dark:border-gray-800">
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

                {/* Active Branch Switcher Inside Profile Menu */}
                <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/50">
                  <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-blue-500" /> Active Outlet
                    </span>
                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">
                      ({branches.length}/{maxBranches === 999 ? '∞' : maxBranches})
                    </span>
                  </div>
                  <select
                    value={activeBranchId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'all') {
                        setActiveBranchId('all');
                      } else {
                        const selected = branches.find((b) => String(b.id || b._id) === val);
                        setActiveBranchId(val, selected?.name);
                      }
                      setShowUserMenu(false);
                    }}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="all">All Outlets (Main Shop)</option>
                    {branches.map((b) => (
                      <option key={b._id || b.id} value={String(b.id || b._id)}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {!user.tenantId && user.roleName === 'ADMIN' && (
                  <button
                    onClick={() => {
                      navigate('/super-admin/dashboard');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-sm text-[#2563EB] dark:text-blue-400 font-bold transition-colors border-b border-gray-100 dark:border-gray-800/60"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
                    Super Admin Console
                  </button>
                )}
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 text-sm text-gray-700 dark:text-gray-300 transition-colors border-b border-gray-100 dark:border-gray-800/60"
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
