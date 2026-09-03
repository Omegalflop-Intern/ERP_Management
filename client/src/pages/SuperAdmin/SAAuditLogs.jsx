import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Shield,
  User,
  Building2,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import DatePicker from '../../components/ui/DatePicker';
import api from '../../lib/api';

const ACTION_COLORS = {
  CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LOGIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  LOGIN_FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LOGOUT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  EXPORT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  IMPORT: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  UPLOAD_IMAGE: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  SEED_ACCOUNTS: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  SYNC_JOURNALS: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  UPDATE_STATUS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  VERIFY_KYC: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  TOGGLE_ACTIVE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  UPDATE_PLATFORM_SETTINGS: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  EXPORT_BACKUP: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  RESTORE_BACKUP: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  MANUAL_BACKUP: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

const MODULE_LABELS = {
  'super-admin': 'Super Admins',
  tenant: 'Shops & Tenants',
  user: 'Users & Staff',
  role: 'Roles & Permissions',
  product: 'Products & Inventory',
  sale: 'Sales & POS',
  customer: 'Customers',
  supplier: 'Suppliers',
  purchase: 'Purchases',
  accounting: 'Accounting',
  employee: 'Employees',
  attendance: 'Attendance',
  payroll: 'Payroll',
  settings: 'Platform Settings',
  plans: 'Subscription Plans',
  warranty: 'Warranties',
  repair: 'Repairs',
  stock: 'Stock',
  expense: 'Expenses',
  wholesale: 'Wholesale',
  notification: 'Notifications',
  security: 'Security & Auth',
  catalog: 'Catalog',
  investor: 'Investors',
  loan: 'Loans',
};

export default function SAAuditLogs() {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [filters, setFilters] = useState({
    search: '',
    module: '',
    action: '',
    from: '',
    to: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const queryParams = new URLSearchParams();
  if (page) queryParams.set('page', page);
  if (limit) queryParams.set('limit', limit);
  if (filters.module) queryParams.set('module', filters.module);
  if (filters.action) queryParams.set('action', filters.action);
  if (filters.from) queryParams.set('from', filters.from);
  if (filters.to) queryParams.set('to', filters.to);

  const { data, isLoading } = useQuery({
    queryKey: ['sa-audit-logs', page, filters],
    queryFn: async () => {
      const res = await api.get(`/super-admin/audit-logs?${queryParams.toString()}`);
      return res.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['sa-audit-stats'],
    queryFn: async () => {
      const res = await api.get('/super-admin/audit-logs/stats');
      return res.data?.data;
    },
  });

  const logs = data?.data || [];
  const pagination = data?.pagination || {};

  const filteredLogs = logs.filter((log) => {
    if (!filters.search) return true;
    const s = filters.search.toLowerCase();
    return (
      log.username?.toLowerCase().includes(s) ||
      log.fullName?.toLowerCase().includes(s) ||
      log.action?.toLowerCase().includes(s) ||
      log.module?.toLowerCase().includes(s) ||
      log.tenantId?.shopName?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track all user activity across all shops — who did what, when, and where
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Logs</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.totalLogs?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.todayLogs?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">This Week</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.weekLogs?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <User className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Login Events</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.loginAttempts?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, action, shop..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Module
              </label>
              <select
                value={filters.module}
                onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <option value="">All Modules</option>
                {Object.entries(MODULE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Action
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGIN_FAILED">Login Failed</option>
                <option value="LOGOUT">Logout</option>
                <option value="EXPORT">Export</option>
                <option value="IMPORT">Import</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Date Range
              </label>
              <div className="flex gap-2">
                <DatePicker
                  value={filters.from}
                  onChange={(dateStr) => setFilters({ ...filters, from: dateStr })}
                  placeholder="From Date"
                  className="flex-1 !rounded-lg text-xs"
                />
                <DatePicker
                  value={filters.to}
                  onChange={(dateStr) => setFilters({ ...filters, to: dateStr })}
                  placeholder="To Date"
                  className="flex-1 !rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400">
            <Activity className="w-12 h-12 mb-3 opacity-50" />
            <p className="font-medium">No audit logs found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Timestamp
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    User
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Shop
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Action
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Module
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Details
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log._id}
                    className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {log.username || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.roleName || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {log.tenantId?.shopName ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {log.tenantId.shopName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
                          Platform
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">
                      {MODULE_LABELS[log.module] || log.module || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                      {log.entityType ? `${log.entityType}` : '—'}
                      {log.details?.name ? `: ${log.details.name}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total.toLocaleString()} logs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page >= pagination.totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
