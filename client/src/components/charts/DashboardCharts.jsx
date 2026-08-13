import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  PieChart as PieIcon,
  Calendar,
  Zap,
  BarChart3,
  Layers,
  Sparkles,
  ArrowUpRight,
  PackageCheck,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const BRAND_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#0EA5E9', // Sky Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#14B8A6', // Teal
];

const PERIOD_OPTIONS = [
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
];

const PERIOD_LABELS = {
  '24h': 'Last 24 Hours',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
};

export default function DashboardCharts({
  salesTrendData = [],
  dueTrendData = [],
  brandDistribution = [],
  period = '7d',
  onPeriodChange,
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  // Calculate Aggregated Metrics for KPI Highlights
  const summaryMetrics = useMemo(() => {
    const totalRev = salesTrendData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
    const totalSalesCount = salesTrendData.reduce((acc, curr) => acc + (curr.sales || 0), 0);
    const totalPaid = dueTrendData.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
    const totalDue = dueTrendData.reduce((acc, curr) => acc + (curr.dueAmount || 0), 0);
    const collectionRate =
      totalPaid + totalDue > 0 ? Math.round((totalPaid / (totalPaid + totalDue)) * 100) : 100;

    const totalBrandUnits = brandDistribution.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const topBrand =
      brandDistribution.length > 0
        ? [...brandDistribution].sort((a, b) => b.value - a.value)[0]
        : null;

    return {
      totalRev,
      totalSalesCount,
      totalPaid,
      totalDue,
      collectionRate,
      totalBrandUnits,
      topBrand,
    };
  }, [salesTrendData, dueTrendData, brandDistribution]);

  // Custom High-End Glassmorphism Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl bg-slate-900/90 dark:bg-slate-950/95 border border-slate-700/60 text-white min-w-[180px] space-y-2">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
          <span>{label}</span>
          <Sparkles className="w-3 h-3 text-indigo-400" />
        </div>
        <div className="space-y-1.5 pt-0.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-semibold text-slate-300">{entry.name}</span>
              </div>
              <span className="font-extrabold text-white font-mono">
                {typeof entry.value === 'number' &&
                entry.name !== 'Sales Count' &&
                entry.name !== 'Units'
                  ? `৳${entry.value.toLocaleString()}`
                  : entry.value?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const EmptyChart = ({ title, icon: Icon = BarChart3 }) => (
    <div className="flex flex-col items-center justify-center h-[280px] gap-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner">
        <Icon className="w-6 h-6 stroke-[2]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          No {title} Data Available
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Transactions will render automatically as sales & stock activities occur.
        </p>
      </div>
    </div>
  );

  const currentPeriodLabel = PERIOD_LABELS[period] || 'Last 7 Days';

  return (
    <div className="space-y-6">
      {/* ─── TIMEFRAME HEADER & KPI METRICS STRIP ───────────────────────── */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Business Analytics & Growth Trends
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Live performance data across branches ({currentPeriodLabel})
              </p>
            </div>
          </div>

          {/* Timeframe Selector Pills */}
          {onPeriodChange && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onPeriodChange(opt.value)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    period === opt.value
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Aggregate KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                Period Revenue
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                ৳{summaryMetrics.totalRev.toLocaleString()}
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                Sales Completed
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {summaryMetrics.totalSalesCount.toLocaleString()}{' '}
                <span className="text-xs text-slate-400 font-normal">units</span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-500 dark:text-sky-400">
                Paid Collection
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {summaryMetrics.collectionRate}%{' '}
                <span className="text-xs text-slate-400 font-normal">rate</span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <PackageCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-violet-500/5 dark:bg-violet-500/10 border border-violet-500/20 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400">
                Top Stock Brand
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">
                {summaryMetrics.topBrand ? summaryMetrics.topBrand.name : 'N/A'}
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <PieIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CHARTS GRID ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Smooth Gradient Area Chart: Revenue & Sales Trend */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Revenue & Order Trend
            </h3>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {currentPeriodLabel}
            </span>
          </div>

          {salesTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={salesTrendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: textColor }}
                  tickLine={false}
                  axisLine={{ stroke: gridColor }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: textColor }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366F1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue (৳)"
                />
                {salesTrendData[0]?.sales !== undefined && (
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    name="Sales Count"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart title="Sales Trend" icon={TrendingUp} />
          )}
        </div>

        {/* 2. Rounded Bar Chart: Paid Collection vs Due Balance */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Paid vs Due Collection
            </h3>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {currentPeriodLabel}
            </span>
          </div>

          {dueTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: textColor }}
                  tickLine={false}
                  axisLine={{ stroke: gridColor }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: textColor }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    fill: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                    rx: 8,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar
                  dataKey="paidAmount"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                  name="Paid Collected (৳)"
                />
                <Bar
                  dataKey="dueAmount"
                  fill="#F43F5E"
                  radius={[6, 6, 0, 0]}
                  name="Due Balance (৳)"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart title="Due Collection" icon={BarChart3} />
          )}
        </div>

        {/* 3. Donut Pie Chart: Stock by Brand with Center Indicator */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-violet-500" />
              Stock Brand Distribution
            </h3>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {summaryMetrics.totalBrandUnits} Units
            </span>
          </div>

          {brandDistribution.length > 0 ? (
            <div className="relative">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={brandDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {brandDistribution.map((_, i) => (
                      <Cell
                        key={i}
                        fill={BRAND_COLORS[i % BRAND_COLORS.length]}
                        stroke={isDark ? '#0F172A' : '#FFFFFF'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} units`, name]}
                    contentStyle={{
                      borderRadius: 12,
                      background: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                      color: isDark ? '#F8FAFC' : '#0F172A',
                      fontSize: 12,
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 5 }} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono leading-none">
                  {summaryMetrics.totalBrandUnits.toLocaleString()}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Total Units
                </div>
              </div>
            </div>
          ) : (
            <EmptyChart title="Stock Distribution" icon={PieIcon} />
          )}
        </div>
      </div>
    </div>
  );
}
