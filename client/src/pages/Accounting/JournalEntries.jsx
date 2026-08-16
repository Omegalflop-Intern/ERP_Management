import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  DollarSign,
  Eye,
  FileText,
  HelpCircle,
  Info,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import PageHeader from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/badge';
import EmptyState from '../../components/ui/EmptyState';
import { NumberInput } from '../../components/ui/NumberInput';
import DatePicker from '../../components/ui/DatePicker';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmAction, confirmDelete } from '../../lib/confirm';

const STATUS_BADGES = {
  DRAFT: { label: 'Draft', variant: 'warning' },
  POSTED: { label: 'Posted', variant: 'success' },
  VOID: { label: 'Voided', variant: 'destructive' },
};

export default function JournalEntries() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);
  const { styled } = useTheme();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['journal-entries', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/accounting/journal-entries', {
        params: { search, status: statusFilter, limit: 50 },
      });
      return res.data;
    },
  });

  const postMutation = useMutation({
    mutationFn: async (id) => api.post(`/accounting/journal-entries/${id}/post`),
    onSuccess: () => {
      toast.success('Journal entry posted to general ledger');
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['accounts']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to post entry'),
  });

  const voidMutation = useMutation({
    mutationFn: async (id) => api.post(`/accounting/journal-entries/${id}/void`),
    onSuccess: () => {
      toast.success('Journal entry voided');
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['accounts']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to void entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/accounting/journal-entries/${id}`),
    onSuccess: () => {
      toast.success('Journal entry deleted');
      queryClient.invalidateQueries(['journal-entries']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete entry'),
  });

  const syncMutation = useMutation({
    mutationFn: async () => api.post('/accounting/journal-entries/sync'),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Successfully synced past sales, returns & expenses!');
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['accounts']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Sync failed'),
  });

  const entries = data?.data || [];

  const postedCount = entries.filter((e) => e.status === 'POSTED').length;
  const draftCount = entries.filter((e) => e.status === 'DRAFT').length;
  const totalVolume = entries.reduce((acc, e) => acc + (e.totalDebit || 0), 0);

  return (
    <div className="space-y-6">
      {/* 3-Question Orientation Header */}
      <PageHeader
        title="Journal Entries & General Ledger"
        subtitle="Record double-entry accounting transactions, sync past store sales & expenses, and maintain financial books."
        icon={BookOpen}
        breadcrumbs={['Finance & Accounts', 'Journal Entries']}
        actions={
          <>
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all shadow-xs btn-hover-lift disabled:opacity-50"
            >
              {syncMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <BookOpen className="w-4 h-4" />
              )}
              {syncMutation.isPending ? 'Syncing Store Data...' : 'Sync Past Sales & Expenses'}
            </button>

            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl text-xs transition-all shadow-xs btn-hover-lift"
            >
              <Plus className="w-4 h-4" /> New Journal Entry
            </button>
          </>
        }
      />

      {/* Summary Cards Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-secondary rounded-[20px] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Entries
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
              {entries.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-[#2563EB]">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-secondary rounded-[20px] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Posted Entries
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {postedCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-secondary rounded-[20px] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Draft Entries
            </span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">
              {draftCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-secondary rounded-[20px] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Volume
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
              ৳{totalVolume.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search entry #, account, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
          />
        </div>
        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
          {['ALL', 'POSTED', 'DRAFT', 'VOID'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                statusFilter === s
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {s === 'ALL' ? 'All Entries' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Journal Entries Glass Table */}
      <div className="glass-light rounded-[20px] overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800">
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Entry #
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Description / Particulars
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Debit (Cash In / Asset)
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Credit (Cash Out / Income)
                </th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 w-24 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      icon={BookOpen}
                      title="No Journal Entries Found"
                      description="Click below to automatically import your past store sales, item returns, and shop expenses into general ledger accounting journals."
                      actionLabel="Sync Store Data Now"
                      onAction={() => syncMutation.mutate()}
                    />
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr
                    key={e._id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                        {e.entryNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(e.date).toLocaleDateString('en-BD')}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {e.description}
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ৳{(e.totalDebit || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                      ৳{(e.totalCredit || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={STATUS_BADGES[e.status]?.variant || 'secondary'}>
                        {STATUS_BADGES[e.status]?.label || e.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {e.status === 'DRAFT' && (
                          <button
                            onClick={() => postMutation.mutate(e._id)}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-500/25 transition-all"
                          >
                            Post
                          </button>
                        )}
                        {e.status === 'POSTED' && (
                          <button
                            onClick={() =>
                              confirmAction(
                                'Void Journal Entry?',
                                () => voidMutation.mutate(e._id),
                                'Void Entry',
                                'Are you sure you want to void this posted entry? It will reverse account balances.'
                              )
                            }
                            className="px-2.5 py-1 text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-500/25 transition-all"
                          >
                            Void
                          </button>
                        )}
                        <button
                          onClick={() => setViewEntry(e)}
                          className="p-1.5 text-slate-400 hover:text-[#2563EB] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-all"
                          title="View Journal Lines"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {e.status !== 'POSTED' && (
                          <button
                            onClick={() =>
                              confirmDelete('Delete journal entry?', () =>
                                deleteMutation.mutate(e._id)
                              )
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                            title="Delete Draft Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
        <JournalEntryForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries(['journal-entries']);
          }}
        />
      )}
      {viewEntry && <JournalEntryDetail entry={viewEntry} onClose={() => setViewEntry(null)} />}
    </div>
  );
}

function JournalEntryForm({ onClose, onSuccess }) {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState([
    { accountId: '', debit: 0, credit: 0, description: '' },
    { accountId: '', debit: 0, credit: 0, description: '' },
  ]);

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await api.get('/accounting/accounts', { params: { limit: 200 } });
      return res.data?.data || [];
    },
  });
  const accounts = accountsData || [];

  const addLine = () =>
    setLines([...lines, { accountId: '', debit: 0, credit: 0, description: '' }]);
  const removeLine = (idx) => {
    if (lines.length > 2) setLines(lines.filter((_, i) => i !== idx));
  };
  const updateLine = (idx, field, value) => {
    const u = [...lines];
    u[idx] = { ...u[idx], [field]: value };
    setLines(u);
  };

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const mutation = useMutation({
    mutationFn: async () =>
      api.post('/accounting/journal-entries', {
        date,
        description,
        reference,
        lines: lines.filter((l) => l.accountId),
      }),
    onSuccess: () => {
      toast.success('Journal entry created successfully');
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create entry'),
  });

  const inputClass =
    'w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="glass-primary w-full max-w-3xl max-w-[calc(100vw-1.5rem)] my-auto rounded-[24px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Create New Journal Entry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record debit and credit lines for store accounts
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Beginner Guidance Box */}
          <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 flex items-start gap-3">
            <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Accounting Rule:
              </span>{' '}
              Total Debit must equal Total Credit. For example, when cash is received from a sale,
              Debit Cash Account and Credit Sales Income Account.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Entry Date *
              </label>
              <DatePicker
                value={date}
                onChange={setDate}
                placeholder="Entry Date"
                className="w-full !rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Description / Purpose *
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
                placeholder="e.g. Monthly Shop Rent Payment"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Reference / Receipt # (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputClass}
              placeholder="e.g. Voucher #1042"
            />
          </div>

          {/* Journal Lines */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Journal Lines (Debit / Credit Accounts)
              </label>
              <button
                type="button"
                onClick={addLine}
                className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Account Line
              </button>
            </div>

            {lines.map((line, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row gap-2.5 items-center p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60"
              >
                <div className="flex-1 w-full">
                  <select
                    value={line.accountId}
                    onChange={(e) => updateLine(idx, 'accountId', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">-- Select Account --</option>
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.code} — {a.name} ({a.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-32">
                  <NumberInput
                    value={line.debit || ''}
                    onChange={(e) => updateLine(idx, 'debit', Number(e.target.value))}
                    min={0}
                    placeholder="Debit (৳)"
                    className={`${inputClass} text-right font-mono`}
                  />
                </div>
                <div className="w-full sm:w-32">
                  <NumberInput
                    value={line.credit || ''}
                    onChange={(e) => updateLine(idx, 'credit', Number(e.target.value))}
                    min={0}
                    placeholder="Credit (৳)"
                    className={`${inputClass} text-right font-mono`}
                  />
                </div>
                {lines.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Balance Calculator */}
          <div className="flex justify-end pt-2">
            <div className="glass-secondary rounded-xl p-4 space-y-2 w-72 border border-slate-200/80 dark:border-slate-800">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Total Debit:</span>
                <span className="font-bold font-mono">৳{totalDebit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Total Credit:</span>
                <span className="font-bold font-mono">৳{totalCredit.toLocaleString()}</span>
              </div>
              <div
                className={`flex justify-between text-xs font-bold border-t border-slate-200/60 dark:border-slate-800 pt-2 ${
                  isBalanced
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                <span>{isBalanced ? 'Balanced Ready' : 'Unbalanced (Must Match)'}</span>
                <span>
                  {isBalanced ? (
                    <CheckCircle2 className="w-4 h-4 inline" />
                  ) : (
                    <XCircle className="w-4 h-4 inline" />
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !isBalanced || !description}
            className="flex-1 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            {mutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Save Journal Entry
          </button>
        </div>
      </div>
    </div>
  );
}

function JournalEntryDetail({ entry, onClose }) {
  if (!entry) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="glass-primary w-full max-w-2xl max-w-[calc(100vw-1.5rem)] my-auto rounded-[24px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Journal Entry {entry.entryNumber}
            </h3>
            <div className="flex items-center gap-2.5 mt-1">
              <Badge variant={STATUS_BADGES[entry.status]?.variant || 'secondary'}>
                {STATUS_BADGES[entry.status]?.label || entry.status}
              </Badge>
              <span className="text-xs text-slate-500">
                {new Date(entry.date).toLocaleDateString('en-BD')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="text-sm">
            <span className="text-slate-500">Description:</span>{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {entry.description}
            </span>
          </div>
          {entry.reference && (
            <div className="text-sm">
              <span className="text-slate-500">Reference:</span>{' '}
              <span className="text-slate-900 dark:text-slate-100 font-mono">
                {entry.reference}
              </span>
            </div>
          )}

          <div className="glass-light rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Account
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Debit (৳)
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Credit (৳)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {entry.lines?.map((l, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-slate-500">{l.accountId?.code}</span>
                      <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                        {l.accountId?.name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {l.debit ? `৳${l.debit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                      {l.credit ? `৳${l.credit.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
                  <td className="px-4 py-3 text-slate-900 dark:text-slate-100">Total</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    ৳{entry.totalDebit?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-slate-100">
                    ৳{entry.totalCredit?.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
