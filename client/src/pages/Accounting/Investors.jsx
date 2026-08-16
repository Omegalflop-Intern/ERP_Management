import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calculator,
  DollarSign,
  FileText,
  History,
  Mail,
  MinusCircle,
  Percent,
  Phone,
  Plus,
  PlusCircle,
  Repeat,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import AuditLogViewerModal from '../../components/AuditLogViewerModal';
import DocumentVaultModal from '../../components/DocumentVaultModal';
import DatePicker from '../../components/ui/DatePicker';
import { NumberInput } from '../../components/ui/NumberInput';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';

export default function Investors() {
  const { styled } = useTheme();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'ledger' | 'auto-calculator'
  const [showAddInvestor, setShowAddInvestor] = useState(false);

  // Auto Calculator Date State
  const [calcStartDate, setCalcStartDate] = useState('');
  const [calcEndDate, setCalcEndDate] = useState('');

  // Modals state
  const [vaultEntity, setVaultEntity] = useState(null); // { id, name }
  const [auditEntity, setAuditEntity] = useState(null); // { id, name }

  // Transaction Modal State
  const [txTargetInvestor, setTxTargetInvestor] = useState(null);
  const [txForm, setTxForm] = useState({
    type: 'DEPOSIT', // DEPOSIT | WITHDRAWAL | PROFIT_SHARE | PROFIT_PAYOUT | PROFIT_REINVESTMENT
    amount: '',
    paymentMethod: 'cash',
    reference: '',
    notes: '',
  });

  // New Investor Form State
  const [newForm, setNewForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    sharePercentage: '',
    initialCapital: '',
    paymentMethod: 'cash',
    notes: '',
  });

  // Individual Investor History Modal State
  const [historyInvestor, setHistoryInvestor] = useState(null);

  const { data: investorsData, isLoading } = useQuery({
    queryKey: ['investors'],
    queryFn: async () => {
      const r = await api.get('/investors');
      return r.data?.data;
    },
  });

  const { data: allTransactions } = useQuery({
    queryKey: ['investor-transactions'],
    queryFn: async () => {
      const r = await api.get('/investors/transactions');
      return r.data?.data;
    },
    enabled: activeTab === 'ledger',
  });

  const {
    data: calcData,
    isLoading: isCalcLoading,
    refetch: refetchCalc,
  } = useQuery({
    queryKey: ['profit-loss-calc', calcStartDate, calcEndDate],
    queryFn: async () => {
      const r = await api.get(
        `/investors/profit-loss/calculate?startDate=${calcStartDate}&endDate=${calcEndDate}`
      );
      return r.data?.data;
    },
    enabled: activeTab === 'auto-calculator',
  });

  const investors = investorsData?.investors || [];
  const summary = investorsData?.summary || {};

  const createInvestorMutation = useMutation({
    mutationFn: async (data) => api.post('/investors', data),
    onSuccess: () => {
      toast.success('Investor registered successfully');
      setShowAddInvestor(false);
      setNewForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        sharePercentage: 0,
        initialCapital: 0,
        paymentMethod: 'cash',
        notes: '',
      });
      qc.invalidateQueries({ queryKey: ['investors'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create investor'),
  });

  const createTxMutation = useMutation({
    mutationFn: async ({ investorId, data }) =>
      api.post(`/investors/${investorId}/transactions`, data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Transaction recorded');
      setTxTargetInvestor(null);
      qc.invalidateQueries({ queryKey: ['investors'] });
      qc.invalidateQueries({ queryKey: ['investor-transactions'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Transaction failed'),
  });

  const distributeMutation = useMutation({
    mutationFn: async (distData) => api.post('/investors/profit-loss/distribute', distData),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Distribution processed');
      qc.invalidateQueries({ queryKey: ['investors'] });
      qc.invalidateQueries({ queryKey: ['profit-loss-calc'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Distribution failed'),
  });

  const filteredInvestors = investors.filter(
    (i) =>
      !search ||
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.phone?.includes(search) ||
      i.email?.toLowerCase().includes(search.toLowerCase())
  );

  const cardCls = styled
    ? 'neu-card p-5'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-5';
  const inputCls = styled
    ? 'neu-input w-full px-3 py-2 rounded-xl text-sm'
    : 'w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-[#2563EB]';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-red-600" /> Investors & Capital Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track equity investors, capital deposits, withdrawals, and profit shares
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'directory' ? 'bg-white dark:bg-gray-900 text-red-600 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'}`}
            >
              Directory
            </button>
            <button
              onClick={() => setActiveTab('auto-calculator')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'auto-calculator' ? 'bg-white dark:bg-gray-900 text-red-600 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'}`}
            >
              <Calculator className="w-3.5 h-3.5 inline mr-1" /> Auto Profit Engine
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'ledger' ? 'bg-white dark:bg-gray-900 text-red-600 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'}`}
            >
              All Transactions
            </button>
          </div>

          <button
            onClick={() =>
              setVaultEntity({ id: investors[0]?._id || 'general', name: 'Investors Vault' })
            }
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition-all"
            title="Open Document Vault"
          >
            <ShieldCheck className="w-4 h-4 text-red-600" /> Document Vault
          </button>

          <button
            onClick={() => setAuditEntity({ id: null, name: 'Investor Module' })}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition-all"
            title="Open Audit Trail"
          >
            <History className="w-4 h-4 text-amber-600" /> Audit Trail
          </button>

          <button
            onClick={() => setShowAddInvestor(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-lg text-sm transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Investor
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">
            Total Capital Invested
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            ৳{(summary.totalInvested || 0).toLocaleString()}
          </div>
        </div>
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">
            Active Capital Balance
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ৳{(summary.activeBalance || 0).toLocaleString()}
          </div>
        </div>
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">
            Total Profit Distributed
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            ৳{(summary.totalProfitPaid || 0).toLocaleString()}
          </div>
        </div>
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Active Investors</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {summary.activeInvestors || 0} Partners
          </div>
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
            <div className="p-12 text-center text-gray-400 animate-pulse">
              Loading investor directory...
            </div>
          ) : filteredInvestors.length === 0 ? (
            <div className={`${cardCls} text-center py-12 text-gray-500`}>
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No investors registered yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInvestors.map((investor) => (
                <div
                  key={investor._id}
                  className={`${cardCls} space-y-4 relative flex flex-col justify-between hover:border-red-500/50 transition-all`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                          {investor.name}
                        </h3>
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
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">
                          Invested
                        </div>
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          ৳{(investor.totalInvested || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-xl">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">
                          Active Balance
                        </div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ৳{(investor.currentBalance || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-xl">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">
                          Profit Paid
                        </div>
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          ৳{(investor.totalProfitPaid || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Vault/Audit Links */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                    <div className="flex items-center justify-between gap-1 text-xs">
                      <button
                        onClick={() => {
                          setTxTargetInvestor(investor);
                          setTxForm({
                            type: 'DEPOSIT',
                            amount: '',
                            paymentMethod: 'cash',
                            reference: '',
                            notes: '',
                          });
                        }}
                        className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg font-bold flex items-center gap-1 transition-all"
                        title="Add Capital Investment"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Inject
                      </button>
                      <button
                        onClick={() => {
                          setTxTargetInvestor(investor);
                          setTxForm({
                            type: 'PROFIT_SHARE',
                            amount: '',
                            paymentMethod: 'cash',
                            reference: '',
                            notes: '',
                          });
                        }}
                        className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 rounded-lg font-bold flex items-center gap-1 transition-all"
                        title="Pay Profit Share Dividend"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Payout
                      </button>
                      <button
                        onClick={() => {
                          setTxTargetInvestor(investor);
                          setTxForm({
                            type: 'WITHDRAWAL',
                            amount: '',
                            paymentMethod: 'cash',
                            reference: '',
                            notes: '',
                          });
                        }}
                        className="px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 rounded-lg font-bold flex items-center gap-1 transition-all"
                        title="Capital Withdrawal"
                      >
                        <MinusCircle className="w-3.5 h-3.5" /> Withdraw
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-800 text-xs">
                      <button
                        onClick={() => setVaultEntity({ id: investor._id, name: investor.name })}
                        className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 font-medium"
                      >
                        <ShieldCheck className="w-4 h-4 text-red-600" /> Document Vault
                      </button>
                      <button
                        onClick={() => setAuditEntity({ id: investor._id, name: investor.name })}
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
        </div>
      )}

      {/* Auto Profit / Loss Calculator Engine Tab */}
      {activeTab === 'auto-calculator' && (
        <div className="space-y-6">
          <div className={cardCls}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-red-600" /> Automated Profit/Loss Share
                  Calculator
                </h3>
                <p className="text-xs text-gray-500">
                  Fetches Income Statement Net Profit and calculates share per registered percentage
                </p>
              </div>
              <div className="flex items-center gap-2">
                <DatePicker
                  value={calcStartDate}
                  onChange={(val) => setCalcStartDate(val)}
                  placeholder="Start Date"
                />
                <span className="text-xs text-gray-400">to</span>
                <DatePicker
                  value={calcEndDate}
                  onChange={(val) => setCalcEndDate(val)}
                  placeholder="End Date"
                />
                <button
                  onClick={() => refetchCalc()}
                  className="px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-lg transition-all shadow-xs"
                >
                  Recalculate
                </button>
              </div>
            </div>

            {/* Calculated Results */}
            {isCalcLoading ? (
              <p className="py-8 text-center text-xs text-gray-400">
                Calculating Net Profit & Distribution Shares...
              </p>
            ) : !calcData ? (
              <p className="py-8 text-center text-xs text-gray-400">
                No calculation data retrieved.
              </p>
            ) : (
              <div className="mt-4 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl">
                    <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase">
                      Period Net Profit
                    </div>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      ৳{(calcData.netProfit || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl">
                    <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase">
                      Total Partner Allocation
                    </div>
                    <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                      {calcData.totalPercentageAllocated || 0}% Allocated
                    </div>
                  </div>
                </div>

                {/* Partner Share Breakdown Cards */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-3">
                    Partner Calculated Shares
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {calcData.shares?.map((share) => (
                      <div
                        key={share.investorId}
                        className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex flex-col justify-between space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-base text-gray-900 dark:text-gray-100">
                              {share.name}
                            </div>
                            <div className="text-xs text-gray-500">{share.phone}</div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            {share.sharePercentage}% Share
                          </span>
                        </div>

                        <div className="p-3 bg-white dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase font-semibold">
                              Calculated Share
                            </div>
                            <div className="text-xl font-extrabold text-red-600 dark:text-red-400">
                              ৳{(share.calculatedShare || 0).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-gray-400 uppercase font-semibold">
                              Current Balance
                            </div>
                            <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                              ৳{(share.currentBalance || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Direct Action Buttons: Pay Out vs Reinvest */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() =>
                              distributeMutation.mutate({
                                investorId: share.investorId,
                                actionType: 'PAYOUT',
                                amount: share.calculatedShare,
                                paymentMethod: 'cash',
                                reference: `Profit Share Payout (${share.sharePercentage}%)`,
                              })
                            }
                            disabled={distributeMutation.isPending || share.calculatedShare <= 0}
                            className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1"
                          >
                            <DollarSign className="w-4 h-4" /> Pay Out (Cash/Bank)
                          </button>
                          <button
                            onClick={() =>
                              distributeMutation.mutate({
                                investorId: share.investorId,
                                actionType: 'REINVEST',
                                amount: share.calculatedShare,
                                paymentMethod: 'cash',
                                reference: `Reinvested Profit Share (${share.sharePercentage}%)`,
                              })
                            }
                            disabled={distributeMutation.isPending || share.calculatedShare <= 0}
                            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1"
                          >
                            <Repeat className="w-4 h-4" /> Reinvest (Add Capital)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Transactions Ledger Tab */}
      {activeTab === 'ledger' && (
        <div className={`${cardCls} overflow-x-auto p-0`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left bg-gray-50/50 dark:bg-gray-900/50">
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Investor
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Type</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Method</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-right">
                  Amount
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Reference / Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {!allTransactions || allTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">
                    No transactions recorded yet
                  </td>
                </tr>
              ) : (
                allTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {new Date(tx.date || tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">
                      {tx.investorId?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          tx.type === 'DEPOSIT' || tx.type === 'PROFIT_REINVESTMENT'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : tx.type === 'WITHDRAWAL'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 uppercase text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {tx.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold font-mono text-gray-900 dark:text-gray-100">
                      ৳{Number(tx.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {tx.reference || tx.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Investor Modal */}
      {showAddInvestor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                Register New Investor
              </h3>
              <button
                onClick={() => setShowAddInvestor(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createInvestorMutation.mutate(newForm);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Rahat Chowdhury"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newForm.phone}
                    onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                    className={inputCls}
                    placeholder="01711..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newForm.email}
                    onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                    className={inputCls}
                    placeholder="investor@domain.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Profit Share (%)
                  </label>
                  <NumberInput
                    min="0"
                    max="100"
                    value={newForm.sharePercentage}
                    onChange={(e) =>
                      setNewForm({ ...newForm, sharePercentage: Number(e.target.value) })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Initial Capital (৳)
                  </label>
                  <NumberInput
                    min="0"
                    value={newForm.initialCapital}
                    onChange={(e) =>
                      setNewForm({ ...newForm, initialCapital: Number(e.target.value) })
                    }
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newForm.address}
                  onChange={(e) => setNewForm({ ...newForm, address: e.target.value })}
                  className={inputCls}
                  placeholder="Dhaka, Bangladesh"
                />
              </div>
              <button
                type="submit"
                disabled={createInvestorMutation.isPending}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl text-sm transition-all"
              >
                {createInvestorMutation.isPending ? 'Saving...' : 'Register Investor'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Capital Transaction Modal */}
      {txTargetInvestor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                  Record Capital Transaction
                </h3>
                <p className="text-xs text-gray-500">
                  Investor:{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {txTargetInvestor.name}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setTxTargetInvestor(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTxMutation.mutate({
                  investorId: txTargetInvestor._id || txTargetInvestor.id,
                  data: {
                    ...txForm,
                    amount: Number(txForm.amount),
                  },
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Transaction Type
                </label>
                <select
                  value={txForm.type}
                  onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                  className={inputCls}
                >
                  <option value="DEPOSIT">DEPOSIT (Inject Capital)</option>
                  <option value="WITHDRAWAL">WITHDRAWAL (Capital Return)</option>
                  <option value="PROFIT_SHARE">PROFIT_SHARE (Pay Dividend)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Amount (৳) *
                </label>
                <NumberInput
                  min="1"
                  required
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. 50000"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Payment Method
                </label>
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
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Reference / Note
                </label>
                <input
                  type="text"
                  value={txForm.reference}
                  onChange={(e) => setTxForm({ ...txForm, reference: e.target.value })}
                  className={inputCls}
                  placeholder="Check # or transaction ID"
                />
              </div>
              <button
                type="submit"
                disabled={createTxMutation.isPending}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl text-sm transition-all"
              >
                {createTxMutation.isPending ? 'Processing...' : 'Submit Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Document Vault Modal */}
      {vaultEntity && (
        <DocumentVaultModal
          entityType="Investor"
          entityId={vaultEntity.id}
          entityName={vaultEntity.name}
          onClose={() => setVaultEntity(null)}
        />
      )}

      {/* Audit Log Modal */}
      {auditEntity && (
        <AuditLogViewerModal
          moduleName="Investor"
          entityId={auditEntity.id}
          entityTitle={auditEntity.name}
          onClose={() => setAuditEntity(null)}
        />
      )}

      {/* Individual Investor History Ledger Modal */}
      {historyInvestor && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setHistoryInvestor(null)}
        >
          <div
            className="bg-white dark:bg-[#111827] w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                  Investor Ledger Statement
                </h3>
                <p className="text-xs text-gray-500">
                  Partner:{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {historyInvestor.name}
                  </span>{' '}
                  ({historyInvestor.phone})
                </p>
              </div>
              <button
                onClick={() => setHistoryInvestor(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {/* Investor Summary Card */}
              <div className="grid grid-cols-3 gap-2 text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">
                    Total Invested
                  </div>
                  <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    ৳{(historyInvestor.totalInvested || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">
                    Current Balance
                  </div>
                  <div className="text-sm font-bold text-emerald-600">
                    ৳{(historyInvestor.currentBalance || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">
                    Total Profit Paid
                  </div>
                  <div className="text-sm font-bold text-blue-600">
                    ৳{(historyInvestor.totalProfitPaid || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                  Transaction Records ({historyInvestor.transactions?.length || 0})
                </h4>
                {!historyInvestor.transactions || historyInvestor.transactions.length === 0 ? (
                  <p className="text-center py-6 text-xs text-gray-400">
                    No transaction records found for this investor.
                  </p>
                ) : (
                  historyInvestor.transactions.map((tx) => (
                    <div
                      key={tx._id}
                      className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              tx.type === 'DEPOSIT' || tx.type === 'PROFIT_REINVESTMENT'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : tx.type === 'WITHDRAWAL'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                            }`}
                          >
                            {tx.type}
                          </span>
                          <span className="text-gray-500 font-mono">
                            {new Date(tx.date || tx.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {tx.reference && <div className="text-gray-400 mt-1">{tx.reference}</div>}
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold font-mono text-sm text-gray-900 dark:text-gray-100">
                          ৳{Number(tx.amount || 0).toLocaleString()}
                        </div>
                        <div className="text-gray-400 uppercase font-semibold text-[10px]">
                          {tx.paymentMethod}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
