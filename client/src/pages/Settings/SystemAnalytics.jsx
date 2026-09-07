import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Clock,
  Cpu,
  Database,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Server,
  Shield,
  Upload,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import React from 'react';
import api from '../../lib/api';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function StatCard({ icon: Icon, label, value, sub, iconBg = 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3.5">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {label}
          </div>
          <div className="text-base font-black text-slate-900 dark:text-white truncate mt-0.5">
            {value}
          </div>
          {sub && <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = 'bg-blue-600' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function SystemAnalytics() {
  const { data, isLoading, refetch, isFetching, error } = useQuery({
    queryKey: ['system-analytics'],
    queryFn: async () => {
      const { data } = await api.get('/system/analytics');
      return data.data;
    },
    refetchInterval: 30000,
    retry: false,
  });

  if (error?.response?.status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-10 max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Shield className="w-8 h-8" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Access Restricted</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            System Analytics is strictly reserved for the root platform super administrator.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 space-y-3"
            >
              <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-7 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const s = data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Platform System Analytics
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live server telemetry, MariaDB / MySQL cluster metrics, process memory & storage
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-600' : ''}`} /> Refresh Telemetry
        </button>
      </div>

      {/* Server Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Server className="w-4 h-4 text-blue-500" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Node.js Runtime & Host Telemetry
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Clock}
            label="Server Uptime"
            value={formatUptime(s.server?.uptime || 0)}
            sub={`Started ${s.server?.startedAt ? new Date(s.server?.startedAt).toLocaleTimeString() : 'N/A'}`}
            iconBg="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={Server}
            label="Environment"
            value={s.server?.env?.toUpperCase() || 'DEVELOPMENT'}
            sub={`Node ${s.server?.nodeVersion} • ${s.server?.platform}/${s.server?.arch}`}
            iconBg="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            icon={Layers}
            label="Process Hostname"
            value={s.server?.hostname || 'localhost'}
            sub={`Worker PID: ${s.server?.pid}`}
            iconBg="bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
          />
          <StatCard
            icon={Activity}
            label="API Latency SLA"
            value="< 120ms"
            sub="Global rate limiting active"
            iconBg="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
          />
        </div>
      </div>

      {/* Memory & CPU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <MemoryStick className="w-4 h-4 text-purple-500" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Memory Utilization
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
              {s.memory?.usagePercent}% System RAM
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Total Host Memory</span>
                <span className="font-mono text-slate-500">{formatBytes(s.memory?.used)} / {formatBytes(s.memory?.total)}</span>
              </div>
              <ProgressBar
                value={s.memory?.used || 0}
                max={s.memory?.total || 1}
                color="bg-purple-600"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">V8 Node Process Heap</span>
                <span className="font-mono text-slate-500">{formatBytes(s.memory?.processHeapUsed)} / {formatBytes(s.memory?.processHeapTotal)}</span>
              </div>
              <ProgressBar
                value={s.memory?.processHeapUsed || 0}
                max={s.memory?.processHeapTotal || 1}
                color="bg-blue-600"
              />
            </div>
          </div>
        </div>

        {/* CPU */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                CPU Performance & Cores
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {s.cpu?.cores || 1} Active Cores
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <span className="font-bold text-slate-700 dark:text-slate-300">Processor Model</span>
              <span className="font-mono text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{s.cpu?.model || 'Generic CPU'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '1 min load', value: s.cpu?.loadAverage?.['1m'] || '0.00' },
                { label: '5 min load', value: s.cpu?.loadAverage?.['5m'] || '0.00' },
                { label: '15 min load', value: s.cpu?.loadAverage?.['15m'] || '0.00' },
              ].map(({ label, value }) => (
                <div key={label} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{label}</div>
                  <div className="text-xs font-mono font-black text-slate-900 dark:text-white mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Database Cluster Overview */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Database className="w-4 h-4 text-emerald-500" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            MariaDB / MySQL Storage & Row Telemetry
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Database}
            label="Database Tables"
            value={s.database?.collections || 0}
            sub="Active relational tables"
            iconBg="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={Layers}
            label="Total Database Rows"
            value={(s.database?.documents || 0).toLocaleString()}
            sub="Indexed system records"
            iconBg="bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400"
          />
          <StatCard
            icon={HardDrive}
            label="Data Size"
            value={formatBytes(s.database?.dataSize)}
            sub={`Index footprint: ${formatBytes(s.database?.indexSize)}`}
            iconBg="bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400"
          />
          <StatCard
            icon={Upload}
            label="Uploads Storage"
            value={formatBytes(s.uploads?.totalSize)}
            sub="Invoices, vaults & assets"
            iconBg="bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400"
          />
        </div>
      </div>

      {/* Table Storage Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Table Storage Distribution
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {(s.collections || []).length} tables measured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="text-left px-6 py-3.5">Table Name</th>
                <th className="text-right px-6 py-3.5">Total Rows</th>
                <th className="text-right px-6 py-3.5">Data Size</th>
                <th className="text-right px-6 py-3.5">Storage Footprint</th>
                <th className="text-left px-6 py-3.5 w-52">Relative Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {(s.collections || []).map((coll, idx) => {
                const maxStorage = Math.max(
                  ...(s.collections || []).map((c) => c.storageSize || 0),
                  1
                );
                return (
                  <tr
                    key={coll.name ? `${coll.name}-${idx}` : `coll-${idx}`}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white font-mono">
                      {coll.name}
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-600 dark:text-slate-300 font-mono font-semibold">
                      {coll.count.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-600 dark:text-slate-300 font-mono">
                      {formatBytes(coll.size)}
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-900 dark:text-white font-mono font-bold">
                      {formatBytes(coll.storageSize)}
                    </td>
                    <td className="px-6 py-3.5">
                      <ProgressBar value={coll.storageSize} max={maxStorage} color="bg-blue-600" />
                    </td>
                  </tr>
                );
              })}
              {(!s.collections || s.collections.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-400 text-xs font-semibold"
                  >
                    No database table telemetry available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 pb-4">
        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
        Auto-refreshes every 30 seconds • Last synced at {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
