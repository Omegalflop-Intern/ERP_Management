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
      label: 'Total Sales',
      value: stats.totalSalesCount || 0,
      prefix: '',
      suffix: '',
      icon: ShoppingCart,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      raw: true,
      hint: 'Orders completed',
    },
    {
      label: 'Revenue',
      value: stats.totalRevenue || 0,
      prefix: '৳',
      suffix: '',
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
      raw: false,
      hint: 'Total cash received',
    },
    {
      label: 'Total Cost & Expenses',
      value: stats.totalCostAndExpenses || 0,
      prefix: '৳',
      suffix: '',
      icon: Receipt,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      raw: false,
      hint: 'Purchases + expenses',
    },
    {
      label: 'Total Due',
      value: stats.totalDueAmount || 0,
      prefix: '৳',
      suffix: '',
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      raw: false,
      hint: 'Pending customer due',
    },
    {
      label: 'Available Stock',
      value: stats.totalAvailableUnits || 0,
      prefix: '',
      suffix: '',
      icon: Package,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      raw: true,
      hint: 'Units in shop',
    },
    {
      label: 'Stock Value',
      value: stats.totalStockValue || 0,
      prefix: '৳',
      suffix: '',
      icon: TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      raw: false,
      hint: 'Inventory asset value',
    },
    {
      label: 'Active Repairs',
      value: stats.activeRepairsCount || 0,
      prefix: '',
      suffix: '',
      icon: Wrench,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      raw: true,
      hint: 'Devices in repair',
    },
  ];

  const cardClass = styled
    ? 'neu-card p-5'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4';
  const btnClass = styled
    ? 'neu-btn p-3 flex items-center gap-3 text-left'
    : 'flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/5 transition-all text-left';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {user?.fullName || user?.username}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Here's what's happening at your shop today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`${cardClass} group hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                {card.label}
              </span>
              <div
                className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0 ${styled ? 'neu-icon !rounded-lg' : ''}`}
              >
                <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
            </div>
            <div className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
              {isLoading ? (
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                <AnimatedNumber value={card.value} prefix={card.prefix} suffix={card.suffix} />
              )}
            </div>
            {card.hint && (
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 truncate">
                {card.hint}
              </div>
            )}
          </div>
        ))}
      </div>

      <DashboardCharts
        salesTrendData={charts.salesTrendData || []}
        dueTrendData={charts.dueTrendData || []}
        brandDistribution={charts.brandDistribution || []}
        period={period}
        onPeriodChange={setPeriod}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className={
            styled
              ? 'neu-card p-6'
              : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-6'
          }
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: 'New Sale',
                path: '/sales/new',
                icon: ShoppingCart,
                color: 'text-green-600 dark:text-green-400',
              },
              {
                label: 'Stock',
                path: '/stock',
                icon: Package,
                color: 'text-purple-600 dark:text-purple-400',
              },
              {
                label: 'Reports',
                path: '/reports',
                icon: TrendingUp,
                color: 'text-blue-600 dark:text-blue-400',
              },
              {
                label: 'Due Collection',
                path: '/customers',
                icon: DollarSign,
                color: 'text-amber-600 dark:text-amber-400',
              },
              {
                label: 'Branches',
                path: '/branches',
                icon: Building2,
                color: 'text-gray-600 dark:text-gray-400',
              },
              {
                label: 'Repairs',
                path: '/repairs',
                icon: Wrench,
                color: 'text-red-600 dark:text-red-400',
              },
            ].map((action) => (
              <button key={action.label} onClick={() => navigate(action.path)} className={btnClass}>
                <action.icon className={`w-5 h-5 ${action.color}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div
          className={
            styled
              ? 'neu-card p-6'
              : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-6'
          }
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Low Stock
            </h3>
            <button
              onClick={() => navigate('/stock')}
              className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {!lowStockData || lowStockData.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">All stock levels OK</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockData.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 ${styled ? 'neu-pressed !bg-transparent !border-amber-300/50 dark:!border-amber-500/30' : ''}`}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500">{item.brand}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      <AnimatedNumber value={item.count} />
                    </div>
                    <div className="text-[10px] text-gray-500">min: {item.minAlert}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className={
            styled
              ? 'neu-card p-6'
              : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-6'
          }
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Sales</h3>
            <button
              onClick={() => navigate('/sales')}
              className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {!recentSales || recentSales.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sales yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSales.map((s) => (
                <button
                  key={s._id}
                  onClick={() => navigate(`/sales/${s._id}`)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-left ${styled ? 'neu-btn-sm' : ''}`}
                >
                  <div>
                    <div className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                      {s.invoiceNumber}
                    </div>
                    <div className="text-xs text-gray-500">{s.customerName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      ৳{s.netTotal?.toLocaleString()}
                    </div>
                    {s.paymentBreakdown?.dueAmount > 0 && (
                      <div className="text-[10px] text-red-500">
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
