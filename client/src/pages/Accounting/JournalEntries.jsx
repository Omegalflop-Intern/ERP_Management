import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle,
  Eye,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmAction, confirmDelete } from '../../lib/confirm';

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  POSTED: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  VOID: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
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
      toast.success('Entry posted');
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['accounts']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const voidMutation = useMutation({
    mutationFn: async (id) => api.post(`/accounting/journal-entries/${id}/void`),
    onSuccess: () => {
      toast.success('Entry voided');
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['accounts']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/accounting/journal-entries/${id}`),
    onSuccess: () => {
      toast.success('Entry deleted');
      queryClient.invalidateQueries(['journal-entries']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const syncMutation = useMutation({
    mutationFn: async () => api.post('/accounting/journal-entries/sync'),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Successfully synced past sales & expenses!');
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['accounts']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Sync failed'),
  });

  const entries = data?.data || [];
  const cardClass = styled
    ? 'neu-card p-5'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4';
  const inputClass = styled
    ? 'neu-input w-full pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none'
    : 'w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500';
  const btnClass = styled
    ? 'neu-btn px-4 py-2 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 !bg-red-700 hover:!bg-red-600'
    : 'flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-medium rounded-lg text-sm transition-all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Journal Entries</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Double-entry bookkeeping and transaction recording
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-all shadow-sm"
          >
            {syncMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
            {syncMutation.isPending ? 'Syncing...' : 'Sync All Past Sales'}
          </button>
          <button onClick={() => setShowForm(true)} className={btnClass}>
            <Plus className="w-4 h-4" /> New Entry
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex gap-1">
          {['ALL', 'DRAFT', 'POSTED', 'VOID'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === s ? 'bg-red-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      <div className={cardClass}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Entry #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Description
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Debit
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Credit
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Status
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
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                    <p className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">
                      No Journal Entries Found
                    </p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                      Click below to automatically import all your past sales, returns, and shop
                      expenses into posted double-entry journals.
                    </p>
                    <button
                      onClick={() => syncMutation.mutate()}
                      disabled={syncMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-all"
                    >
                      {syncMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <BookOpen className="w-4 h-4" />
                      )}
                      {syncMutation.isPending
                        ? 'Syncing Past Transactions...'
                        : 'Sync All Past Sales & Expenses Now'}
                    </button>
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr
                    key={e._id}
                    className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                        {e.entryNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(e.date).toLocaleDateString('en-BD')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                      {e.description}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                      ৳{(e.totalDebit || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                      ৳{(e.totalCredit || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.status]}`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {e.status === 'DRAFT' && (
                          <button
                            onClick={() => postMutation.mutate(e._id)}
                            className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            Post
                          </button>
                        )}
                        {e.status === 'POSTED' && (
                          <button
                            onClick={() =>
                              confirmAction(
                                'Void journal entry?',
                                () => voidMutation.mutate(e._id),
                                'Void',
                                'Are you sure you want to void this posted entry?'
                              )
                            }
                            className="px-2 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 transition-colors"
                          >
                            Void
                          </button>
                        )}
                        <button
                          onClick={() => setViewEntry(e)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
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
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
  const { styled } = useTheme();
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
      toast.success('Journal entry created');
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const inputClass = styled
    ? 'neu-input w-full px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none'
    : 'w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500';
  const selectClass = styled
    ? 'neu-input w-full px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none'
    : 'w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full max-w-3xl ${styled ? 'neu-card p-0' : 'bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl'} max-h-[90vh] overflow-y-auto`}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">New Journal Entry</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Description *
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
                placeholder="Entry description"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputClass}
              placeholder="Invoice #, receipt #, etc."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Journal Lines
              </label>
              <button
                onClick={addLine}
                className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Line
              </button>
            </div>
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="flex gap-2 items-start bg-gray-50 dark:bg-gray-900 rounded-lg p-3"
              >
                <div className="flex-1">
                  <select
                    value={line.accountId}
                    onChange={(e) => updateLine(idx, 'accountId', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select Account</option>
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.code} — {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    value={line.debit || ''}
                    onChange={(e) => updateLine(idx, 'debit', Number(e.target.value))}
                    min={0}
                    placeholder="Debit"
                    className={`${inputClass} text-right`}
                  />
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    value={line.credit || ''}
                    onChange={(e) => updateLine(idx, 'credit', Number(e.target.value))}
                    min={0}
                    placeholder="Credit"
                    className={`${inputClass} text-right`}
                  />
                </div>
                {lines.length > 2 && (
                  <button
                    onClick={() => removeLine(idx)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <div
              className={`${styled ? 'neu-pressed' : 'bg-gray-50 dark:bg-gray-900'} rounded-lg p-4 space-y-2 w-64`}
            >
              <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>Total Debit</span>
                <span>৳{totalDebit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>Total Credit</span>
                <span>৳{totalCredit.toLocaleString()}</span>
              </div>
              <div
                className={`flex justify-between text-sm font-bold border-t border-gray-200 dark:border-gray-700 pt-2 ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                <span>{isBalanced ? 'Balanced' : 'Unbalanced'}</span>
                <span>
                  {isBalanced ? (
                    <CheckCircle className="w-4 h-4 inline" />
                  ) : (
                    <XCircle className="w-4 h-4 inline" />
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={
                styled
                  ? 'flex-1 py-2 neu-btn text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm'
                  : 'flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm transition-colors'
              }
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !isBalanced || !description}
              className={
                styled
                  ? 'flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2'
                  : 'flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2'
              }
            >
              {mutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function JournalEntryDetail({ entry, onClose }) {
  if (!entry) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-800 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">{entry.entryNumber}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[entry.status]}`}
              >
                {entry.status}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(entry.date).toLocaleDateString('en-BD')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-sm">
            <span className="text-gray-500">Description:</span>{' '}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {entry.description}
            </span>
          </div>
          {entry.reference && (
            <div className="text-sm">
              <span className="text-gray-500">Reference:</span>{' '}
              <span className="text-gray-900 dark:text-gray-100">{entry.reference}</span>
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-500">Account</th>
                <th className="text-right py-2 text-gray-500">Debit</th>
                <th className="text-right py-2 text-gray-500">Credit</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines?.map((l, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-800/50">
                  <td className="py-2">
                    <span className="font-mono text-xs text-gray-500">{l.accountId?.code}</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {l.accountId?.name}
                    </span>
                  </td>
                  <td className="py-2 text-right text-gray-700 dark:text-gray-300">
                    {l.debit ? `৳${l.debit.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-2 text-right text-gray-700 dark:text-gray-300">
                    {l.credit ? `৳${l.credit.toLocaleString()}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t-2 border-gray-300 dark:border-gray-700">
                <td className="py-2 text-gray-900 dark:text-gray-100">Total</td>
                <td className="py-2 text-right text-gray-900 dark:text-gray-100">
                  ৳{entry.totalDebit?.toLocaleString()}
                </td>
                <td className="py-2 text-right text-gray-900 dark:text-gray-100">
                  ৳{entry.totalCredit?.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
