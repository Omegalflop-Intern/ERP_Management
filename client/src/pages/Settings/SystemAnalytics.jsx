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
} from 'lucide-react';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
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

function StatCard({ icon: Icon, label, value, sub, color = 'text-gray-900 dark:text-gray-100' }) {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
            {label}
          </div>
          <div className={`text-lg font-bold ${color} truncate`}>{value}</div>
          {sub && <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = 'bg-red-600' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function SystemAnalytics() {
  const { styled } = useTheme();

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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Shield className="w-16 h-16 text-gray-300 dark:text-gray-600" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Access Restricted</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            System Analytics is only available to the platform super administrator.
          </p>
        </div>
      </div>
    );
  }

  const cardCls = styled
    ? 'neu-card rounded-xl'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">System Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading system metrics...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4"
            >
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const s = data || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">System Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Server health, database metrics, and system resources
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Server Info */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
          <Server className="w-4 h-4" /> Server
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Clock}
            label="Uptime"
            value={formatUptime(s.server?.uptime || 0)}
            sub={`Since ${new Date(s.server?.startedAt).toLocaleString()}`}
            color="text-green-600 dark:text-green-400"
          />
          <StatCard
            icon={Server}
            label="Environment"
            value={s.server?.env || 'N/A'}
            sub={`${s.server?.nodeVersion} • ${s.server?.platform}/${s.server?.arch}`}
            color="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            icon={Server}
            label="Hostname"
            value={s.server?.hostname || 'N/A'}
            sub={`PID: ${s.server?.pid}`}
            color="text-purple-600 dark:text-purple-400"
          />
          <StatCard
            icon={Activity}
            label="API Response"
            value="< 200ms"
            sub="Rate limiter active"
            color="text-amber-600 dark:text-amber-400"
          />
        </div>
      </div>

      {/* Memory */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
          <MemoryStick className="w-4 h-4" /> Memory
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`${cardCls} p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                System Memory
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {s.memory?.usagePercent}%
              </span>
            </div>
            <ProgressBar
              value={s.memory?.used || 0}
              max={s.memory?.total || 1}
              color="bg-red-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Used: {formatBytes(s.memory?.used)}</span>
              <span>Total: {formatBytes(s.memory?.total)}</span>
            </div>
          </div>
          <div className={`${cardCls} p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Node.js Process Heap
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {s.memory?.processHeapTotal
                  ? Math.round((s.memory?.processHeapUsed / s.memory?.processHeapTotal) * 100)
                  : 0}
                %
              </span>
            </div>
            <ProgressBar
              value={s.memory?.processHeapUsed || 0}
              max={s.memory?.processHeapTotal || 1}
              color="bg-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Heap Used: {formatBytes(s.memory?.processHeapUsed)}</span>
              <span>Heap Total: {formatBytes(s.memory?.processHeapTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CPU */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
          <Cpu className="w-4 h-4" /> CPU
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Cpu}
            label="CPU Model"
            value={s.cpu?.cores + ' Cores'}
            sub={s.cpu?.model}
            color="text-indigo-600 dark:text-indigo-400"
          />
          <div className={`${cardCls} p-4 space-y-3`}>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Load Average
            </span>
            <div className="space-y-2">
              {[
                { label: '1 min', value: s.cpu?.loadAverage?.['1m'] },
                { label: '5 min', value: s.cpu?.loadAverage?.['5m'] },
                { label: '15 min', value: s.cpu?.loadAverage?.['15m'] },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{label}</span>
                  <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <StatCard
            icon={Cpu}
            label="Per Core Load"
            value={s.cpu?.loadAverage?.['1m'] || '0'}
            sub={`Across ${s.cpu?.cores || 0} cores`}
            color="text-cyan-600 dark:text-cyan-400"
          />
        </div>
      </div>

      {/* Database */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
          <Database className="w-4 h-4" /> MySQL / MariaDB Database
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Database}
            label="Database Tables"
            value={s.database?.collections || 0}
            sub="MySQL / MariaDB tables"
            color="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={Database}
            label="Total Records"
            value={(s.database?.documents || 0).toLocaleString()}
            sub="Active SQL rows"
            color="text-teal-600 dark:text-teal-400"
          />
          <StatCard
            icon={HardDrive}
            label="Data Size"
            value={formatBytes(s.database?.dataSize)}
            sub={`Index: ${formatBytes(s.database?.indexSize)}`}
            color="text-orange-600 dark:text-orange-400"
          />
          <StatCard
            icon={HardDrive}
            label="Total DB Storage"
            value={formatBytes(s.database?.storageSize)}
            sub={`Data + Index size`}
            color="text-rose-600 dark:text-rose-400"
          />
        </div>
      </div>

      {/* Table Breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
          <Database className="w-4 h-4" /> Table Storage Breakdown
        </h2>
        <div className={`${cardCls} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Table Name
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Rows
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Data Size
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Storage (Data + Index)
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-48">
                    Relative Size
                  </th>
                </tr>
              </thead>
              <tbody>
                {(s.collections || []).map((coll, idx) => {
                  const maxStorage = Math.max(
                    ...(s.collections || []).map((c) => c.storageSize || 0),
                    1
                  );
                  return (
                    <tr
                      key={coll.name ? `${coll.name}-${idx}` : `coll-${idx}`}
                      className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {coll.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300 font-mono">
                        {coll.count.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                        {formatBytes(coll.size)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {formatBytes(coll.storageSize)}
                      </td>
                      <td className="px-4 py-3">
                        <ProgressBar value={coll.storageSize} max={maxStorage} color="bg-blue-500" />
                      </td>
                    </tr>
                  );
                })}
                {(!s.collections || s.collections.length === 0) && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm"
                    >
                      No database table data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Storage & Uploads */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4" /> Storage Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            icon={Upload}
            label="Uploads Folder"
            value={formatBytes(s.uploads?.totalSize)}
            sub="Media, avatars, invoices & attachments"
            color="text-violet-600 dark:text-violet-400"
          />
          <StatCard
            icon={HardDrive}
            label="Total System Footprint"
            value={formatBytes((s.database?.storageSize || 0) + (s.uploads?.totalSize || 0))}
            sub="Database + Uploads storage combined"
            color="text-fuchsia-600 dark:text-fuchsia-400"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 pb-4">
        Auto-refreshes every 30 seconds • Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
