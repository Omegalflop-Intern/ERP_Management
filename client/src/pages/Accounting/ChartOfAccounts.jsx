import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  Edit,
  Filter,
  Landmark,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';

const ACCOUNT_TYPES = ['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
const TYPE_COLORS = {
  ASSET: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  LIABILITY: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  EQUITY: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  REVENUE: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  EXPENSE: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
};

export default function ChartOfAccounts() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const { styled } = useTheme();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', search, typeFilter],
    queryFn: async () => {
      const res = await api.get('/accounting/accounts', {
        params: { search, type: typeFilter, limit: 200 },
      });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/accounting/accounts/${id}`),
    onSuccess: () => {
      toast.success('Account deleted');
      queryClient.invalidateQueries(['accounts']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const seedMutation = useMutation({
    mutationFn: async () => api.post('/accounting/accounts/seed'),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Seeded');
      queryClient.invalidateQueries(['accounts']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }) => api.put(`/accounting/accounts/${id}`, { isActive }),
    onSuccess: (_, variables) => {
      toast.success(
        `Account "${variables.name || 'Account'}" set to ${
          variables.isActive ? 'ACTIVE (ON)' : 'DISABLED (OFF)'
        }`,
        { duration: 1500 }
      );
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['pos-active-accounts']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update account status'),
  });

  const accounts = data?.data || [];
  const cardClass = styled
    ? 'neu-card p-5'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4';
  const innerCardClass = styled
    ? 'neu-card-sm p-4'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4';
  const inputClass = styled
    ? 'neu-input w-full pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none'
    : 'w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#2563EB]';
  const btnClass = styled
    ? 'neu-btn px-4 py-2 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 !bg-[#2563EB] hover:!bg-[#1D4ED8]'
    : 'flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-lg text-sm transition-all';

  const { data: salesRes } = useQuery({
    queryKey: ['sales-channel-balances'],
    queryFn: async () => {
      const res = await api.get('/sales', { params: { limit: 1000 } });
      return res.data?.data || [];
    },
  });

  const channelBalances = React.useMemo(() => {
    const salesList = salesRes || [];
    let cash = 0,
      bkash = 0,
      nagad = 0,
      rocket = 0,
      bank = 0,
      refunds = 0;
    salesList.forEach((s) => {
      cash += s.paymentBreakdown?.cash || 0;
      bkash += s.paymentBreakdown?.bkash || 0;
      nagad += s.paymentBreakdown?.nagad || 0;
      rocket += s.paymentBreakdown?.rocket || 0;
      bank += s.paymentBreakdown?.bank || 0;
      refunds += s.returnedAmount || 0;
    });

    const netCash = Math.max(0, cash - refunds);
    return {
      cash: netCash,
      bkash,
      nagad,
      rocket,
      bank,
      refunds,
      totalLiquid: netCash + bkash + nagad + rocket + bank,
    };
  }, [salesRes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Chart of Accounts &amp; Ledger
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track liquid cash, bank balances, mobile banking, and account balances
          </p>
        </div>
        <div className="flex gap-2">
          {accounts.length === 0 && (
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className={
                styled
                  ? 'neu-btn px-4 py-2 text-blue-700 dark:text-blue-400 font-medium rounded-lg text-sm flex items-center gap-2'
                  : 'flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium rounded-lg text-sm hover:bg-blue-200 transition-colors'
              }
            >
              {seedMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              Seed Defaults
            </button>
          )}
          <button
            onClick={() => {
              setEditAccount(null);
              setShowForm(true);
            }}
            className={btnClass}
          >
            <Plus className="w-4 h-4" /> Add Account
          </button>
        </div>
      </div>

      {/* Real-time Payment Channel Liquid Balances Card */}
      <div className={cardClass}>
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Liquid Cash
              &amp; Payment Method Channel Balances
            </h3>
            <p className="text-xs text-gray-400">
              Real-time incoming sales revenue minus returns across all payment methods
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400">Total Liquid Assets:</span>
            <div className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              ৳{channelBalances.totalLiquid.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase flex items-center gap-1 mb-1">
              <Landmark className="w-3 h-3 text-emerald-600" /> Cash in Hand (Net)
            </span>
            <div className="text-base font-mono font-extrabold text-emerald-700 dark:text-emerald-300">
              ৳{channelBalances.cash.toLocaleString()}
            </div>
            {channelBalances.refunds > 0 && (
              <span className="text-[9px] text-red-500 font-semibold block mt-0.5">
                (-৳{channelBalances.refunds.toLocaleString()} refunded)
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-pink-50/70 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800/40">
            <span className="text-[10px] font-bold text-pink-800 dark:text-pink-300 uppercase flex items-center gap-1 mb-1">
              <Smartphone className="w-3 h-3 text-pink-600" /> bKash Merchant
            </span>
            <div className="text-base font-mono font-extrabold text-pink-700 dark:text-pink-300">
              ৳{channelBalances.bkash.toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase flex items-center gap-1 mb-1">
              <Smartphone className="w-3 h-3 text-amber-600" /> Nagad Merchant
            </span>
            <div className="text-base font-mono font-extrabold text-amber-700 dark:text-amber-300">
              ৳{channelBalances.nagad.toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40">
            <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase flex items-center gap-1 mb-1">
              <Smartphone className="w-3 h-3 text-purple-600" /> Rocket Account
            </span>
            <div className="text-base font-mono font-extrabold text-purple-700 dark:text-purple-300">
              ৳{channelBalances.rocket.toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40">
            <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase flex items-center gap-1 mb-1">
              <Landmark className="w-3 h-3 text-blue-600" /> Bank Account
            </span>
            <div className="text-base font-mono font-extrabold text-blue-700 dark:text-blue-300">
              ৳{channelBalances.bank.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {ACCOUNT_TYPES.filter((t) => t !== 'ALL').map((t) => {
          const total = accounts.filter((a) => a.type === t).reduce((s, a) => s + a.balance, 0);
          return (
            <div key={t} className={cardClass}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[t]}`}
                >
                  {accounts.filter((a) => a.type === t).length}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                ৳{total.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {ACCOUNT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${typeFilter === t ? 'bg-[#2563EB] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              {t === 'ALL' ? 'All' : t}
            </button>
          ))}
        </div>
      </div>

      <div className={innerCardClass}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Code
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Account Name
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Status (POS)
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Balance
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
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : accounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <Landmark className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No accounts found. Click "Seed Defaults" to set up basic accounts.</p>
                  </td>
                </tr>
              ) : (
                accounts.map((a) => (
                  <tr
                    key={a._id}
                    className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">
                        {a.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {a.name}
                      </div>
                      {a.description && (
                        <div className="text-xs text-gray-500">{a.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[a.type]}`}
                      >
                        {a.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: a._id,
                            isActive: a.isActive === false ? true : false,
                            name: a.name,
                          })
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-xs ${
                          a.isActive !== false
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                        }`}
                        title={
                          a.isActive !== false
                            ? 'Click to Disable in POS'
                            : 'Click to Enable in POS'
                        }
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            a.isActive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        {a.isActive !== false ? 'ON (Active)' : 'OFF (Disabled)'}
                      </button>
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-sm font-semibold ${a.type === 'ASSET' || a.type === 'EXPENSE' ? (a.balance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400') : a.balance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}
                    >
                      ৳{a.balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditAccount(a);
                            setShowForm(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            confirmDelete(`Delete account "${a.name}"?`, () =>
                              deleteMutation.mutate(a._id)
                            )
                          }
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <AccountForm
          account={editAccount}
          onClose={() => {
            setShowForm(false);
            setEditAccount(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditAccount(null);
            queryClient.invalidateQueries(['accounts']);
          }}
        />
      )}
    </div>
  );
}

function AccountForm({ account, onClose, onSuccess }) {
  const { styled } = useTheme();
  const [form, setForm] = useState({
    code: account?.code || '',
    name: account?.name || '',
    type: account?.type || 'ASSET',
    subType: account?.subType || 'CURRENT_ASSET',
    description: account?.description || '',
    isActive: account?.isActive !== false,
  });

  const SUBTYPES = {
    ASSET: ['CURRENT_ASSET', 'FIXED_ASSET'],
    LIABILITY: ['CURRENT_LIABILITY', 'LONG_TERM_LIABILITY'],
    EQUITY: ['OWNERS_EQUITY', 'RETAINED_EARNINGS'],
    REVENUE: ['SALES_REVENUE', 'OTHER_REVENUE'],
    EXPENSE: ['COST_OF_GOODS', 'OPERATING_EXPENSE', 'OTHER_EXPENSE'],
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (account)
        return api.put(`/accounting/accounts/${account._id}`, {
          name: form.name,
          description: form.description,
          isActive: form.isActive,
        });
      return api.post('/accounting/accounts', form);
    },
    onSuccess: () => {
      toast.success(account ? 'Account updated' : 'Account created');
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const inputClass = styled
    ? 'neu-input w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none'
    : 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#2563EB]';
  const selectClass = styled
    ? 'neu-input w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none'
    : 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#2563EB]';
  const btnPrimary = styled
    ? 'flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2'
    : 'flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2';
  const btnSecondary = styled
    ? 'flex-1 py-2 neu-btn text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm transition-colors'
    : 'flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm transition-colors';

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`w-full max-w-md ${styled ? 'neu-card p-0' : 'bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl'} max-h-[90vh] overflow-y-auto`}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            {account ? 'Edit Account' : 'Add Account'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Code *
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                disabled={!!account}
                className={`${inputClass} ${account ? 'opacity-50' : ''}`}
                placeholder="e.g. 1000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="Account name"
              />
            </div>
          </div>
          {!account && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Type *
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value, subType: SUBTYPES[e.target.value][0] })
                  }
                  className={selectClass}
                >
                  {['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Sub Type *
                </label>
                <select
                  value={form.subType}
                  onChange={(e) => setForm({ ...form, subType: e.target.value })}
                  className={selectClass}
                >
                  {(SUBTYPES[form.type] || []).map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
              placeholder="Optional description"
            />
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                POS Sales Payment Status
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {form.isActive
                  ? 'Active (ON — Displays in POS)'
                  : 'Disabled (OFF — Hidden from POS)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                form.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className={btnSecondary}>
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.code || !form.name}
              className={btnPrimary}
            >
              {mutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {account ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
