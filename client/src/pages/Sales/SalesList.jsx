import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Eye, Filter, Plus, Receipt, Search, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DatePicker from '../../components/ui/DatePicker';
import api from '../../lib/api';

import PageHeader from '../../components/layout/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

export default function SalesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [saleTypeFilter, setSaleTypeFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sales', search, dateFrom, dateTo, paymentFilter, saleTypeFilter],
    queryFn: async () => {
      const params = { limit: 50 };
      if (search) params.customer = search;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (paymentFilter) params.paymentMethod = paymentFilter;
      if (saleTypeFilter) params.saleType = saleTypeFilter;
      const res = await api.get('/sales', { params });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/sales/${id}`),
    onSuccess: () => {
      toast.success('Sale deleted');
      queryClient.invalidateQueries(['sales']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const sales = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales & Transactions"
        subtitle="Manage customer invoices, view payment statuses, and issue return receipts."
        icon={Receipt}
        breadcrumbs={['Sales & Orders', 'Sales History']}
        actions={
          <button
            onClick={() => navigate('/sales/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" /> New Sale (POS)
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From Date" />
          <span className="text-gray-400">—</span>
          <DatePicker value={dateTo} onChange={setDateTo} placeholder="To Date" />
        </div>
        <select
          value={saleTypeFilter}
          onChange={(e) => setSaleTypeFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
        >
          <option value="">All Sale Types</option>
          <option value="RETAIL">Retail (B2C)</option>
          <option value="WHOLESALE">Wholesale (B2B)</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
        >
          <option value="">All Payments</option>
          <option value="cash">Cash</option>
          <option value="bkash">bKash</option>
          <option value="rocket">Rocket</option>
          <option value="nagad">Nagad</option>
          <option value="bank">Bank/Card</option>
          <option value="due">Due</option>
        </select>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Invoice
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Items
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Total
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Paid
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Due
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Payment
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50">
                    {Array.from({ length: 11 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-0">
                    <EmptyState
                      icon={Receipt}
                      title="No sales invoices found"
                      description="No transactions match your search or date criteria. Try adjusting filters or create a new sale."
                      actionLabel="Create New Sale"
                      onAction={() => navigate('/sales/new')}
                    />
                  </td>
                </tr>
              ) : (
                sales.map((s) => {
                  const rawPaid =
                    (s.paymentBreakdown?.cash || 0) +
                    (s.paymentBreakdown?.bkash || 0) +
                    (s.paymentBreakdown?.rocket || 0) +
                    (s.paymentBreakdown?.nagad || 0) +
                    (s.paymentBreakdown?.bank || 0);
                  const netPaid = Math.max(0, rawPaid - (s.returnedAmount || 0));
                  const isWholesale =
                    s.saleType === 'WHOLESALE' || s.customerId?.customerType === 'B2B';
                  return (
                    <tr
                      key={s._id}
                      className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                          {s.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                            isWholesale
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {isWholesale ? 'Wholesale (B2B)' : 'Retail (B2C)'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {s.status === 'RETURNED' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            Returned
                          </span>
                        ) : s.status === 'PARTIALLY_RETURNED' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Partial Ret.
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {s.customerName}
                        </div>
                        <div className="text-xs text-gray-500">{s.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {s.lineItems?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                        <div>৳{s.netTotal?.toLocaleString()}</div>
                        {(s.returnedAmount > 0 || s.returnLogs?.length > 0) && (
                          <div
                            className="text-[10px] text-red-600 dark:text-red-400 font-bold mt-0.5"
                            title="Refunded amount & item returns"
                          >
                            ↩ Ref: ৳{(s.returnedAmount || 0).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                          ৳{netPaid.toLocaleString()}
                        </div>
                        {s.returnedAmount > 0 && (
                          <div className="text-[9px] text-gray-400 line-through">
                            Rec'd: ৳{rawPaid.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {s.paymentBreakdown?.dueAmount > 0 ? (
                          <span className="text-red-600 dark:text-red-400">
                            ৳{s.paymentBreakdown.dueAmount?.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {s.paymentBreakdown?.cash > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                              Cash
                            </span>
                          )}
                          {s.paymentBreakdown?.bkash > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400">
                              bKash
                            </span>
                          )}
                          {s.paymentBreakdown?.rocket > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                              Rocket
                            </span>
                          )}
                          {s.paymentBreakdown?.nagad > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
                              Nagad
                            </span>
                          )}
                          {s.paymentBreakdown?.bank > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                              Bank
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(s.createdAt).toLocaleDateString('en-BD')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/sales/${s._id}`)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600 transition-colors"
                            title="View / Print / Return"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {data?.pagination && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
            Showing {sales.length} of {data.pagination.total} sales
          </div>
        )}
      </div>
    </div>
  );
}
