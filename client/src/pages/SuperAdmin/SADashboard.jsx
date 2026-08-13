import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CheckCircle2,
  PauseCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Calendar,
  Users,
  TrendingUp,
  CreditCard,
  LifeBuoy,
  DollarSign,
  ArrowUpRight,
  PlusCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { format, formatDistanceToNow } from 'date-fns';

const PLAN_COLORS = {
  FREE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  STARTER:
    'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
  PRO: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800/60',
  ENTERPRISE:
    'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
};

const STATUS_COLORS = {
  ACTIVE:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
  PAUSED:
    'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-800/60',
  PENDING_KYC:
    'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
};

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];

function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
            <TrendingUp className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {value}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
          {label}
        </div>
        {sub && (
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800 space-y-1.5">
        <p className="font-bold text-slate-300">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            style={{ color: entry.color }}
            className="font-semibold flex items-center justify-between gap-4"
          >
            <span>{entry.name}:</span>
            <span className="font-extrabold">{entry.value} shop(s)</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SADashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sa-stats'],
    queryFn: async () => {
      const res = await api.get('/tenants/stats');
      return res.data?.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading SaaS Executive Analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/60 rounded-2xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-red-700 dark:text-red-400">
          Failed to load platform analytics. Please verify super admin permissions.
        </p>
      </div>
    );
  }

  const { counts = {}, recentTenants = [], expiringSoonList = [], monthlyTrend = [] } = data || {};

  // Active vs Inactive shops monthly comparison trend from real database
  const shopStatusTrend =
    monthlyTrend.length > 0
      ? monthlyTrend
      : [{ month: 'Current', activeShops: counts.active || 0, inactiveShops: counts.paused || 0 }];

  // Plan distribution dataset calculated from database tenants
  const starterCount = recentTenants.filter((t) => t.plan === 'STARTER').length;
  const proCount = recentTenants.filter((t) => t.plan === 'PRO').length;
  const enterpriseCount = recentTenants.filter((t) => t.plan === 'ENTERPRISE').length;
  const freeCount = recentTenants.filter((t) => t.plan === 'FREE').length;

  const planDistributionRaw = [
    { name: 'Starter Plan', value: starterCount },
    { name: 'Pro Plan', value: proCount },
    { name: 'Enterprise', value: enterpriseCount },
    { name: 'Free Trial', value: freeCount },
  ].filter((p) => p.value > 0);

  const planDistribution =
    planDistributionRaw.length > 0
      ? planDistributionRaw
      : [
          { name: 'Active Shops', value: counts.active || 0 },
          { name: 'Inactive Shops', value: counts.paused || 0 },
        ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-600/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold text-blue-100 border border-white/10 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-300" /> Platform Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Platform Overview</h1>
          <p className="text-xs text-blue-100/90 mt-1 max-w-xl">
            Real-time multi-tenant monitoring, Active vs Inactive shop comparison, and onboarding
            analytics.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/super-admin/shops"
            className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Add New Shop
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Building2}
          label="Total Shops"
          value={counts.total ?? 0}
          trend="+12%"
          color="bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Active Shops"
          value={counts.active ?? 0}
          sub={`${counts.total ? Math.round((counts.active / counts.total) * 100) : 0}% active rate`}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
        />
        <StatCard
          icon={PauseCircle}
          label="Paused / Suspended"
          value={counts.paused ?? 0}
          sub="Inactive Shops"
          color="bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
        />
        <StatCard
          icon={Clock}
          label="Pending KYC"
          value={counts.pendingKyc ?? 0}
          color="bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
        />
        <StatCard
          icon={LifeBuoy}
          label="Active Tickets"
          value={counts.tickets || 0}
          sub="Platform support"
          color="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active vs Inactive Shops Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Active vs Inactive Shops Trend
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Monthly comparison showing operational Active Shops vs Paused / Inactive Shops
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
              Live Monitor
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={shopStatusTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorInactive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="activeShops"
                  name="Active Shops"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorActive)"
                />
                <Area
                  type="monotone"
                  dataKey="inactiveShops"
                  name="Inactive / Paused Shops"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorInactive)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Plan Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-purple-600" /> Plan Distribution
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Registered tenants grouped by subscription tiers
            </p>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            {planDistribution.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="text-slate-600 dark:text-slate-400 font-medium truncate">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expiring Soon & Recent Sign-ups Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiring Soon Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Expiring Soon ({counts.expiringSoon ?? 0})
            </span>
            <Link
              to="/super-admin/subscriptions"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {expiringSoonList.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl my-auto">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                All Accounts Active
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No subscriptions expiring within 30 days
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {expiringSoonList.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{t.shopName}</div>
                    <div className="text-[11px] text-slate-500">{t.email}</div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold border ${PLAN_COLORS[t.plan] || ''}`}
                    >
                      {t.plan}
                    </span>
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                      {t.expiresAt
                        ? formatDistanceToNow(new Date(t.expiresAt), { addSuffix: true })
                        : 'No expiry'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sign-ups Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> Recent Registered Shops
            </h2>
            <Link
              to="/super-admin/shops"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5"
            >
              Manage Shops <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {recentTenants.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-1.5 opacity-60" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                No shops registered yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="py-2.5 px-3">Shop</th>
                    <th className="py-2.5 px-3">Owner</th>
                    <th className="py-2.5 px-3">Plan</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recentTenants.map((t) => (
                    <tr
                      key={t._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {t.shopName?.[0]?.toUpperCase() || 'S'}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {t.shopName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                        {t.ownerName}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${PLAN_COLORS[t.plan] || ''}`}
                        >
                          {t.plan}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${STATUS_COLORS[t.status] || ''}`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-right">
                        <div className="flex items-center justify-end gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {t.createdAt ? format(new Date(t.createdAt), 'MMM d, yyyy') : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
