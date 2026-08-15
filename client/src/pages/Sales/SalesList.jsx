import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Eye,
  Filter,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DatePicker from '../../components/ui/DatePicker';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import EmptyState from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import PageHeader from '../../components/layout/PageHeader';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';
import EditSaleModal from './EditSaleModal';

export default function SalesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [saleTypeFilter, setSaleTypeFilter] = useState('');
  const [editSaleId, setEditSaleId] = useState(null);
  const [collectSaleModal, setCollectSaleModal] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sales', search, dateFrom, dateTo, paymentFilter, saleTypeFilter],
    queryFn: async () => {
      const params = { limit: 100 };
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
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const sales = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales & Transactions"
        subtitle="Manage customer invoices, track dues, record payments, and issue return receipts."
        icon={Receipt}
        breadcrumbs={['Sales & Orders', 'Sales History']}
        actions={
          <Button
            onClick={() => navigate('/sales/new')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md px-4 py-2"
          >
            <Plus className="w-4 h-4" /> New Sale (POS)
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice, customer..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#2563EB]"
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
          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#2563EB]"
        >
          <option value="">All Sale Types</option>
          <option value="RETAIL">Retail (B2C)</option>
          <option value="WHOLESALE">Wholesale (B2B)</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#2563EB]"
        >
          <option value="">All Payments</option>
          <option value="cash">Cash</option>
          <option value="bkash">bKash</option>
          <option value="rocket">Rocket</option>
          <option value="nagad">Nagad</option>
          <option value="bank">Bank/Card</option>
          <option value="due">Due Pending</option>
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
                  const dueAmt = Number(s.paymentBreakdown?.dueAmount || 0);
                  const isWholesale =
                    s.saleType === 'WHOLESALE' || s.customerId?.customerType === 'B2B';
                  return (
                    <tr
                      key={s._id || s.id}
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
                        {dueAmt > 0 ? (
                          <button
                            type="button"
                            onClick={() => setCollectSaleModal(s)}
                            className="inline-flex items-center gap-1 font-mono font-bold text-rose-600 dark:text-rose-400 hover:underline bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800"
                            title="Click to Collect Due"
                          >
                            ৳{dueAmt.toLocaleString()}
                          </button>
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
                        <div className="flex items-center justify-end gap-1.5">
                          {dueAmt > 0 && (
                            <button
                              type="button"
                              onClick={() => setCollectSaleModal(s)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors text-xs font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                              title="Collect Due"
                            >
                              <DollarSign className="w-3.5 h-3.5" /> Collect
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditSaleId(s._id || s.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 transition-colors"
                            title="Edit Sale Details"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/sales/${s._id || s.id}`)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors"
                            title="View Invoice & Issue Returns"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              confirmDelete(
                                `Delete sale #${s.invoiceNumber}?`,
                                () => deleteMutation.mutate(s._id || s.id),
                                'Stock and customer balances will be restored.'
                              );
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete / Void Sale"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {editSaleId && (
        <EditSaleModal
          saleId={editSaleId}
          onClose={() => setEditSaleId(null)}
          onSuccess={() => setEditSaleId(null)}
        />
      )}

      {/* Collect Due Payment Modal directly on Sales List */}
      {collectSaleModal && (
        <SaleCollectDueModal
          sale={collectSaleModal}
          onClose={() => setCollectSaleModal(null)}
          onSuccess={() => {
            setCollectSaleModal(null);
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customer-history'] });
            queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// MODAL: COLLECT DUE PAYMENT DIRECTLY FROM SALES LIST
// ----------------------------------------------------------------------
function SaleCollectDueModal({ sale, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const dueAmount = Number(sale.paymentBreakdown?.dueAmount || 0);

  const mutation = useMutation({
    mutationFn: async () => {
      let collectAmount = amount === '' ? dueAmount : Number(amount);
      if (isNaN(collectAmount) || collectAmount <= 0) {
        throw new Error('Please enter a valid payment amount');
      }
      if (collectAmount > dueAmount) {
        collectAmount = dueAmount;
      }

      const custId = typeof sale.customerId === 'object' ? (sale.customerId?._id || sale.customerId?.id) : sale.customerId;

      // If customer profile is attached, collect via customer due endpoint to sync customer ledger
      if (custId) {
        return api.post(`/customers/${custId}/collect-due`, {
          amount: collectAmount,
          paymentMethod: method,
        });
      }

      // Otherwise update invoice payment breakdown directly
      const updatedBreakdown = { ...(sale.paymentBreakdown || {}) };
      const m = (method || 'cash').toLowerCase();
      updatedBreakdown[m] = (Number(updatedBreakdown[m]) || 0) + collectAmount;
      updatedBreakdown.dueAmount = Math.max(0, dueAmount - collectAmount);

      const targetSaleId = sale.id || sale._id;
      return api.put(`/sales/${targetSaleId}`, { paymentBreakdown: updatedBreakdown });
    },
    onSuccess: () => {
      toast.success('Due payment collected and recorded successfully!');
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || e.message || 'Failed to collect payment'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[94vw] rounded-3xl p-0 border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-[#0f172a]">
        <div className="p-5 px-6 pr-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Collect Due — {sale.invoiceNumber}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Record customer payment against invoice.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Customer:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ''}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-2">
              <span className="text-rose-600 font-bold uppercase text-[10px]">Invoice Due Pending:</span>
              <span className="text-base font-black font-mono text-rose-600">
                ৳{dueAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Amount to Collect (৳) *
            </Label>
            <Input
              type="number"
              min="1"
              max={dueAmount}
              placeholder={`Max: ${dueAmount}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 rounded-xl mt-1.5 bg-slate-50 dark:bg-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Leave blank to clear full due of ৳{dueAmount.toLocaleString()}
            </p>
          </div>

          <div>
            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Payment Method
            </Label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full mt-1.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="cash">Cash in Hand</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
              <option value="bank">Bank / Card</option>
            </select>
          </div>

          <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 px-5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {mutation.isPending ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
