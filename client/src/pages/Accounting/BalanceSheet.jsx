import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  PieChart,
  Printer,
  RefreshCw,
  Scale,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useRef, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/button';
import DatePicker from '../../components/ui/DatePicker';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';

export default function BalanceSheet() {
  const [asOf, setAsOf] = useState(new Date().toISOString().split('T')[0]);
  const { styled } = useTheme();
  const printRef = useRef(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['balance-sheet', asOf],
    queryFn: async () => {
      const res = await api.get('/accounting/reports/balance-sheet', { params: { asOf } });
      return res.data?.data;
    },
  });

  const cardClass = styled
    ? 'neu-card p-5'
    : 'bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm';

  const totalAssets = Number(data?.assets?.total || 0);
  const totalLiabilities = Number(data?.liabilities?.total || 0);
  const totalEquity = Number(data?.equity?.total || 0);
  const isBalanced = Boolean(data?.balanced);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Balance Sheet Statement"
        subtitle="Comprehensive financial position summary verifying Assets = Liabilities + Equity as of date."
        icon={Scale}
        breadcrumbs={['Accounting', 'Balance Sheet']}
        actions={
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-white dark:bg-[#1e293b] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500">As of:</span>
              <DatePicker value={asOf} onChange={(val) => setAsOf(val)} placeholder="As of Date" />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="rounded-xl h-10 px-3 border-slate-200 dark:border-slate-800"
              title="Refresh Statement"
            >
              <RefreshCw
                className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${isFetching ? 'animate-spin' : ''}`}
              />
            </Button>

            <Button
              onClick={handlePrint}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md text-xs font-semibold px-4 h-10"
            >
              <Printer className="w-4 h-4" /> Print Statement
            </Button>
            <Button
              onClick={async () => {
                try {
                  const res = await api.get('/accounting/reports/balance-sheet/pdf', {
                    params: { asOfDate: asOf },
                    responseType: 'blob',
                  });
                  const url = window.URL.createObjectURL(
                    new Blob([res.data], { type: 'application/pdf' })
                  );
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'balance-sheet.pdf';
                  a.click();
                  window.URL.revokeObjectURL(url);
                } catch {
                  /* ignore */
                }
              }}
              variant="outline"
              className="gap-2 rounded-xl text-xs font-semibold px-4 h-10"
            >
              <Download className="w-4 h-4" /> PDF
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cardClass}>
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((__, j) => (
                  <div
                    key={j}
                    className="h-5 w-full bg-slate-100 dark:bg-slate-800/60 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : data ? (
        <div ref={printRef} className="space-y-6">
          {/* Top 3 Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Total Assets Card */}
            <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-950/40 dark:via-blue-900/10 dark:to-transparent bg-white dark:bg-[#111827] p-5 rounded-2xl border border-blue-200/80 dark:border-blue-800/40 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  1. Total Assets
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2 font-mono">
                ৳{totalAssets.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                <span>{data.assets?.accounts?.length || 0} Asset Accounts</span>
              </div>
            </div>

            {/* Total Liabilities Card */}
            <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-950/40 dark:via-rose-900/10 dark:to-transparent bg-white dark:bg-[#111827] p-5 rounded-2xl border border-rose-200/80 dark:border-rose-800/40 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  2. Total Liabilities
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2 font-mono">
                ৳{totalLiabilities.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                <span>{data.liabilities?.accounts?.length || 0} Liability Accounts</span>
              </div>
            </div>

            {/* Total Equity Card */}
            <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent dark:from-purple-950/40 dark:via-purple-900/10 dark:to-transparent bg-white dark:bg-[#111827] p-5 rounded-2xl border border-purple-200/80 dark:border-purple-800/40 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  3. Total Equity
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <PieChart className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2 font-mono">
                ৳{totalEquity.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                <span>{data.equity?.accounts?.length || 0} Capital Accounts</span>
              </div>
            </div>
          </div>

          {/* High-Impact Equation & Audit Status Banner */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isBalanced
                ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-300 dark:border-emerald-800/50'
                : 'bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent border-rose-300 dark:border-rose-800/50'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    className={`w-5 h-5 ${isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}
                  />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Accounting Equation Audit Status
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {isBalanced
                    ? 'The accounting ledger is perfectly balanced. Total Assets exactly equal Total Liabilities plus Owners Equity.'
                    : 'Discrepancy detected between Assets and (Liabilities + Equity). Please review journal entries.'}
                </p>
              </div>

              {/* Equation Calculation Visual Box */}
              <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 backdrop-blur-xs font-mono text-xs">
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 font-sans uppercase">Assets</div>
                  <div className="font-bold text-blue-600 dark:text-blue-400">
                    ৳{totalAssets.toLocaleString()}
                  </div>
                </div>
                <div className="font-bold text-slate-400 text-sm">=</div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 font-sans uppercase">Liabilities</div>
                  <div className="font-bold text-rose-600 dark:text-rose-400">
                    ৳{totalLiabilities.toLocaleString()}
                  </div>
                </div>
                <div className="font-bold text-slate-400 text-sm">+</div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 font-sans uppercase">Equity</div>
                  <div className="font-bold text-purple-600 dark:text-purple-400">
                    ৳{totalEquity.toLocaleString()}
                  </div>
                </div>
                <div className="pl-2 border-l border-slate-200 dark:border-slate-800">
                  {isBalanced ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> BALANCED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 font-extrabold text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" /> UNBALANCED
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3 Detail Columns Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ASSETS COLUMN */}
            <div className={cardClass}>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-base text-blue-600 dark:text-blue-400">
                    Assets (1000 Series)
                  </h3>
                </div>
                <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                  ৳{totalAssets.toLocaleString()}
                </span>
              </div>

              <div className="space-y-3">
                {!data.assets?.accounts || data.assets.accounts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No asset accounts recorded
                  </div>
                ) : (
                  data.assets.accounts.map((a) => {
                    const pct =
                      totalAssets > 0
                        ? Math.min(100, Math.max(0, (a.balance / totalAssets) * 100))
                        : 0;
                    return (
                      <div
                        key={a._id || a.id}
                        className="space-y-1 py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate max-w-[200px]">
                            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold">
                              {a.code}
                            </span>
                            <span className="truncate">{a.name}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            ৳{Number(a.balance || 0).toLocaleString()}
                          </span>
                        </div>
                        {totalAssets > 0 && (
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* LIABILITIES COLUMN */}
            <div className={cardClass}>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <h3 className="font-bold text-base text-rose-600 dark:text-rose-400">
                    Liabilities (2000 Series)
                  </h3>
                </div>
                <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                  ৳{totalLiabilities.toLocaleString()}
                </span>
              </div>

              <div className="space-y-3">
                {!data.liabilities?.accounts || data.liabilities.accounts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No liability accounts recorded
                  </div>
                ) : (
                  data.liabilities.accounts.map((a) => {
                    const pct =
                      totalLiabilities > 0
                        ? Math.min(100, Math.max(0, (a.balance / totalLiabilities) * 100))
                        : 0;
                    return (
                      <div
                        key={a._id || a.id}
                        className="space-y-1 py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate max-w-[200px]">
                            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold">
                              {a.code}
                            </span>
                            <span className="truncate">{a.name}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            ৳{Number(a.balance || 0).toLocaleString()}
                          </span>
                        </div>
                        {totalLiabilities > 0 && (
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* EQUITY COLUMN */}
            <div className={cardClass}>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-bold text-base text-purple-600 dark:text-purple-400">
                    Equity (3000 Series)
                  </h3>
                </div>
                <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                  ৳{totalEquity.toLocaleString()}
                </span>
              </div>

              <div className="space-y-3">
                {!data.equity?.accounts || data.equity.accounts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No equity accounts recorded
                  </div>
                ) : (
                  data.equity.accounts.map((a) => {
                    const pct =
                      totalEquity > 0
                        ? Math.min(100, Math.max(0, (a.balance / totalEquity) * 100))
                        : 0;
                    return (
                      <div
                        key={a._id || a.id}
                        className="space-y-1 py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate max-w-[200px]">
                            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold">
                              {a.code}
                            </span>
                            <span className="truncate">{a.name}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            ৳{Number(a.balance || 0).toLocaleString()}
                          </span>
                        </div>
                        {totalEquity > 0 && (
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-purple-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50 text-slate-400" />
          <p className="text-sm font-medium">
            Select a date and click refresh to load balance sheet statement
          </p>
        </div>
      )}
    </div>
  );
}
