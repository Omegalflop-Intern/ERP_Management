import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  DollarSign,
  Package,
  Plus,
  Receipt,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCharts from '../../components/charts/DashboardCharts';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';

import PageHeader from '../../components/layout/PageHeader';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { styled } = useTheme();
  const [period, setPeriod] = React.useState('7d');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: async () => {
      const res = await api.get('/finance/dashboard', { params: { period } });
      return res.data;
    },
    staleTime: 30000,
  });

  const { data: recentSales } = useQuery({
    queryKey: ['recent-sales-dashboard'],
    queryFn: async () => {
      const res = await api.get('/sales', { params: { limit: 5 } });
      return res.data?.data || [];
    },
  });

  const stats = dashboardData?.data?.stats || {};
  const charts = dashboardData?.data?.charts || {};
  const lowStockData = dashboardData?.data?.lowStockItems || [];

  const statCards = [
    {
      label: 'Total Revenue',
      value: stats.totalRevenue || 0,
      prefix: '৳',
      suffix: '',
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      hint: 'Total cash received',
    },
    {
      label: 'Total Sales',
      value: stats.totalSalesCount || 0,
      prefix: '',
      suffix: '',
      icon: ShoppingCart,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      hint: 'Completed orders',
    },
    {
      label: 'Due Amount',
      value: stats.totalDueAmount || 0,
      prefix: '৳',
      suffix: '',
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/40',
      hint: 'Pending customer dues',
    },
    {
      label: 'Net Profit',
      value:
        stats.netProfit !== undefined
          ? stats.netProfit
          : (stats.totalRevenue || 0) - (stats.totalCogs || 0) - (stats.totalExpenses || 0),
      prefix: '৳',
      suffix: '',
      icon: TrendingUp,
      color:
        (stats.netProfit || 0) >= 0
          ? 'text-teal-600 dark:text-teal-400'
          : 'text-rose-600 dark:text-rose-400',
      bg:
        (stats.netProfit || 0) >= 0
          ? 'bg-teal-50 dark:bg-teal-950/40'
          : 'bg-rose-50 dark:bg-rose-950/40',
      hint: 'Revenue - COGS - Expenses',
    },
    {
      label: 'Stock Value',
      value: stats.totalStockValue || 0,
      prefix: '৳',
      suffix: '',
      icon: Package,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      hint: 'Inventory asset value',
    },
    {
      label: 'Purchase Cost',
      value: stats.totalPurchasesCost || 0,
      prefix: '৳',
      suffix: '',
      icon: Receipt,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      hint: 'Stock inventory purchases',
    },
    {
      label: 'Shop Expenses',
      value: stats.totalExpenses || 0,
      prefix: '৳',
      suffix: '',
      icon: DollarSign,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      hint: 'Operating expenses (bills, rent, etc.)',
    },
    {
      label: 'Active Repairs',
      value: stats.activeRepairsCount || 0,
      prefix: '',
      suffix: '',
      icon: Wrench,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      hint: 'Devices in service',
    },
  ];

  return (
    <div className="space-y-6 w-full pb-6">
      {/* Standard Page Header */}
      <PageHeader
        title={`Welcome back, ${user?.fullName || user?.username || 'Owner'}!`}
        subtitle="Here is your shop's performance summary, stock value, and key sales metrics at a glance."
        icon={Sparkles}
        badge="Live Shop Overview"
        badgeVariant="success"
        actions={
          <>
            <button
              onClick={() => navigate('/sales/new')}
              className="px-4 py-2.5 bg-primary text-white font-semibold rounded-xl text-xs transition-all shadow-xs hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Sale (POS)
            </button>
            <button
              onClick={() => navigate('/purchases')}
              className="px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Receipt className="w-4 h-4 text-purple-500" /> Purchases & Restock
            </button>
            <button
              onClick={() => navigate('/customers/due-collection')}
              className="px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <DollarSign className="w-4 h-4 text-emerald-500" /> Collect Dues
            </button>
          </>
        }
      />

      {/* Primary Key Metrics Grid — 4 Cards Per Row on Desktop, 2 on Tablet, 1 on Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="glass-secondary rounded-[20px] p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg shadow-slate-900/5 flex flex-col justify-between h-full"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {card.label}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0 shadow-xs`}
                >
                  <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                {isLoading ? (
                  <div className="h-7 w-28 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg animate-pulse" />
                ) : (
                  <AnimatedNumber value={card.value} prefix={card.prefix} suffix={card.suffix} />
                )}
              </div>
            </div>
            {card.hint && (
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-3 truncate pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50">
                {card.hint}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Performance Charts */}
      <DashboardCharts
        salesTrendData={charts.salesTrendData || []}
        dueTrendData={charts.dueTrendData || []}
        brandDistribution={charts.brandDistribution || []}
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* Bottom Operational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Quick Shortcuts */}
        <div className="glass-secondary rounded-[20px] p-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            Frequent Tasks
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                label: 'New Sale (POS)',
                path: '/sales/new',
                icon: ShoppingCart,
                color: 'text-emerald-600 dark:text-emerald-400',
              },
              {
                label: 'Purchase & Restock',
                path: '/purchases',
                icon: Truck,
                color: 'text-purple-600 dark:text-purple-400',
              },
              {
                label: 'Stock & Items',
                path: '/products',
                icon: Package,
                color: 'text-indigo-600 dark:text-indigo-400',
              },
              {
                label: 'Due Collection',
                path: '/customers/due-collection',
                icon: DollarSign,
                color: 'text-amber-600 dark:text-amber-400',
              },
              {
                label: 'Repairs Service',
                path: '/repairs',
                icon: Wrench,
                color: 'text-rose-600 dark:text-rose-400',
              },
              {
                label: 'Costing & Expenses',
                path: '/accounting/expenses',
                icon: Receipt,
                color: 'text-red-600 dark:text-red-400',
              },
              {
                label: 'Financial Reports',
                path: '/reports',
                icon: TrendingUp,
                color: 'text-blue-600 dark:text-blue-400',
              },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 hover:border-[#2563EB]/40 bg-white/60 dark:bg-slate-900/60 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all text-left group btn-hover-lift"
              >
                <action.icon className={`w-4 h-4 ${action.color} flex-shrink-0`} />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-[#2563EB] dark:group-hover:text-blue-400">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="glass-secondary rounded-[20px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Items
            </h3>
            <button
              onClick={() => navigate('/stock')}
              className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {!lowStockData || lowStockData.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">All product stocks look healthy!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockData.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-500">{item.brand}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                      <AnimatedNumber value={item.count} /> in stock
                    </div>
                    <div className="text-[10px] text-slate-400">Min limit: {item.minAlert}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales History */}
        <div className="glass-secondary rounded-[20px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Recent Sales</h3>
            <button
              onClick={() => navigate('/sales')}
              className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View History <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {!recentSales || recentSales.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No recent sales recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSales.map((s) => (
                <button
                  key={s._id}
                  onClick={() => navigate(`/sales/${s._id}`)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors text-left"
                >
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                      {s.invoiceNumber}
                    </div>
                    <div className="text-[11px] text-slate-500">{s.customerName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                      ৳{s.netTotal?.toLocaleString()}
                    </div>
                    {s.paymentBreakdown?.dueAmount > 0 && (
                      <div className="text-[10px] font-bold text-red-500">
                        Due: ৳{s.paymentBreakdown.dueAmount?.toLocaleString()}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
