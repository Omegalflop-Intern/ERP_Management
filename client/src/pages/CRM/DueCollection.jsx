import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  DollarSign,
  Eye,
  FileText,
  Loader2,
  Phone,
  Receipt,
  RefreshCw,
  Search,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PageHeader from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import EmptyState from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import api from '../../lib/api';

export default function DueCollection() {
  const [search, setSearch] = useState('');
  const [collectModal, setCollectModal] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sales', 'due'],
    queryFn: async () => {
      const res = await api.get('/sales', { params: { limit: 300 } });
      return res.data?.data || [];
    },
  });

  const { data: customerStats } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/customers/stats');
        return res.data?.data;
      } catch {
        return null;
      }
    },
  });

  const salesWithDue = useMemo(() => {
    return (data || []).filter((s) => Number(s.paymentBreakdown?.dueAmount || 0) > 0);
  }, [data]);

  const filteredSales = useMemo(() => {
    if (!search.trim()) return salesWithDue;
    const term = search.toLowerCase().trim();
    return salesWithDue.filter(
      (s) =>
        s.customerName?.toLowerCase().includes(term) ||
        s.customerPhone?.includes(term) ||
        s.invoiceNumber?.toLowerCase().includes(term)
    );
  }, [salesWithDue, search]);

  const totalDue = useMemo(() => {
    return salesWithDue.reduce((sum, s) => sum + (Number(s.paymentBreakdown?.dueAmount) || 0), 0);
  }, [salesWithDue]);

  const uniqueCustomersWithDue = useMemo(() => {
    return new Set(salesWithDue.map((s) => s.customerPhone || s.customerName).filter(Boolean)).size;
  }, [salesWithDue]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Due Collection"
        subtitle="Track outstanding customer balances, record payments, and synchronize customer ledger."
        icon={DollarSign}
        breadcrumbs={['Customers & Dues', 'Due Collection']}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Dues
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Outstanding Due
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
            ৳{totalDue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Pending from customer invoices
          </div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Customers with Due
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {uniqueCustomersWithDue}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Distinct customer profiles
          </div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Invoices with Due
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
            {salesWithDue.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Unpaid / partially paid invoices
          </div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by customer name, phone, or invoice #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-all shadow-xs"
        />
      </div>

      {/* Dues Table Container */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/40 text-slate-500 font-bold uppercase text-[10px]">
                <th className="text-left px-5 py-3">Invoice #</th>
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-right px-5 py-3">Invoice Total</th>
                <th className="text-right px-5 py-3">Paid Amount</th>
                <th className="text-right px-5 py-3">Due Balance</th>
                <th className="text-left px-5 py-3">Invoice Date</th>
                <th className="text-right px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500/60" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No Pending Dues Found
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      All customer invoices have been fully paid and reconciled!
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const paid =
                    (s.paymentBreakdown?.cash || 0) +
                    (s.paymentBreakdown?.bkash || 0) +
                    (s.paymentBreakdown?.rocket || 0) +
                    (s.paymentBreakdown?.nagad || 0) +
                    (s.paymentBreakdown?.bank || 0);

                  const due = Number(s.paymentBreakdown?.dueAmount || 0);
                  const custId =
                    typeof s.customerId === 'object'
                      ? s.customerId?._id || s.customerId?.id
                      : s.customerId;

                  return (
                    <tr
                      key={s._id || s.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/sales/${s._id || s.id}`}
                          className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {s.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{s.customerName || 'Walk-in Customer'}</span>
                          {custId && (
                            <Link
                              to={`/customers/${custId}`}
                              className="text-[10px] text-blue-500 hover:underline inline-flex items-center"
                              title="View Customer Profile"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                        {s.customerPhone && (
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {s.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                        ৳{Number(s.netTotal || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        ৳{paid.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        ৳{due.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                        {new Date(s.createdAt).toLocaleDateString('en-BD')}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          size="sm"
                          onClick={() => setCollectModal(s)}
                          className="h-7 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Collect Due
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Due Payment Modal */}
      {collectModal && (
        <CollectDueModal
          sale={collectModal}
          onClose={() => setCollectModal(null)}
          onSuccess={() => {
            setCollectModal(null);
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
// MODAL: COLLECT DUE PAYMENT (SYNCS INVOICE & CUSTOMER PROFILE)
// ----------------------------------------------------------------------
function CollectDueModal({ sale, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const dueAmount = Number(sale.paymentBreakdown?.dueAmount || 0);
  const queryClient = useQueryClient();

  const { data: activeAccountsRes } = useQuery({
    queryKey: ['accounting-accounts-active'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/accounting/accounts');
        return data?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const availableMethods = useMemo(() => {
    const ALL_METHODS = [
      { key: 'cash', label: 'Cash in Hand (Cash Account)' },
      { key: 'bkash', label: 'bKash Merchant / Personal' },
      { key: 'nagad', label: 'Nagad Account' },
      { key: 'rocket', label: 'Rocket Account' },
      { key: 'bank', label: 'Bank Transfer / Card' },
    ];

    if (!activeAccountsRes || !Array.isArray(activeAccountsRes) || activeAccountsRes.length === 0) {
      return ALL_METHODS;
    }

    const activeList = activeAccountsRes.filter((a) => a.isActive !== false);
    const names = activeList.map((a) => `${(a.name || '').toLowerCase()} ${a.code || ''}`);

    const hasCash = names.some(
      (n) => n.includes('cash') || n.includes('petty') || n.includes('1000')
    );
    const hasBkash = names.some(
      (n) => n.includes('bkash') || n.includes('b-kash') || n.includes('1011')
    );
    const hasRocket = names.some((n) => n.includes('rocket') || n.includes('1013'));
    const hasNagad = names.some(
      (n) => n.includes('nagad') || n.includes('nogod') || n.includes('1012')
    );
    const hasBank = names.some(
      (n) =>
        n.includes('bank') || n.includes('card') || n.includes('checking') || n.includes('1010')
    );

    const filtered = ALL_METHODS.filter(({ key }) => {
      if (key === 'cash') return hasCash;
      if (key === 'bkash') return hasBkash;
      if (key === 'rocket') return hasRocket;
      if (key === 'nagad') return hasNagad;
      if (key === 'bank') return hasBank;
      return true;
    });

    return filtered.length > 0 ? filtered : [ALL_METHODS[0]];
  }, [activeAccountsRes]);

  const [method, setMethod] = useState(() => availableMethods[0]?.key || 'cash');

  useEffect(() => {
    if (availableMethods.length > 0 && !availableMethods.some((m) => m.key === method)) {
      setMethod(availableMethods[0].key);
    }
  }, [availableMethods, method]);

  const mutation = useMutation({
    mutationFn: async () => {
      let collectAmount = amount === '' ? dueAmount : Number(amount);
      if (isNaN(collectAmount) || collectAmount <= 0) {
        throw new Error('Please enter a valid payment amount');
      }
      if (collectAmount > dueAmount) {
        collectAmount = dueAmount;
      }

      const custId =
        typeof sale.customerId === 'object'
          ? sale.customerId?._id || sale.customerId?.id
          : sale.customerId;

      // If customer is linked, collect via customer due endpoint which updates both customer ledger & invoices!
      if (custId) {
        return api.post(`/customers/${custId}/collect-due`, {
          amount: collectAmount,
          paymentMethod: method,
        });
      }

      // Otherwise update the sale invoice directly
      const updatedBreakdown = { ...(sale.paymentBreakdown || {}) };
      const m = (method || 'cash').toLowerCase();
      updatedBreakdown[m] = (Number(updatedBreakdown[m]) || 0) + collectAmount;
      updatedBreakdown.dueAmount = Math.max(0, dueAmount - collectAmount);

      const targetSaleId = sale.id || sale._id;
      return api.put(`/sales/${targetSaleId}`, { paymentBreakdown: updatedBreakdown });
    },
    onSuccess: () => {
      toast.success('Due payment collected and recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-history'] });
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      onSuccess();
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || e.message || 'Failed to collect payment'),
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
                Collect Due Payment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Receive customer payment and update invoice & customer balance.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Invoice Summary Box */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Invoice:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {sale.invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Customer:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ''}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-2">
              <span className="text-rose-600 font-bold uppercase text-[10px]">
                Total Due Pending:
              </span>
              <span className="text-base font-black font-mono text-rose-600">
                ৳{dueAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Amount Field */}
          <div>
            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Collection Amount (৳) *
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
              Leave blank to settle full outstanding due (৳{dueAmount.toLocaleString()})
            </p>
          </div>

          {/* Payment Method Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Active Receiving Account *
              </Label>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {availableMethods.length} Active in Shop
              </span>
            </div>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 shadow-xs"
            >
              {availableMethods.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 px-5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {mutation.isPending ? 'Processing...' : 'Confirm Collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
