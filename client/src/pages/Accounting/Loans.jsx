import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Landmark, Plus, Search, Trash2, X, DollarSign, Calendar, Percent, CheckCircle2, History, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';
import { useTheme } from '../../context/ThemeContext';
import DatePicker from '../../components/ui/DatePicker';

export default function Loans() {
  const { styled } = useTheme();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);

  // Repayment Modal State
  const [repayTargetLoan, setRepayTargetLoan] = useState(null);
  const [repayForm, setRepayForm] = useState({ amount: '', paymentMethod: 'cash', reference: '', notes: '' });

  // Loan Detail History Modal State
  const [historyLoan, setHistoryLoan] = useState(null);

  const { data: loanData, isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: async () => { const r = await api.get('/loans'); return r.data?.data; },
  });

  const loans = loanData?.loans || [];
  const summary = loanData?.summary || {};

  const createLoanMutation = useMutation({
    mutationFn: async (data) => api.post('/loans', data),
    onSuccess: () => {
      toast.success('Loan record created');
      setShowAddLoanModal(false);
      qc.invalidateQueries({ queryKey: ['loans'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create loan record'),
  });

  const repayLoanMutation = useMutation({
    mutationFn: async ({ loanId, data }) => api.post(`/loans/${loanId}/repay`, data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Loan repayment recorded');
      setRepayTargetLoan(null);
      qc.invalidateQueries({ queryKey: ['loans'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Repayment failed'),
  });

  const deleteLoanMutation = useMutation({
    mutationFn: async (id) => api.delete(`/loans/${id}`),
    onSuccess: () => {
      toast.success('Loan record deleted');
      qc.invalidateQueries({ queryKey: ['loans'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete loan'),
  });

  const filteredLoans = loans.filter(l =>
    !search ||
    l.providerName?.toLowerCase().includes(search.toLowerCase()) ||
    l.accountNumber?.includes(search)
  );

  const cardCls = styled ? 'neu-card p-5' : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-5';
  const inputCls = styled ? 'neu-input w-full px-3 py-2 rounded-xl text-sm' : 'w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-red-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-red-600" /> Loans & Liabilities Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track bank loans, personal borrowings, repayment schedules, and outstanding balances</p>
        </div>
        <button
          onClick={() => setShowAddLoanModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-medium rounded-lg text-sm transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add New Loan
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Loan Principal</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">৳{(summary.totalBorrowed || 0).toLocaleString()}</div>
        </div>
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Outstanding Loan Due</div>
          <div className="text-2xl font-bold text-red-600 mt-1">৳{(summary.activeDueBalance || 0).toLocaleString()}</div>
        </div>
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Repaid</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">৳{(summary.totalRepaid || 0).toLocaleString()}</div>
        </div>
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Active Loans</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{summary.activeLoans || 0} Accounts</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by bank name, lender person or account #..."
          className={`${inputCls} pl-10`}
        />
      </div>

      {/* Loans Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-400 animate-pulse">Loading loan accounts...</div>
      ) : filteredLoans.length === 0 ? (
        <div className={`${cardCls} text-center py-12 text-gray-500`}>
          <Landmark className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No active loan accounts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLoans.map((loan) => (
            <div key={loan._id} className={`${cardCls} space-y-4 flex flex-col justify-between hover:border-red-500/50 transition-all`}>
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{loan.providerName}</h3>
                    {loan.accountNumber && (
                      <div className="text-xs font-mono text-gray-400 mt-0.5">Acc # {loan.accountNumber}</div>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    loan.status === 'Fully Repaid'
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200'
                      : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200'
                  }`}>
                    {loan.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-xl">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Principal</div>
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-200">৳{(loan.loanAmount || 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-xl">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Repaid</div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">৳{(loan.repaidAmount || 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-xl">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Remaining Due</div>
                    <div className="text-xs font-bold text-red-600 dark:text-red-400">৳{(loan.remainingDue || 0).toLocaleString()}</div>
                  </div>
                </div>

                {loan.dueDate && (
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                    <span>Due Date:</span>
                    <strong className="text-amber-600 font-mono">{new Date(loan.dueDate).toLocaleDateString()}</strong>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 text-xs">
                {loan.remainingDue > 0 ? (
                  <button
                    onClick={() => {
                      setRepayTargetLoan(loan);
                      setRepayForm({ amount: loan.remainingDue, paymentMethod: 'cash', reference: '', notes: '' });
                    }}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Repay Loan
                  </button>
                ) : (
                  <span className="flex-1 text-center py-1.5 text-xs text-emerald-600 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Cleared
                  </span>
                )}

                <button
                  onClick={async () => {
                    try {
                      const res = await api.get(`/loans/${loan._id}`);
                      setHistoryLoan(res.data?.data);
                    } catch { toast.error('Failed to load repayments'); }
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                  title="View Repayment History"
                >
                  <History className="w-4 h-4" />
                </button>

                <button
                  onClick={() => confirmDelete(`Delete loan record "${loan.providerName}"?`, () => deleteLoanMutation.mutate(loan._id))}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete Loan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Loan Modal */}
      {showAddLoanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setShowAddLoanModal(false)}>
          <div className={`${cardCls} w-full max-w-md p-6 shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b dark:border-gray-800 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-red-600" /> Record New Loan
              </h3>
              <button onClick={() => setShowAddLoanModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(ev) => {
              ev.preventDefault();
              const fd = new FormData(ev.target);
              createLoanMutation.mutate({
                providerName: fd.get('providerName'),
                accountNumber: fd.get('accountNumber'),
                loanAmount: Number(fd.get('loanAmount')),
                interestRate: Number(fd.get('interestRate')) || 0,
                dueDate: fd.get('dueDate') || undefined,
                notes: fd.get('notes'),
              });
            }} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Bank / Lender Name *</label>
                <input required name="providerName" placeholder="e.g. City Bank / Brac Bank / Mr. Rahim" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Loan Amount (৳) *</label>
                  <input type="number" required min="1" name="loanAmount" placeholder="e.g. 1000000" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Interest Rate %</label>
                  <input type="number" step="0.1" name="interestRate" placeholder="e.g. 9.5" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Account # (Optional)</label>
                  <input name="accountNumber" placeholder="e.g. 1104829101" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Due Date</label>
                  <input type="date" name="dueDate" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notes / Terms</label>
                <input name="notes" placeholder="e.g. Monthly instalment ৳25,000" className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddLoanModal(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={createLoanMutation.isPending} className="flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-lg text-sm">
                  {createLoanMutation.isPending ? 'Saving...' : 'Create Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repay Loan Instalment Modal */}
      {repayTargetLoan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setRepayTargetLoan(null)}>
          <div className={`${cardCls} w-full max-w-md p-6 shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b dark:border-gray-800 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" /> Repay Loan Instalment
              </h3>
              <button onClick={() => setRepayTargetLoan(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(ev) => {
              ev.preventDefault();
              repayLoanMutation.mutate({ loanId: repayTargetLoan._id, data: repayForm });
            }} className="space-y-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl space-y-1">
                <div className="text-xs text-gray-500">Bank / Lender: <strong className="text-gray-900 dark:text-gray-100">{repayTargetLoan.providerName}</strong></div>
                <div className="text-xs text-red-600 font-bold">Remaining Loan Due: ৳{(repayTargetLoan.remainingDue || 0).toLocaleString()}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Repayment Amount (৳) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={repayTargetLoan.remainingDue}
                  value={repayForm.amount}
                  onChange={(e) => setRepayForm({ ...repayForm, amount: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Payment Method *</label>
                <select
                  value={repayForm.paymentMethod}
                  onChange={(e) => setRepayForm({ ...repayForm, paymentMethod: e.target.value })}
                  className={inputCls}
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Reference / Voucher / TxID</label>
                <input
                  value={repayForm.reference}
                  onChange={(e) => setRepayForm({ ...repayForm, reference: e.target.value })}
                  placeholder="e.g. Bank Deposit Slip #99481"
                  className={inputCls}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setRepayTargetLoan(null)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={repayLoanMutation.isPending} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm">
                  {repayLoanMutation.isPending ? 'Processing...' : 'Confirm Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Repayment History Modal */}
      {historyLoan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setHistoryLoan(null)}>
          <div className={`${cardCls} w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b dark:border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{historyLoan.providerName} — Repayments</h3>
                <p className="text-xs text-gray-500">Principal: ৳{(historyLoan.loanAmount || 0).toLocaleString()} • Due: ৳{(historyLoan.remainingDue || 0).toLocaleString()}</p>
              </div>
              <button onClick={() => setHistoryLoan(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-gray-500 uppercase">Repayment Ledger</h4>
              {(historyLoan.repayments || []).length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">No repayment instalments recorded yet</div>
              ) : (
                (historyLoan.repayments || []).map((r) => (
                  <div key={r._id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-between text-xs border border-gray-100 dark:border-gray-800">
                    <div>
                      <span className="font-bold text-emerald-600">Repayment Instalment</span>
                      <div className="text-[11px] text-gray-400">{new Date(r.date || r.createdAt).toLocaleString()} • Via {r.paymentMethod}</div>
                      {r.reference && <div className="text-[11px] text-gray-500 font-mono">Ref: {r.reference}</div>}
                    </div>
                    <div className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">৳{r.amount?.toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
