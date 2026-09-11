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
  ArrowUpRight,
  PlusCircle,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  Sparkles,
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
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import { getBaseDomain } from '../../utils/subdomain';

const PLAN_BADGES = {
  FREE: 'bg-neutral-800 text-neutral-300 border-neutral-700',
  STARTER: 'bg-[#9CE700]/15 text-[#7dbb00] dark:text-[#9CE700] border-[#9CE700]/30',
  PRO: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800/60',
  ENTERPRISE: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
};

const STATUS_BADGES = {
  ACTIVE: 'bg-[#9CE700]/15 text-[#7dbb00] dark:text-[#9CE700] border-[#9CE700]/30',
  SUSPENDED: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-800/60',
  DELETED: 'bg-neutral-800 text-neutral-400 border-neutral-700',
};

const PIE_COLORS = ['#9CE700', '#8B5CF6', '#F59E0B', '#10B981'];

function ExecutiveStatCard({ icon: Icon, label, value, sub, colorClass, iconBg, trend }) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#0c0c0c] rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-5 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-[#9CE700]/30 dark:hover:border-[#9CE700]/30 transition-all duration-200 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${iconBg} shadow-sm transition-transform duration-200 group-hover:scale-105`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        {trend && (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#7dbb00] dark:text-[#9CE700] bg-[#9CE700]/10 px-2.5 py-1 rounded-full border border-[#9CE700]/30">
            <TrendingUp className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
          {value}
        </div>
        <div className="text-xs text-slate-500 dark:text-neutral-400 font-bold uppercase tracking-wider">
          {label}
        </div>
        {sub && (
          <div className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1 font-medium">
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
      <div className="bg-[#0c0c0c] text-white p-3.5 rounded-2xl shadow-2xl text-xs border border-neutral-800 space-y-2 min-w-[160px] z-50 backdrop-blur-md">
        {label && (
          <p className="font-extrabold text-neutral-300 pb-1.5 border-b border-neutral-800 text-[11px] uppercase tracking-wider">
            {label}
          </p>
        )}
        {payload.map((entry, index) => {
          const name = entry.name || entry.payload?.name || 'Item';
          return (
            <div key={index} className="flex items-center justify-between gap-4 font-semibold">
              <span className="flex items-center gap-2 text-neutral-300">
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-white/10"
                  style={{ backgroundColor: entry.color || entry.payload?.fill }}
                />
                {name}:
              </span>
              <span className="font-black text-white font-mono">{entry.value} shops</span>
            </div>
          );
        })}
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
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        {/* Executive Hero Banner Skeleton */}
        <div className="h-44 bg-white dark:bg-[#0c0c0c] rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-6 md:p-8" />

        {/* 4 KPI Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-white dark:bg-[#0c0c0c] rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-slate-100 dark:bg-neutral-800 rounded" />
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-neutral-800" />
              </div>
              <div className="h-7 w-16 bg-slate-100 dark:bg-neutral-800 rounded-lg" />
            </div>
          ))}
        </div>

        {/* 2 Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-white dark:bg-[#0c0c0c] rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-6" />
          <div className="h-80 bg-white dark:bg-[#0c0c0c] rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-6" />
        </div>

        {/* Recent Shops Table Skeleton */}
        <div className="h-64 bg-white dark:bg-[#0c0c0c] rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/60 rounded-3xl p-8 text-center max-w-xl mx-auto my-12 shadow-sm">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-black text-red-700 dark:text-red-400">Failed to load platform analytics</h3>
        <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
          Please verify your root administrative privileges or network connection.
        </p>
      </div>
    );
  }

  const { counts = {}, recentTenants = [], expiringSoonList = [], monthlyTrend = [] } = data || {};

  const shopStatusTrend =
    monthlyTrend.length > 0
      ? monthlyTrend
      : [{ month: 'Current', activeShops: counts.active || 0, inactiveShops: counts.paused || 0 }];

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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-[#0c0c0c] p-6 md:p-8 text-white shadow-2xl border border-slate-800 dark:border-neutral-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-80 h-80 bg-[#9CE700]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9CE700]/15 text-[11px] font-black uppercase tracking-wider text-[#9CE700] border border-[#9CE700]/30 mb-3">
              <Zap className="w-3.5 h-3.5 text-[#9CE700]" />
              <span>SaaS Platform Control</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
              Platform Command Center
            </h1>
            <p className="text-xs md:text-sm text-slate-400 dark:text-neutral-400 mt-1.5 font-medium leading-relaxed">
              Real-time multi-tenant monitoring, subscription life-cycles, tenant verification, and system health status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/super-admin/shops"
              className="px-5 py-2.5 bg-[#9CE700] text-black hover:bg-[#8bd000] rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-[#9CE700]/25 flex items-center gap-2 hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4 text-black" />
              <span>Add New Shop</span>
            </Link>
            <Link
              to="/super-admin/kyc"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all backdrop-blur-md flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#9CE700]" />
              <span>KYC Review</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <ExecutiveStatCard
          icon={Building2}
          label="Total Shops"
          value={counts.total ?? 0}
          trend="+12%"
          colorClass="text-[#7dbb00] dark:text-[#9CE700]"
          iconBg="bg-[#9CE700]/10"
        />
        <ExecutiveStatCard
          icon={CheckCircle2}
          label="Active Shops"
          value={counts.active ?? 0}
          sub={`${counts.total ? Math.round((counts.active / counts.total) * 100) : 0}% active rate`}
          colorClass="text-emerald-500"
          iconBg="bg-emerald-500/10"
        />
        <ExecutiveStatCard
          icon={PauseCircle}
          label="Suspended"
          value={counts.paused ?? 0}
          sub="Inactive Shops"
          colorClass="text-red-500"
          iconBg="bg-red-500/10"
        />
        <ExecutiveStatCard
          icon={Clock}
          label="Pending KYC"
          value={counts.pendingKyc ?? 0}
          sub="Requires review"
          colorClass="text-amber-500"
          iconBg="bg-amber-500/10"
        />
        <ExecutiveStatCard
          icon={LifeBuoy}
          label="Support Tickets"
          value={counts.tickets || 0}
          sub="Pending responses"
          colorClass="text-purple-400"
          iconBg="bg-purple-500/10"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active vs Inactive Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0c0c0c] rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#9CE700]" />
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Operational Tenant Trends
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 font-medium">
                Monthly comparison of active operational shops vs suspended tenants
              </p>
            </div>
            <span className="text-[11px] font-extrabold text-[#7dbb00] dark:text-[#9CE700] bg-[#9CE700]/10 px-3 py-1 rounded-full border border-[#9CE700]/30">
              Live Stream
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={shopStatusTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9CE700" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#9CE700" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorInactive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#666' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#666' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="activeShops"
                  name="Active Shops"
                  stroke="#9CE700"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorActive)"
                />
                <Area
                  type="monotone"
                  dataKey="inactiveShops"
                  name="Suspended Shops"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorInactive)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Plan Distribution Pie */}
        <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-[#9CE700]" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Plan Distribution
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
              Tenants categorized by subscription tiers
            </p>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
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

          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100 dark:border-neutral-800">
            {planDistribution.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="text-slate-600 dark:text-neutral-400 font-bold truncate">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expiring Soon & Recent Registered Shops Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiring Soon Card */}
        <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Expiring Soon ({counts.expiringSoon ?? 0})
              </h2>
            </div>
            <Link
              to="/super-admin/subscriptions"
              className="text-xs font-bold text-[#7dbb00] hover:underline dark:text-[#9CE700] flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {expiringSoonList.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl my-auto">
              <ShieldCheck className="w-9 h-9 text-[#9CE700] mx-auto mb-2 opacity-80" />
              <p className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                All Subscriptions Healthy
              </p>
              <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
                No accounts expiring within 30 days
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {expiringSoonList.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between text-xs p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/80 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200 truncate">{t.shopName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">{t.email}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${PLAN_BADGES[t.plan] || ''}`}
                    >
                      {t.plan}
                    </span>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold mt-1">
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

        {/* Recent Registered Shops Table */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0c0c0c] rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#9CE700]" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Registered Tenants
              </h2>
            </div>
            <Link
              to="/super-admin/shops"
              className="text-xs font-bold text-[#7dbb00] hover:underline dark:text-[#9CE700] flex items-center gap-1"
            >
              All Shops <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTenants.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl">
              <Building2 className="w-9 h-9 text-slate-400 dark:text-neutral-500 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-bold text-slate-600 dark:text-neutral-300">
                No shops registered yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-wider border-b border-slate-100 dark:border-neutral-800">
                    <th className="py-3 px-3">Shop</th>
                    <th className="py-3 px-3">Owner</th>
                    <th className="py-3 px-3">Plan</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                  {recentTenants.map((t) => (
                    <tr
                      key={t._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/60 transition-colors"
                    >
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#9CE700]/15 text-[#9CE700] border border-[#9CE700]/30 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                            {t.shopName?.[0]?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {t.shopName}
                            </span>
                            <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">
                              {t.customDomain || (t.subdomain ? `${t.subdomain}.${getBaseDomain()}` : getBaseDomain())}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-neutral-300 font-semibold">
                        {t.ownerName}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${PLAN_BADGES[t.plan] || ''}`}
                        >
                          {t.plan}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${STATUS_BADGES[t.status] || ''}`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-semibold text-slate-500 dark:text-neutral-400">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
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
