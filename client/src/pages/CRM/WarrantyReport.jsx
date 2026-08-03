import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';

const REPORT_TYPES = [
  {
    key: 'active',
    label: 'Active Warranties',
    icon: ShieldCheck,
    color: 'text-green-600 dark:text-green-400',
  },
  {
    key: 'expiring',
    label: 'Expiring Soon (30 days)',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
  },
  {
    key: 'expired',
    label: 'Expired',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
  },
  { key: 'all', label: 'All Warranties', icon: Package, color: 'text-blue-600 dark:text-blue-400' },
];

export default function WarrantyReport() {
  const [reportType, setReportType] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Sold');
  const { styled } = useTheme();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['warranty-report', reportType, search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/warranties/report', {
        params: { type: reportType, search, status: statusFilter },
      });
      return res.data?.data;
    },
  });

  const units = data?.units || [];
  const summary = data?.summary || {};
  const cardClass = styled
    ? 'neu-card p-4'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Warranty Report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track IMEI warranty status and remaining days for sold products
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Sold Units',
            value: summary.totalSoldUnits || 0,
            color: 'text-blue-600 dark:text-blue-400',
            icon: Package,
          },
          {
            label: 'Active Warranties',
            value: summary.totalActiveSold || 0,
            color: 'text-green-600 dark:text-green-400',
            icon: ShieldCheck,
          },
          {
            label: 'Expiring Soon (30d)',
            value: summary.totalExpiringSoon || 0,
            color: 'text-amber-600 dark:text-amber-400',
            icon: Clock,
          },
          {
            label: 'Expired Warranties',
            value: summary.totalExpiredSold || 0,
            color: 'text-red-600 dark:text-red-400',
            icon: AlertTriangle,
          },
        ].map((s) => (
          <div key={s.label} className={cardClass}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {s.label}
              </span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>
              {isLoading ? (
                <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                s.value
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Controls */}
      <div className={cardClass}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Report Type Tabs */}
          <div className="flex flex-wrap gap-2">
            {REPORT_TYPES.map((rt) => (
              <button
                key={rt.key}
                onClick={() => setReportType(rt.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  reportType === rt.key
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <rt.icon className="w-3.5 h-3.5" />
                {rt.label}
              </button>
            ))}
          </div>

          {/* Search & Status Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search IMEI, customer, invoice..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:border-[#2563EB] text-gray-900 dark:text-gray-100"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:border-[#2563EB] text-gray-900 dark:text-gray-100 font-medium"
            >
              <option value="Sold">Sold Products Only</option>
              <option value="Available">Available Inventory</option>
              <option value="ALL">All Unit Statuses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Warranty Table */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {REPORT_TYPES.find((r) => r.key === reportType)?.label} ({units.length} items)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left bg-gray-50/50 dark:bg-gray-900/50">
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Product
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  IMEI / Serial
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Customer & Contact
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                  Invoice #
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">
                  Sale Date
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Warranty Expiry
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Remaining & Status
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-red-600" />
                    <span>Loading warranty report...</span>
                  </td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                    No warranty records match the selected filters
                  </td>
                </tr>
              ) : (
                units.map((u) => {
                  const expiry = u.warrantyExpiry ? new Date(u.warrantyExpiry) : null;
                  const soldDate = u.soldAt ? new Date(u.soldAt) : null;
                  const now = new Date();
                  const isExpired = expiry && expiry < now;
                  const daysLeft =
                    u.daysLeft !== undefined && u.daysLeft !== null
                      ? u.daysLeft
                      : expiry
                        ? Math.ceil((expiry - now) / 86400000)
                        : null;

                  return (
                    <tr
                      key={u._id}
                      className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {u.productId?.name || 'Unknown Product'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {u.productId?.brand || 'N/A'} {u.ram && `• ${u.ram}/${u.storage}`}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                          {u.imeiOrSerial}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {u.customerName}
                          </span>
                        </div>
                        {u.customerPhone && u.customerPhone !== 'N/A' && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 pl-5">
                            {u.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {u.soldInvoiceNumber ? (
                          <div className="flex items-center gap-1 text-xs font-mono text-blue-600 dark:text-blue-400">
                            <FileText className="w-3.5 h-3.5" />
                            {u.soldInvoiceNumber}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 hidden md:table-cell">
                        {soldDate
                          ? soldDate.toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {expiry ? (
                          <div>
                            <div className="flex items-center gap-1 text-xs font-medium text-gray-900 dark:text-gray-100">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {expiry.toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 pl-4.5">
                              ({u.warrantyMonths || 12} months warranty)
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No Expiry Set</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                            <AlertTriangle className="w-3 h-3" />
                            Expired ({Math.abs(daysLeft || 0)}d ago)
                          </span>
                        ) : daysLeft !== null && daysLeft <= 30 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3 animate-pulse" />
                            Expiring in {daysLeft}d
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                            <CheckCircle2 className="w-3 h-3" />
                            {daysLeft !== null ? `${daysLeft} days remaining` : 'Active'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
