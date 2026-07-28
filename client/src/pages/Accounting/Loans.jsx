import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Landmark,
  Plus,
  Search,
  Trash2,
  X,
  DollarSign,
  Calendar,
  Percent,
  CheckCircle2,
  History,
  AlertCircle,
  ShieldCheck,
  Clock,
  CalendarDays,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';
import { useTheme } from '../../context/ThemeContext';
import DatePicker from '../../components/ui/DatePicker';
import DocumentVaultModal from '../../components/DocumentVaultModal';
import AuditLogViewerModal from '../../components/AuditLogViewerModal';

export default function Loans() {
  const { styled } = useTheme();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [loanType, setLoanType] = useState('LOAN_TAKEN'); // 'LOAN_TAKEN' (Lender) | 'LOAN_GIVEN' (Borrower)
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);

  // Repayment Modal State
  const [repayTargetLoan, setRepayTargetLoan] = useState(null);
  const [repayForm, setRepayForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    reference: '',
    notes: '',
  });

  // Loan Detail History Modal State
  const [historyLoan, setHistoryLoan] = useState(null);

  // Installment Schedule View Modal State
  const [scheduleLoan, setScheduleLoan] = useState(null);

  // Document Vault & Audit Log Modal States
  const [vaultEntity, setVaultEntity] = useState(null);
  const [auditEntity, setAuditEntity] = useState(null);

  const { data: loanData, isLoading } = useQuery({
    queryKey: ['loans', loanType],
    queryFn: async () => {
      const r = await api.get(`/loans?type=${loanType}`);
      return r.data?.data;
    },
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

  const filteredLoans = loans.filter(
    (l) =>
      !search ||
      l.providerName?.toLowerCase().includes(search.toLowerCase()) ||
      l.accountNumber?.includes(search) ||
      l.phone?.includes(search)
  );

  const cardCls = styled
    ? 'neu-card p-5'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-5';
  const inputCls = styled
    ? 'neu-input w-full px-3 py-2 rounded-xl text-sm'
    : 'w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-red-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-red-600" /> Debt & Loan Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track inbound capital loans taken vs outbound loans extended to third parties
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Dual View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setLoanType('LOAN_TAKEN')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                loanType === 'LOAN_TAKEN'
                  ? 'bg-white dark:bg-gray-900 text-red-600 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" /> Loan Taken (Lenders)
            </button>
            <button
              onClick={() => setLoanType('LOAN_GIVEN')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                loanType === 'LOAN_GIVEN'
                  ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Loan Given (Borrowers)
            </button>
          </div>

          <button
            onClick={() =>
              setVaultEntity({
                id: loans[0]?._id || 'general',
                name: loanType === 'LOAN_TAKEN' ? 'Lenders Vault' : 'Borrowers Vault',
                type: loanType === 'LOAN_TAKEN' ? 'Lender' : 'Borrower',
              })
            }
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition-all"
            title="Open Document Vault"
          >
            <ShieldCheck className="w-4 h-4 text-red-600" /> Document Vault
          </button>

          <button
            onClick={() => setAuditEntity({ id: null, name: 'Loan Module' })}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition-all"
            title="Open Audit Trail"
          >
            <History className="w-4 h-4 text-amber-600" /> Audit Trail
          </button>

          <button
            onClick={() => setShowAddLoanModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-medium rounded-lg text-sm transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add{' '}
            {loanType === 'LOAN_TAKEN' ? 'Lender Loan' : 'Borrower Loan'}
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">
            {loanType === 'LOAN_TAKEN' ? 'Total Store Borrowed' : 'Total Loans Extended'}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            ৳{(summary.totalAmount || 0).toLocaleString()}
          </div>
        </div>
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">
            {loanType === 'LOAN_TAKEN' ? 'Outstanding Payable' : 'Outstanding Receivable'}
          </div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            ৳{(summary.activeDueBalance || 0).toLocaleString()}
          </div>
        </div>
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">
            Total Repaid / Received
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ৳{(summary.totalRepaid || 0).toLocaleString()}
          </div>
        </div>
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Active Accounts</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {summary.activeLoans || 0} Accounts
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            loanType === 'LOAN_TAKEN'
              ? 'Search lender name, bank, or phone...'
              : 'Search borrower name or phone...'
          }
          className={`${inputCls} pl-10`}
        />
      </div>

      {/* Loans Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-400 animate-pulse">Loading loan accounts...</div>
      ) : filteredLoans.length === 0 ? (
        <div className={`${cardCls} text-center py-12 text-gray-500`}>
          <Landmark className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No active {loanType === 'LOAN_TAKEN' ? 'Lender' : 'Borrower'} loan records found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLoans.map((loan) => (
            <div
              key={loan._id}
              className={`${cardCls} space-y-4 flex flex-col justify-between hover:border-red-500/50 transition-all relative`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                      {loan.providerName}
                    </h3>
                    {loan.accountNumber && (
                      <div className="text-xs font-mono text-gray-400 mt-0.5">
                        Acc # {loan.accountNumber}
                      </div>
                    )}
                    {loan.phone && (
                      <div className="text-xs text-gray-500 mt-0.5">Phone: {loan.phone}</div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        loan.status === 'Fully Repaid'
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {loan.status}
                    </span>

                    {/* RED/YELLOW Dynamic Notification Badges */}
                    {loan.alertStatus === 'OVERDUE' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500 text-white flex items-center gap-1 animate-pulse">
                        <AlertCircle className="w-3 h-3" /> OVERDUE
                      </span>
                    )}
                    {loan.alertStatus === 'UPCOMING' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-400 text-gray-900 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> DUE IN 3 DAYS
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-xl">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">
                      Total Amount
                    </div>
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      ৳{(loan.loanAmount || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-xl">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Cleared</div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ৳{(loan.repaidAmount || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-xl">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">
                      Remaining Due
                    </div>
                    <div className="text-xs font-bold text-red-600 dark:text-red-400">
                      ৳{(loan.remainingDue || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {loan.dueDate && (
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                    <span>Target Due Date:</span>
                    <strong className="text-amber-600 font-mono">
                      {new Date(loan.dueDate).toLocaleDateString()}
                    </strong>
                  </div>
                )}
              </div>

              {/* Actions & Buttons */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  {loan.remainingDue > 0 ? (
                    <button
                      onClick={() => {
                        setRepayTargetLoan(loan);
                        setRepayForm({
                          amount: loan.remainingDue,
                          paymentMethod: 'cash',
                          reference: '',
                          notes: '',
                        });
                      }}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Record Payment
                    </button>
                  ) : (
                    <span className="flex-1 text-center py-1.5 text-xs text-emerald-600 font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Fully Cleared
                    </span>
                  )}

                  <button
                    onClick={() => setScheduleLoan(loan)}
                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-red-600"
                    title="View Installment Schedule"
                  >
                    <CalendarDays className="w-4 h-4" />
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        const res = await api.get(`/loans/${loan._id}`);
                        setHistoryLoan(res.data?.data);
                      } catch {
                        toast.error('Failed to load repayments');
                      }
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                    title="View Repayment History"
                  >
                    <History className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      confirmDelete(`Delete loan record "${loan.providerName}"?`, () =>
                        deleteLoanMutation.mutate(loan._id)
                      )
                    }
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete Loan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-800 text-xs">
                  <button
                    onClick={() =>
                      setVaultEntity({
                        id: loan._id,
                        name: loan.providerName,
                        type: loan.type === 'LOAN_TAKEN' ? 'Lender' : 'Borrower',
                      })
                    }
                    className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 font-medium"
                  >
                    <ShieldCheck className="w-4 h-4 text-red-600" /> Document Vault
                  </button>
                  <button
                    onClick={() => setAuditEntity({ id: loan._id, name: loan.providerName })}
                    className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 font-medium"
                  >
                    <History className="w-4 h-4 text-amber-600" /> Audit Log
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Loan Modal */}
      {showAddLoanModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddLoanModal(false)}
        >
          <div
            className={`${cardCls} w-full max-w-md p-6 shadow-2xl space-y-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-red-600" /> Record{' '}
                {loanType === 'LOAN_TAKEN' ? 'Inbound Loan (Lender)' : 'Outbound Loan (Borrower)'}
              </h3>
              <button
                onClick={() => setShowAddLoanModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                const fd = new FormData(ev.target);
                createLoanMutation.mutate({
                  type: loanType,
                  providerName: fd.get('providerName'),
                  accountNumber: fd.get('accountNumber'),
                  phone: fd.get('phone'),
                  loanAmount: Number(fd.get('loanAmount')),
                  interestRate: Number(fd.get('interestRate')) || 0,
                  installmentCount: Number(fd.get('installmentCount')) || 1,
                  dueDate: fd.get('dueDate') || undefined,
                  notes: fd.get('notes'),
                });
              }}
              className="space-y-3.5 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  {loanType === 'LOAN_TAKEN'
                    ? 'Lender / Bank Name *'
                    : 'Borrower / Receiver Name *'}
                </label>
                <input
                  required
                  name="providerName"
                  placeholder={
                    loanType === 'LOAN_TAKEN'
                      ? 'e.g. City Bank / Mr. Rahim'
                      : 'e.g. Employee / Partner Name'
                  }
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Phone Number
                  </label>
                  <input name="phone" placeholder="01711..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Account #
                  </label>
                  <input
                    name="accountNumber"
                    placeholder="Bank Acc / Reference"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Principal (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    name="loanAmount"
                    placeholder="100000"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Interest %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="interestRate"
                    placeholder="9.5"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Installments
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="installmentCount"
                    defaultValue="1"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  First Due Date
                </label>
                <input type="date" name="dueDate" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Notes
                </label>
                <input name="notes" placeholder="Purpose or terms" className={inputCls} />
              </div>
              <button
                type="submit"
                disabled={createLoanMutation.isPending}
                className="w-full py-2.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all"
              >
                {createLoanMutation.isPending ? 'Saving...' : 'Save Loan Record'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Repay Loan Modal */}
      {repayTargetLoan && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setRepayTargetLoan(null)}
        >
          <div
            className={`${cardCls} w-full max-w-md p-6 shadow-2xl space-y-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                  Record Loan Repayment
                </h3>
                <p className="text-xs text-gray-500">
                  Party:{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {repayTargetLoan.providerName}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setRepayTargetLoan(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                repayLoanMutation.mutate({ loanId: repayTargetLoan._id, data: repayForm });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Payment Amount (৳) *
                </label>
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
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Payment Method
                </label>
                <select
                  value={repayForm.paymentMethod}
                  onChange={(e) => setRepayForm({ ...repayForm, paymentMethod: e.target.value })}
                  className={inputCls}
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Reference / Transaction ID
                </label>
                <input
                  type="text"
                  value={repayForm.reference}
                  onChange={(e) => setRepayForm({ ...repayForm, reference: e.target.value })}
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                disabled={repayLoanMutation.isPending}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all"
              >
                {repayLoanMutation.isPending ? 'Processing...' : 'Submit Repayment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Installment Schedule Table View Modal */}
      {scheduleLoan && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setScheduleLoan(null)}
        >
          <div
            className="bg-white dark:bg-[#111827] w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">
                    Repayment Schedule Table
                  </h3>
                  <p className="text-xs text-gray-500">{scheduleLoan.providerName}</p>
                </div>
              </div>
              <button
                onClick={() => setScheduleLoan(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {!scheduleLoan.installmentSchedule ||
              scheduleLoan.installmentSchedule.length === 0 ? (
                <p className="text-center py-6 text-xs text-gray-400">
                  No installment schedule generated for this loan.
                </p>
              ) : (
                <div className="space-y-2">
                  {scheduleLoan.installmentSchedule.map((inst) => (
                    <div
                      key={inst.installmentNo}
                      className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                          Installment #{inst.installmentNo}
                        </div>
                        <div className="text-gray-500 font-mono">
                          Due: {new Date(inst.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono text-sm text-gray-900 dark:text-gray-100">
                          ৳{Number(inst.amount).toLocaleString()}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inst.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : inst.status === 'Overdue'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}
                        >
                          {inst.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Repayment History Modal */}
      {historyLoan && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setHistoryLoan(null)}
        >
          <div
            className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Repayment Ledger</h3>
                <p className="text-xs text-gray-500">{historyLoan.providerName}</p>
              </div>
              <button
                onClick={() => setHistoryLoan(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {!historyLoan.repayments || historyLoan.repayments.length === 0 ? (
                <p className="text-center py-6 text-xs text-gray-400">
                  No repayment entries recorded yet.
                </p>
              ) : (
                historyLoan.repayments.map((rep) => (
                  <div
                    key={rep._id}
                    className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-gray-900 dark:text-gray-100 uppercase font-mono">
                        {rep.paymentMethod}
                      </div>
                      <div className="text-gray-500 font-mono">
                        {new Date(rep.date || rep.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-sm text-emerald-600">
                        ৳{Number(rep.amount).toLocaleString()}
                      </div>
                      <div className="text-gray-400">{rep.reference || '-'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Vault Modal */}
      {vaultEntity && (
        <DocumentVaultModal
          entityType={vaultEntity.type || 'Lender'}
          entityId={vaultEntity.id}
          entityName={vaultEntity.name}
          onClose={() => setVaultEntity(null)}
        />
      )}

      {/* Audit Log Modal */}
      {auditEntity && (
        <AuditLogViewerModal
          moduleName="Loan"
          entityId={auditEntity.id}
          entityTitle={auditEntity.name}
          onClose={() => setAuditEntity(null)}
        />
      )}
    </div>
  );
}
