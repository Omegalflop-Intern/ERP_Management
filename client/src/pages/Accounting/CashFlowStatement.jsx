import { useQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  Banknote,
  Building,
  DollarSign,
  Download,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import DatePicker from '../../components/ui/DatePicker';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';

export default function CashFlowStatement() {
  const [from, setFrom] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const { styled } = useTheme();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cash-flow', from, to],
    queryFn: async () => {
      const res = await api.get('/accounting/reports/cash-flow', { params: { from, to } });
      return res.data?.data;
    },
  });

  const cardClass = styled
    ? 'neu-card p-5'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-5';

  const netOperating = data?.operating?.netCashFlow || 0;
  const netInvesting = data?.investing?.netCashFlow || 0;
  const netFinancing = data?.financing?.netCashFlow || 0;
  const netChange = data?.netCashChange || 0;

  const SectionHeader = ({ icon: Icon, title, color, netCash }) => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <div
        className={`text-lg font-bold font-mono ${netCash >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
      >
        {netCash >= 0 ? '+' : ''}৳{netCash.toLocaleString()}
      </div>
    </div>
  );

  const CashRow = ({ label, amount, isOutflow }) => (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        {isOutflow ? (
          <ArrowUp className="w-3.5 h-3.5 text-red-400" />
        ) : (
          <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
        )}
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <span
        className={`text-sm font-mono font-semibold ${isOutflow ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
      >
        {isOutflow ? '-' : '+'}৳{(amount || 0).toLocaleString()}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Banknote className="w-6 h-6 text-emerald-600" /> Cash Flow Statement
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track cash inflows and outflows from operating, investing, and financing activities
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              From
            </label>
            <DatePicker value={from} onChange={setFrom} placeholder="From Date" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              To
            </label>
            <DatePicker value={to} onChange={setTo} placeholder="To Date" />
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className={
              styled
                ? 'neu-btn p-2.5'
                : 'p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
            }
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await api.get('/accounting/reports/cash-flow/pdf', {
                  params: { from, to },
                  responseType: 'blob',
                });
                const url = window.URL.createObjectURL(
                  new Blob([res.data], { type: 'application/pdf' })
                );
                const a = document.createElement('a');
                a.href = url;
                a.download = 'cash-flow.pdf';
                a.click();
                window.URL.revokeObjectURL(url);
              } catch {
                /* ignore */
              }
            }}
            className={
              styled
                ? 'neu-btn p-2.5'
                : 'p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
            }
            title="Download PDF"
          >
            <Download className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={cardClass}>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className={cardClass}>
              <div className="text-xs font-semibold text-gray-500 uppercase flex items-center justify-between">
                <span>Operating Activities</span>
                <Wallet className="w-4 h-4 text-blue-500" />
              </div>
              <div
                className={`text-2xl font-bold mt-2 font-mono ${netOperating >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {netOperating >= 0 ? '+' : ''}৳{netOperating.toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                Cash from daily business operations
              </div>
            </div>

            <div className={cardClass}>
              <div className="text-xs font-semibold text-gray-500 uppercase flex items-center justify-between">
                <span>Investing Activities</span>
                <Building className="w-4 h-4 text-purple-500" />
              </div>
              <div
                className={`text-2xl font-bold mt-2 font-mono ${netInvesting >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {netInvesting >= 0 ? '+' : ''}৳{netInvesting.toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Asset purchases and investments</div>
            </div>

            <div className={cardClass}>
              <div className="text-xs font-semibold text-gray-500 uppercase flex items-center justify-between">
                <span>Financing Activities</span>
                <DollarSign className="w-4 h-4 text-amber-500" />
              </div>
              <div
                className={`text-2xl font-bold mt-2 font-mono ${netFinancing >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {netFinancing >= 0 ? '+' : ''}৳{netFinancing.toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Investor capital and loans</div>
            </div>
          </div>

          {/* Net Cash Change Banner */}
          <div
            className={`${cardClass} ${netChange >= 0 ? 'border-l-4 border-emerald-500' : 'border-l-4 border-red-500'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {netChange >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Net Change in Cash
                  </h3>
                  <p className="text-xs text-gray-500">Operating + Investing + Financing</p>
                </div>
              </div>
              <div
                className={`text-3xl font-bold font-mono ${netChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {netChange >= 0 ? '+' : ''}৳{netChange.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Detailed Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Operating Activities */}
            <div className={cardClass}>
              <SectionHeader
                icon={Wallet}
                title="Operating"
                color="text-blue-500"
                netCash={netOperating}
              />
              <div className="space-y-1 border-t border-gray-100 dark:border-gray-800 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Cash Inflows</p>
                <CashRow
                  label="Sales (Cash/Bank/Mobile)"
                  amount={data?.operating?.inflows?.sales}
                />
                <CashRow
                  label="Due Collections"
                  amount={data?.operating?.inflows?.dueCollections}
                />
                <CashRow
                  label="Repair Services"
                  amount={data?.operating?.inflows?.repairServices}
                />
                <div className="border-t border-gray-100 dark:border-gray-800 my-2" />
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Cash Outflows</p>
                <CashRow
                  label="Shop Expenses"
                  amount={data?.operating?.outflows?.expenses}
                  isOutflow
                />
                <CashRow label="Payroll" amount={data?.operating?.outflows?.payroll} isOutflow />
              </div>
              {/* Expense Category Breakdown */}
              {data?.operating?.expensesByCategory &&
                Object.keys(data.operating.expensesByCategory).length > 0 && (
                  <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                      Expense Breakdown
                    </p>
                    {Object.entries(data.operating.expensesByCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cat, amt]) => (
                        <div key={cat} className="flex justify-between text-xs py-1">
                          <span className="text-gray-500">{cat}</span>
                          <span className="font-mono text-red-500">৳{amt.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                )}
            </div>

            {/* Investing Activities */}
            <div className={cardClass}>
              <SectionHeader
                icon={Building}
                title="Investing"
                color="text-purple-500"
                netCash={netInvesting}
              />
              <div className="space-y-1 border-t border-gray-100 dark:border-gray-800 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Cash Outflows</p>
                <CashRow
                  label="Asset Purchases"
                  amount={data?.investing?.outflows?.assetPurchases}
                  isOutflow
                />
              </div>
              {data?.investing?.outflows?.assets?.length > 0 && (
                <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    Assets Acquired
                  </p>
                  {data.investing.outflows.assets.map((a, i) => (
                    <div key={i} className="flex justify-between text-xs py-1">
                      <span className="text-gray-500">{a.name}</span>
                      <span className="font-mono text-red-500">৳{a.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Financing Activities */}
            <div className={cardClass}>
              <SectionHeader
                icon={DollarSign}
                title="Financing"
                color="text-amber-500"
                netCash={netFinancing}
              />
              <div className="space-y-1 border-t border-gray-100 dark:border-gray-800 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Cash Inflows</p>
                <CashRow
                  label="Investor Deposits"
                  amount={data?.financing?.inflows?.investorDeposits}
                />
                <CashRow
                  label="Loan Disbursements"
                  amount={data?.financing?.inflows?.loanDisbursements}
                />
                <div className="border-t border-gray-100 dark:border-gray-800 my-2" />
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Cash Outflows</p>
                <CashRow
                  label="Investor Withdrawals"
                  amount={data?.financing?.outflows?.investorWithdrawals}
                  isOutflow
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={cardClass}>
          <p className="text-center text-gray-400 py-8">No data available for this period</p>
        </div>
      )}
    </div>
  );
}
