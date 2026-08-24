import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  Edit,
  HelpCircle,
  Landmark,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  ToggleLeft,
  ToggleRight,
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
const TYPE_DESCRIPTIONS = {
  ASSET: 'What the shop owns (cash, bank, inventory)',
  LIABILITY: 'What the shop owes (loans, credit)',
  EQUITY: 'Owner investment and retained earnings',
  REVENUE: 'Money earned from sales',
  EXPENSE: 'Money spent on operations',
};

export default function ChartOfAccounts() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
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
        `Account "${variables.name || 'Account'}" ${variables.isActive ? 'enabled' : 'disabled'}`,
        { duration: 1500 }
      );
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['pos-active-accounts']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update'),
  });

  const accounts = data?.data || [];
  const cardClass = styled
    ? 'neu-card p-5'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4';
  const inputClass = styled
    ? 'neu-input w-full pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none'
    : 'w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#2563EB]';

  const channelBalances = React.useMemo(() => {
    let cash = 0, bkash = 0, nagad = 0, rocket = 0, bank = 0;
    (accounts || []).forEach((a) => {
      const name = (a.name || '').toLowerCase();
      const code = String(a.code || '');
      const bal = Number(a.balance || 0);
      if (code === '1000' || name === 'cash' || name.includes('cash on hand')) cash = bal;
      else if (code === '1010' || name.includes('bank')) bank = bal;
      else if (code === '1011' || name.includes('bkash')) bkash = bal;
      else if (code === '1012' || name.includes('nagad')) nagad = bal;
      else if (code === '1013' || name.includes('rocket')) rocket = bal;
    });
    return { cash, bkash, nagad, rocket, bank, totalLiquid: cash + bkash + nagad + rocket + bank };
  }, [accounts]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-blue-600" /> Chart of Accounts
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your shop's financial accounts — cash, bank, expenses, and more
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              showHelp
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Guide
          </button>
          {accounts.length === 0 && (
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold rounded-lg text-xs hover:bg-emerald-200 transition-colors"
            >
              {seedMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Quick Setup
            </button>
          )}
          <button
            onClick={() => { setEditAccount(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-lg text-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Add Account
          </button>
        </div>
      </div>

      {/* Beginner Guide */}
      {showHelp && (
        <div className={`${cardClass} border-l-4 border-blue-500`}>
          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-2">Quick Guide for Beginners</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <strong className="text-blue-700 dark:text-blue-300">1. Seed Defaults First</strong>
              <p className="mt-1">Click "Quick Setup" to create standard accounts (Cash, Bank, bKash, etc.)</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <strong className="text-emerald-700 dark:text-emerald-300">2. Enable Payment Methods</strong>
              <p className="mt-1">Toggle ON the payment methods you accept (bKash, Nagad, Rocket, etc.)</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <strong className="text-amber-700 dark:text-amber-300">3. Disable Unused Accounts</strong>
              <p className="mt-1">Toggle OFF accounts you don't use to keep your POS checkout clean</p>
            </div>
          </div>
          <div className="mt-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-500">
            <strong>Tip:</strong> The "ON/OFF" toggle controls which accounts appear as payment options during checkout. 
            Disabling an account doesn't delete it — it just hides it from the POS.
          </div>
        </div>
      )}

      {/* Payment Channel Balances */}
      <div className={cardClass}>
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" /> Payment Channel Balances
            </h3>
            <p className="text-xs text-gray-400">Current balance in each payment method</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400">Total:</span>
            <div className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              ৳{channelBalances.totalLiquid.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Cash', value: channelBalances.cash, color: 'emerald', icon: '💵' },
            { label: 'bKash', value: channelBalances.bkash, color: 'pink', icon: '📱' },
            { label: 'Nagad', value: channelBalances.nagad, color: 'amber', icon: '📱' },
            { label: 'Rocket', value: channelBalances.rocket, color: 'purple', icon: '🚀' },
            { label: 'Bank', value: channelBalances.bank, color: 'blue', icon: '🏦' },
          ].map((ch) => (
            <div key={ch.label} className={`p-3 rounded-xl bg-${ch.color}-50/70 dark:bg-${ch.color}-900/20 border border-${ch.color}-200 dark:border-${ch.color}-800/40`}>
              <span className={`text-[10px] font-bold text-${ch.color}-800 dark:text-${ch.color}-300 uppercase`}>
                {ch.icon} {ch.label}
              </span>
              <div className={`text-base font-mono font-extrabold text-${ch.color}-700 dark:text-${ch.color}-300`}>
                ৳{ch.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Type Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ACCOUNT_TYPES.filter((t) => t !== 'ALL').map((t) => {
          const total = accounts.filter((a) => a.type === t).reduce((s, a) => s + a.balance, 0);
          const activeCount = accounts.filter((a) => a.type === t && a.isActive !== false).length;
          return (
            <div key={t} className={`${cardClass} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => setTypeFilter(t)}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase">{t}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[t]}`}>
                  {activeCount}/{accounts.filter((a) => a.type === t).length}
                </span>
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">৳{total.toLocaleString()}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{TYPE_DESCRIPTIONS[t]}</div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts by name or code..."
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

      {/* Accounts Table */}
      <div className={`${cardClass} overflow-x-auto p-0`}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Account Name</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                <span className="flex items-center justify-center gap-1" title="Toggle ON/OFF to show or hide this account in POS checkout">
                  POS Status
                </span>
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Balance</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  <Landmark className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No accounts found</p>
                  <p className="text-xs mt-1">Click "Quick Setup" to create standard accounts, or "Add Account" to create custom ones.</p>
                </td>
              </tr>
            ) : (
              accounts.map((a) => (
                <tr
                  key={a._id}
                  className={`border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 ${a.isActive === false ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">{a.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.name}</div>
                    {a.description && <div className="text-xs text-gray-500">{a.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[a.type]}`}>
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
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        a.isActive !== false
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/70'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      title={a.isActive !== false ? `Click to disable ${a.name} in POS` : `Click to enable ${a.name} in POS`}
                    >
                      {a.isActive !== false ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                      {a.isActive !== false ? 'ON' : 'OFF'}
                    </button>
                  </td>
                  <td className={`px-4 py-3 text-right text-sm font-semibold ${a.balance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}>
                    ৳{a.balance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditAccount(a); setShowForm(true); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit account"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDelete(`Delete "${a.name}"?`, () => deleteMutation.mutate(a._id))}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete account"
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

      {showForm && (
        <AccountForm
          account={editAccount}
          onClose={() => { setShowForm(false); setEditAccount(null); }}
          onSuccess={() => { setShowForm(false); setEditAccount(null); queryClient.invalidateQueries(['accounts']); }}
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
    balance: account?.balance !== undefined ? account.balance : '',
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

  const TYPE_HELP = {
    ASSET: 'Things your shop owns (cash, equipment, inventory)',
    LIABILITY: 'Money your shop owes (loans, supplier credit)',
    EQUITY: 'Owner investment and business profits',
    REVENUE: 'Money earned from sales and services',
    EXPENSE: 'Money spent to run the shop (rent, utilities)',
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (account) {
        return api.put(`/accounting/accounts/${account._id}`, {
          name: form.name,
          description: form.description,
          isActive: form.isActive,
        });
      }
      return api.post('/accounting/accounts', {
        ...form,
        balance: Number(form.balance || 0),
      });
    },
    onSuccess: () => {
      toast.success(account ? 'Account updated' : 'Account created');
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const inputClass = styled
    ? 'neu-input w-full px-3 py-2 text-sm'
    : 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]';

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`w-full max-w-md ${styled ? 'neu-card p-0' : 'bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl'} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            {account ? 'Edit Account' : 'Add New Account'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                disabled={!!account}
                className={`${inputClass} ${account ? 'opacity-50' : ''}`}
                placeholder="e.g. 1000"
              />
              {!account && <p className="text-[10px] text-gray-400 mt-1">Use 1xxx for Assets, 2xxx for Liabilities, etc.</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="e.g. Cash in Hand"
              />
            </div>
          </div>
          {!account && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value, subType: SUBTYPES[e.target.value][0] })}
                  className={inputClass}
                >
                  {['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">{TYPE_HELP[form.type]}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sub Type *</label>
                <select
                  value={form.subType}
                  onChange={(e) => setForm({ ...form, subType: e.target.value })}
                  className={inputClass}
                >
                  {(SUBTYPES[form.type] || []).map((st) => (
                    <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Opening Balance (৳)</label>
            <input
              type="number"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              className={inputClass}
              placeholder="e.g. 50000"
              disabled={!!account}
            />
            {!account && <p className="text-[10px] text-gray-400 mt-1">Starting balance for this account (leave 0 if unsure)</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
              placeholder="Optional note about this account"
            />
          </div>

          {/* POS Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">Show in POS Checkout</span>
              <span className="text-[11px] text-gray-500">
                {form.isActive ? 'ON — This account appears as a payment option' : 'OFF — Hidden from payment options'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-sm">
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.code || !form.name}
              className="flex-1 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {mutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {account ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
