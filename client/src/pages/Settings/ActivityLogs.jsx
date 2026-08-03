import { useQuery } from '@tanstack/react-query';
import { AtSign, ClipboardList, Filter, Phone, Search, Shield, User } from 'lucide-react';
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';

const MODULE_COLORS = {
  auth: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  user: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  role: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  product: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  sale: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  purchase: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  customer: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  employee: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  accounting: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  repair: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  stock: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  settings: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  imei: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
  warranty: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  wholesale: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
  branch: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  notification: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  leave: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  attendance: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  catalog: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  payroll: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const ACTION_COLORS = {
  CREATE: 'text-green-600 dark:text-green-400',
  UPDATE: 'text-blue-600 dark:text-blue-400',
  DELETE: 'text-red-600 dark:text-red-400',
  LOGIN: 'text-purple-600 dark:text-purple-400',
  LOGOUT: 'text-orange-600 dark:text-orange-400',
  EXPORT: 'text-amber-600 dark:text-amber-400',
  IMPORT: 'text-teal-600 dark:text-teal-400',
  RETURN: 'text-rose-600 dark:text-rose-400',
};

function formatAction(action) {
  return (
    action
      ?.replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()) || '-'
  );
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function UserCell({ log }) {
  const fullName = log.fullName || log.userId?.fullName || '';
  const username = log.username || log.userId?.username || '';
  const roleName = log.roleName || log.userId?.roleName || '';
  const phone = log.phone || log.userId?.phone || '';
  const displayName = fullName || username || 'System';

  const roleColorMap = {
    ADMIN:
      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800',
    MANAGER:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    CASHIER:
      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800',
    TECHNICIAN:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  };

  const roleCls =
    roleColorMap[roleName?.toUpperCase()] ||
    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';

  return (
    <div className="flex items-center gap-3 min-w-[220px]">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
        {getInitials(displayName)}
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
            {displayName}
          </span>
          {roleName && (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none ${roleCls}`}
            >
              {roleName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
          {username && (
            <span className="flex items-center gap-0.5">
              <AtSign size={9} />
              {username}
            </span>
          )}
          {phone && (
            <span className="flex items-center gap-0.5">
              <Phone size={9} />
              {phone}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ActivityLogs() {
  const { styled } = useTheme();
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, moduleFilter],
    queryFn: async () => {
      const r = await api.get('/audit-logs', {
        params: { page, limit: 50, module: moduleFilter || undefined },
      });
      return r.data;
    },
  });

  const logs = data?.data || [];
  const pagination = data?.pagination || {};

  const filteredLogs = search
    ? logs.filter((log) => {
        const s = search.toLowerCase();
        return (
          (log.fullName || '').toLowerCase().includes(s) ||
          (log.username || '').toLowerCase().includes(s) ||
          (log.roleName || '').toLowerCase().includes(s) ||
          (log.phone || '').includes(s) ||
          (log.action || '').toLowerCase().includes(s) ||
          (log.module || '').toLowerCase().includes(s)
        );
      })
    : logs;

  const cardCls = styled
    ? 'neu-card'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800';
  const inputCls = styled
    ? 'neu-input w-full px-3 py-2.5 rounded-xl text-sm'
    : 'w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-[#2563EB] outline-none';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-red-600" /> Activity Logs
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track all system actions and changes
        </p>
      </div>

      <div
        className={`${cardCls} p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center`}
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-10`}
          />
        </div>
        <div className="relative max-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
            className={`${inputCls} pl-10`}
          >
            <option value="">All Modules</option>
            {[
              'auth',
              'user',
              'role',
              'product',
              'imei',
              'stock',
              'sale',
              'purchase',
              'customer',
              'employee',
              'accounting',
              'repair',
              'warranty',
              'settings',
              'wholesale',
              'branch',
              'catalog',
              'leave',
              'attendance',
              'payroll',
              'notification',
            ].map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={`${cardCls} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                Time
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                User
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                Action
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                Module
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400 animate-pulse">
                  Loading...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No activity logs found
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log._id}
                  className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString('en-BD', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">
                      {new Date(log.createdAt).toLocaleTimeString('en-BD', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <UserCell log={log} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold ${ACTION_COLORS[log.action] || 'text-gray-600 dark:text-gray-400'}`}
                    >
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${MODULE_COLORS[log.module] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                    >
                      {(log.module || '-').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="text-xs text-gray-500 dark:text-gray-400 max-w-[220px] truncate"
                      title={log.details ? JSON.stringify(log.details) : ''}
                    >
                      {log.details ? (
                        <span className="flex flex-wrap gap-1">
                          {Object.entries(log.details).map(([k, v]) => (
                            <span
                              key={k}
                              className="inline-flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[10px]"
                            >
                              <span className="text-gray-400">{k}:</span>
                              <span className="font-medium text-gray-600 dark:text-gray-300">
                                {String(v).slice(0, 30)}
                              </span>
                            </span>
                          ))}
                        </span>
                      ) : (
                        '-'
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
