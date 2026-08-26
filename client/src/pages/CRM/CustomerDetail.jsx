import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  Receipt,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { NumberInput } from '../../components/ui/NumberInput';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { styled } = useTheme();
  const queryClient = useQueryClient();
  const [collectModal, setCollectModal] = useState(false);
  const [amount, setAmount] = useState('');

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
      { key: 'cash', label: 'Cash' },
      { key: 'bkash', label: 'bKash' },
      { key: 'nagad', label: 'Nagad' },
      { key: 'rocket', label: 'Rocket' },
      { key: 'bank', label: 'Bank' },
    ];

    if (!activeAccountsRes || !Array.isArray(activeAccountsRes) || activeAccountsRes.length === 0) {
      return ALL_METHODS;
    }

    const activeList = activeAccountsRes.filter((a) => a.isActive !== false);
    const names = activeList.map((a) => `${(a.name || '').toLowerCase()} ${a.code || ''}`);

    const hasCash = names.some((n) => n.includes('cash') || n.includes('petty') || n.includes('1000'));
    const hasBkash = names.some((n) => n.includes('bkash') || n.includes('b-kash') || n.includes('1011'));
    const hasRocket = names.some((n) => n.includes('rocket') || n.includes('1013'));
    const hasNagad = names.some((n) => n.includes('nagad') || n.includes('nogod') || n.includes('1012'));
    const hasBank = names.some((n) => n.includes('bank') || n.includes('card') || n.includes('checking') || n.includes('1010'));

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

  const { data, isLoading } = useQuery({
    queryKey: ['customer-history', id],
    queryFn: async () => {
      const res = await api.get(`/customers/${id}/history`);
      return res.data?.data;
    },
  });

  const collectMutation = useMutation({
    mutationFn: async () => {
      const collectAmount = Number(amount) || data?.customer?.dueBalance || 0;
      return api.post(`/customers/${id}/collect-due`, {
        amount: collectAmount,
        paymentMethod: method,
      });
    },
    onSuccess: () => {
      toast.success('Payment collected and invoices updated');
      setCollectModal(false);
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['customer-history', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const c = data?.customer;
  const summary = data?.summary || {};
  const sales = data?.sales || [];
  const returns = data?.returns || [];

  const cardClass = styled
    ? 'neu-card p-4'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4';

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  if (!c) return <div className="text-center py-20 text-gray-400">Customer not found</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Customer Info */}
      <div className={cardClass}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {c.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{c.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" /> {c.phone}
              </span>
              {c.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" /> {c.email}
                </span>
              )}
              {c.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {c.address}
                </span>
              )}
            </div>
          </div>
          {c.dueBalance > 0 && (
            <button
              onClick={() => setCollectModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg text-sm transition-all"
            >
              <DollarSign className="w-4 h-4" /> Collect Due
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Purchased',
            value: `৳${summary.totalPurchased?.toLocaleString()}`,
            color: 'text-green-600 dark:text-green-400',
            icon: ShoppingBag,
          },
          {
            label: 'Total Returns',
            value: `৳${summary.totalReturns?.toLocaleString()}`,
            color: 'text-amber-600 dark:text-amber-400',
            icon: Receipt,
          },
          {
            label: 'Due Balance',
            value: `৳${summary.totalDue?.toLocaleString()}`,
            color: 'text-red-600 dark:text-red-400',
            icon: DollarSign,
          },
          {
            label: 'Total Invoices',
            value: summary.totalTransactions,
            color: 'text-blue-600 dark:text-blue-400',
            icon: Receipt,
          },
        ].map((s) => (
          <div key={s.label} className={cardClass}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {s.label}
              </span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Sales History */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Purchase History ({sales.length} invoices)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Invoice
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Items</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Total</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Due</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                    No purchases yet
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr
                    key={s._id}
                    className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer"
                    onClick={() => navigate(`/sales/${s._id}`)}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-gray-100">
                      {s.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {s.lineItems?.length || 0} items
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                      ৳{s.netTotal?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {s.paymentBreakdown?.dueAmount > 0 ? (
                        <span className="font-bold text-red-600 dark:text-red-400">
                          ৳{s.paymentBreakdown.dueAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">Paid</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Returns History */}
      {returns.length > 0 && (
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Returns ({returns.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                    Invoice
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                    Amount
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((r) => (
                  <tr key={r._id} className="border-b border-gray-100 dark:border-gray-800/50">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-gray-100">
                      {r.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-600 dark:text-amber-400">
                      ৳{Math.abs(r.netTotal || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collect Due Modal */}
      {collectModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setCollectModal(false)}
        >
          <div
            className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Collect Due — {c.name}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 text-center">
                <div className="text-xs text-gray-500 uppercase">Outstanding Due</div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  ৳{c.dueBalance.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Amount (৳)
                </label>
                <NumberInput
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Max: ${c.dueBalance}`}
                  max={c.dueBalance}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
                />
                <p className="text-xs text-gray-400 mt-1">Leave empty to collect full amount</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Active Receiving Account
                  </label>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {availableMethods.length} Active in Shop
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableMethods.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMethod(m.key)}
                      className={`flex-1 min-w-[70px] px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                        method === m.key
                          ? 'bg-blue-600 text-white shadow-blue-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCollectModal(false)}
                  className="flex-1 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => collectMutation.mutate()}
                  disabled={collectMutation.isPending}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                >
                  {collectMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <DollarSign className="w-4 h-4" />
                  )}
                  Collect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
