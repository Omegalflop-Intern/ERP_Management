import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Users, Plus, Wallet, TrendingUp, ArrowDownRight, ArrowUpRight, DollarSign,
  PlusCircle, MinusCircle, History, X, Search, Building2, Phone, Mail, Percent, FileText
} from 'lucide-react';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import DatePicker from '../../components/ui/DatePicker';

export default function Investors() {
  const { styled } = useTheme();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'ledger'
  const [showAddInvestor, setShowAddInvestor] = useState(false);

  // Transaction Modal State
  const [txTargetInvestor, setTxTargetInvestor] = useState(null);
  const [txForm, setTxForm] = useState({
    type: 'DEPOSIT', // DEPOSIT | WITHDRAWAL | PROFIT_SHARE
    amount: '',
    paymentMethod: 'cash',
    reference: '',
    notes: '',
  });

  // Individual Investor History Modal State
  const [historyInvestor, setHistoryInvestor] = useState(null);

  const { data: investorsData, isLoading } = useQuery({
    queryKey: ['investors'],
    queryFn: async () => { const r = await api.get('/investors'); return r.data?.data; },
  });

  const { data: allTransactions } = useQuery({
    queryKey: ['investor-transactions'],
    queryFn: async () => { const r = await api.get('/investors/transactions'); return r.data?.data; },
    enabled: activeTab === 'ledger',
  });

  const investors = investorsData?.investors || [];
  const summary = investorsData?.summary || {};

  const createInvestorMutation = useMutation({
    mutationFn: async (data) => api.post('/investors', data),
    onSuccess: () => {
      toast.success('Investor registered successfully');
      setShowAddInvestor(false);
      qc.invalidateQueries({ queryKey: ['investors'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create investor'),
  });

  const createTxMutation = useMutation({
    mutationFn: async ({ investorId, data }) => api.post(`/investors/${investorId}/transactions`, data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Transaction recorded');
      setTxTargetInvestor(null);
      qc.invalidateQueries({ queryKey: ['investors'] });
      qc.invalidateQueries({ queryKey: ['investor-transactions'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Transaction failed'),
  });

  const filteredInvestors = investors.filter(i =>
    !search ||
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.phone?.includes(search) ||
    i.email?.toLowerCase().includes(search.toLowerCase())
  );

  const cardCls = styled ? 'neu-card p-5' : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-5';
  const inputCls = styled ? 'neu-input w-full px-3 py-2 rounded-xl text-sm' : 'w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-red-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-red-600" /> Investors & Capital Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track equity investors, capital deposits, withdrawals, and profit shares</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'directory' ? 'bg-white dark:bg-gray-900 text-red-600 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'}`}
            >
              Directory
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'ledger' ? 'bg-white dark:bg-gray-900 text-red-600 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'}`}
            >
              All Transactions
            </button>
          </div>
          <button
            onClick={() => setShowAddInvestor(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-medium rounded-lg text-sm transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Investor
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Capital Invested</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">৳{(summary.totalInvested || 0).toLocaleString()}</div>
        </div>
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Active Capital Balance</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">৳{(summary.activeBalance || 0).toLocaleString()}</div>
        </div>
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Profit Distributed</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">৳{(summary.totalProfitPaid || 0).toLocaleString()}</div>
        </div>
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Active Investors</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{summary.activeInvestors || 0} Partners</div>
        </div>
      </div>

      {/* Directory Tab */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by investor name, phone or email..."
              className={`${inputCls} pl-10`}
            />
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-gray-400 animate-pulse">Loading investor directory...</div>
          ) : filteredInvestors.length === 0 ? (
            <div className={`${cardCls} text-center py-12 text-gray-500`}>
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No investors registered yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInvestors.map((investor) => (
                <div key={investor._id} className={`${cardCls} space-y-4 relative flex flex-col justify-between hover:border-red-500/50 transition-all`}>
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{investor.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <Phone className="w-3.5 h-3.5" /> {investor.phone}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        {investor.sharePercentage || 0}% Profit Share
                      </span>
                    </div>

                    {investor.email && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                        <Mail className="w-3.5 h-3.5" /> {investor.email}
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-xl">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Invested</div>
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200">৳{(investor.totalInvested || 0).toLocaleString()}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-xl">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Active Balance</div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">৳{(investor.currentBalance || 0).toLocaleString()}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-xl">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Profit Paid</div>
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400">৳{(investor.totalProfitPaid || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-1 text-xs">
                    <button
                      onClick={() => {
                        setTxTargetInvestor(investor);
                        setTxForm({ type: 'DEPOSIT', amount: '', paymentMethod: 'cash', reference: '', notes: '' });
                      }}
                      className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg font-bold flex items-center gap-1 transition-all"
                      title="Add Capital Investment"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Inject
                    </button>
                    <button
                      onClick={() => {
                        setTxTargetInvestor(investor);
                        setTxForm({ type: 'PROFIT_SHARE', amount: '', paymentMethod: 'cash', reference: '', notes: '' });
                      }}
                      className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 rounded-lg font-bold flex items-center gap-1 transition-all"
                      title="Pay Profit Share Dividend"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Payout
                    </button>
                    <button
                      onClick={() => {
                        setTxTargetInvestor(investor);
                        setTxForm({ type: 'WITHDRAWAL', amount: '', paymentMethod: 'cash', reference: '', notes: '' });
                      }}
                      className="px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 rounded-lg font-bold flex items-center gap-1 transition-all"
                      title="Capital Withdrawal"
                    >
                      <MinusCircle className="w-3.5 h-3.5" /> Withdraw
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await api.get(`/investors/${investor._id}`);
                          setHistoryInvestor(res.data?.data);
                        } catch { toast.error('Failed to load history'); }
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      title="View Ledger History"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Transactions Ledger Tab */}
      {activeTab === 'ledger' && (
        <div className={`${cardCls} overflow-x-auto p-0`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left bg-gray-50/50 dark:bg-gray-900/50">
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Investor</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Type</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Amount</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Method</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Reference / Notes</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {allTransactions?.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No investment transactions recorded yet</td></tr>
              ) : (
                (allTransactions || []).map((t) => (
                  <tr key={t._id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(t.date || t.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{t.investorId?.name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        t.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200' :
                        t.type === 'PROFIT_SHARE' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200' :
                        'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200'
                      }`}>
                        {t.type === 'DEPOSIT' ? '+ Deposit Capital' : t.type === 'PROFIT_SHARE' ? 'Profit Dividend' : '- Withdrawal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-gray-100">৳{t.amount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs uppercase font-semibold text-gray-500">{t.paymentMethod}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.reference || t.notes || 'N/A'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{t.recordedBy || 'System'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Investor Modal */}
      {showAddInvestor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setShowAddInvestor(false)}>
          <div className={`${cardCls} w-full max-w-md p-6 shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b dark:border-gray-800 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-red-600" /> Add New Investor / Partner
              </h3>
              <button onClick={() => setShowAddInvestor(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              createInvestorMutation.mutate({
                name: fd.get('name'),
                phone: fd.get('phone'),
                email: fd.get('email'),
                address: fd.get('address'),
                sharePercentage: Number(fd.get('sharePercentage')) || 0,
                initialCapital: Number(fd.get('initialCapital')) || 0,
                paymentMethod: fd.get('paymentMethod') || 'cash',
                notes: fd.get('notes'),
              });
            }} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Investor Name *</label>
                <input required name="name" placeholder="e.g. Tanvir Ahmed" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone *</label>
                  <input required name="phone" placeholder="01700000000" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Profit Share %</label>
                  <input type="number" min="0" max="100" name="sharePercentage" placeholder="e.g. 25" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                <input type="email" name="email" placeholder="investor@example.com" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Initial Capital (৳)</label>
                  <input type="number" min="0" name="initialCapital" placeholder="e.g. 500000" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Payment Method</label>
                  <select name="paymentMethod" className={inputCls}>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notes / Address</label>
                <input name="notes" placeholder="e.g. Capital deposit via Bank LC" className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddInvestor(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={createInvestorMutation.isPending} className="flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-lg text-sm">
                  {createInvestorMutation.isPending ? 'Saving...' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal (Inject / Payout / Withdraw) */}
      {txTargetInvestor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setTxTargetInvestor(null)}>
          <div className={`${cardCls} w-full max-w-md p-6 shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b dark:border-gray-800 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                {txForm.type === 'DEPOSIT' ? 'Inject Capital Deposit' : txForm.type === 'PROFIT_SHARE' ? 'Pay Profit Dividend' : 'Capital Withdrawal'}
              </h3>
              <button onClick={() => setTxTargetInvestor(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              createTxMutation.mutate({ investorId: txTargetInvestor._id, data: txForm });
            }} className="space-y-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl space-y-1">
                <div className="text-xs text-gray-500">Partner: <strong className="text-gray-900 dark:text-gray-100">{txTargetInvestor.name}</strong> ({txTargetInvestor.phone})</div>
                <div className="text-xs text-emerald-600 font-bold">Active Capital Balance: ৳{(txTargetInvestor.currentBalance || 0).toLocaleString()}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Transaction Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'DEPOSIT', label: 'Deposit Capital' },
                    { id: 'PROFIT_SHARE', label: 'Profit Payout' },
                    { id: 'WITHDRAWAL', label: 'Withdrawal' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTxForm({ ...txForm, type: t.id })}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all ${
                        txForm.type === t.id
                          ? t.id === 'DEPOSIT' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30' :
                            t.id === 'PROFIT_SHARE' ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30' :
                            'border-red-600 bg-red-50 text-red-700 dark:bg-red-900/30'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Amount (৳) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. 100000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Payment Method *</label>
                <select
                  value={txForm.paymentMethod}
                  onChange={(e) => setTxForm({ ...txForm, paymentMethod: e.target.value })}
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
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Reference / Cheque / TxID</label>
                <input
                  value={txForm.reference}
                  onChange={(e) => setTxForm({ ...txForm, reference: e.target.value })}
                  placeholder="e.g. Bank Cheque #884920"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notes</label>
                <input
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  placeholder="e.g. Q3 Profit dividend distribution"
                  className={inputCls}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setTxTargetInvestor(null)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={createTxMutation.isPending} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm">
                  {createTxMutation.isPending ? 'Processing...' : 'Confirm Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Investor History Ledger Modal */}
      {historyInvestor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setHistoryInvestor(null)}>
          <div className={`${cardCls} w-full max-w-xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b dark:border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{historyInvestor.name} — Investment Ledger</h3>
                <p className="text-xs text-gray-500">{historyInvestor.phone} • {historyInvestor.sharePercentage}% Profit Share</p>
              </div>
              <button onClick={() => setHistoryInvestor(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
              <div className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded-xl">
                <span className="text-gray-400 block uppercase">Total Invested</span>
                <strong className="text-gray-900 dark:text-gray-100 text-sm">৳{(historyInvestor.totalInvested || 0).toLocaleString()}</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded-xl">
                <span className="text-gray-400 block uppercase">Active Balance</span>
                <strong className="text-emerald-600 text-sm">৳{(historyInvestor.currentBalance || 0).toLocaleString()}</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded-xl">
                <span className="text-gray-400 block uppercase">Profit Paid</span>
                <strong className="text-blue-600 text-sm">৳{(historyInvestor.totalProfitPaid || 0).toLocaleString()}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-gray-500 uppercase">Transaction History</h4>
              {(historyInvestor.transactions || []).length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">No transactions recorded for this investor</div>
              ) : (
                (historyInvestor.transactions || []).map((t) => (
                  <div key={t._id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-between text-xs border border-gray-100 dark:border-gray-800">
                    <div>
                      <span className={`font-bold ${
                        t.type === 'DEPOSIT' ? 'text-emerald-600' :
                        t.type === 'PROFIT_SHARE' ? 'text-blue-600' :
                        'text-red-600'
                      }`}>
                        {t.type === 'DEPOSIT' ? '+ Deposit Capital' : t.type === 'PROFIT_SHARE' ? 'Profit Dividend Payout' : '- Capital Withdrawal'}
                      </span>
                      <div className="text-[11px] text-gray-400">{new Date(t.date || t.createdAt).toLocaleString()} • Via {t.paymentMethod}</div>
                      {t.reference && <div className="text-[11px] text-gray-500 font-mono">Ref: {t.reference}</div>}
                    </div>
                    <div className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">৳{t.amount?.toLocaleString()}</div>
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
