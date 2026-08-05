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
  TrendingDown,
} from 'lucide-react';
import api from '../../lib/api';
import { format, formatDistanceToNow } from 'date-fns';

const PLAN_COLORS = {
  FREE: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  STARTER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  PRO: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  ENTERPRISE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
};

const STATUS_COLORS = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  PAUSED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  PENDING_KYC: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-700 dark:text-red-400">Failed to load dashboard stats. Make sure you have super admin access.</p>
      </div>
    );
  }

  const { counts = {}, recentTenants = [], expiringSoonList = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-500" />
          SaaS Overview
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Real-time snapshot of all registered shops and platform metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Total Shops"
          value={counts.total ?? 0}
          color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Active Shops"
          value={counts.active ?? 0}
          sub={`${counts.total ? Math.round((counts.active / counts.total) * 100) : 0}% of total`}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
        />
        <StatCard
          icon={PauseCircle}
          label="Paused / Suspended"
          value={counts.paused ?? 0}
          color="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
        />
        <StatCard
          icon={Clock}
          label="Pending KYC"
          value={counts.pendingKyc ?? 0}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
        />
      </div>

      {/* Expiring Soon */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Expiring Soon ({counts.expiringSoon ?? 0})
          </span>
        </div>
        {expiringSoonList.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No subscriptions expiring within 30 days 🎉</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {expiringSoonList.map((t) => (
              <div key={t._id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{t.shopName}</div>
                  <div className="text-slate-500">{t.email}</div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${PLAN_COLORS[t.plan] || ''}`}>{t.plan}</span>
                  <div className="text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                    {t.expiresAt ? formatDistanceToNow(new Date(t.expiresAt), { addSuffix: true }) : 'No expiry'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Sign-ups */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Recent Sign-ups</h2>
        </div>
        {recentTenants.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No shops registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-2 font-semibold">Shop</th>
                  <th className="pb-2 font-semibold">Owner</th>
                  <th className="pb-2 font-semibold">Plan</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTenants.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">{t.shopName}</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400">{t.ownerName}</td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${PLAN_COLORS[t.plan] || ''}`}>{t.plan}</span>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[t.status] || ''}`}>{t.status}</span>
                    </td>
                    <td className="py-2.5 text-slate-500 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Calendar className="w-3 h-3" />
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
  );
}
