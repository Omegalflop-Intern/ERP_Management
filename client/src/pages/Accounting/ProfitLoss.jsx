import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  Download,
  PackageCheck,
  Receipt,
  RefreshCw,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import DatePicker from '../../components/ui/DatePicker';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';

export default function ProfitLoss() {
  const [from, setFrom] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const { styled } = useTheme();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['profit-loss', from, to],
    queryFn: async () => {
      const res = await api.get('/accounting/reports/profit-loss', { params: { from, to } });
      return res.data?.data;
    },
  });

  const cardClass = styled
    ? 'neu-card p-5'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-5';

  const revenueTotal = data?.revenue?.total || 0;
  const cogsTotal = data?.cogs?.total || 0;
  const purchasesTotal = data?.purchases?.total || 0;
  const purchasesCount = data?.purchases?.count || 0;
  const grossProfit = data?.grossProfit || revenueTotal - cogsTotal;
  const expensesTotal = data?.expenses?.total || 0;
  const netIncome = data?.netIncome || grossProfit - expensesTotal;
  const isProfit = netIncome >= 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" /> Profit & Loss Statement
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Financial statement showing revenue, product purchase costs (COGS), stock purchases,
            operating expenses, and net profit
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              From Date
            </label>
            <DatePicker value={from} onChange={setFrom} placeholder="From Date" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              To Date
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
                const res = await api.get('/accounting/reports/profit-loss/pdf', {
                  params: { from, to },
                  responseType: 'blob',
                });
                const url = window.URL.createObjectURL(
                  new Blob([res.data], { type: 'application/pdf' })
                );
                const a = document.createElement('a');
                a.href = url;
                a.download = 'profit-loss.pdf';
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
          {/* Top Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className={cardClass}>
              <div className="text-xs font-semibold text-gray-500 uppercase flex items-center justify-between">
                <span>Total Sales Revenue</span>
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
                ৳{revenueTotal.toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                {data.revenue?.salesCount || 0} Sales Transactions
              </div>
            </div>

            <div className={cardClass}>
              <div className="text-xs font-semibold text-gray-500 uppercase flex items-center justify-between">
                <span>Product Cost (COGS)</span>
                <PackageCheck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 font-mono">
                ৳{cogsTotal.toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Cost of Goods Sold (Sold Items)</div>
            </div>

            <div className={cardClass}>
              <div className="text-xs font-semibold text-gray-500 uppercase flex items-center justify-between">
                <span>Stock Restock Purchases</span>
                <DollarSign className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2 font-mono">
                ৳{purchasesTotal.toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">{purchasesCount} Purchase Orders</div>
            </div>

            <div className={cardClass}>
              <div className="text-xs font-semibold text-gray-500 uppercase flex items-center justify-between">
                <span>Gross Profit</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2 font-mono">
                ৳{grossProfit.toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Revenue minus COGS</div>
            </div>

            <div className={cardClass}>
              <div className="text-xs font-semibold text-gray-500 uppercase flex items-center justify-between">
                <span>Operating Expenses</span>
                <Receipt className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2 font-mono">
                ৳{expensesTotal.toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Rent, Utilities, Food & Costs</div>
            </div>
          </div>

          {/* Section 1: Revenue, COGS & Purchases Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Revenue Card */}
            <div className={cardClass}>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> 1. Total Sales Revenue
                </h3>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ৳{revenueTotal.toLocaleString()}
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800/50">
                  <span className="text-gray-700 dark:text-gray-300">
                    Product Sales Income (Gross Sales)
                  </span>
                  <span className="font-semibold font-mono text-gray-900 dark:text-gray-100">
                    ৳{revenueTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 text-xs text-gray-500">
                  <span>Period Transactions Count</span>
                  <span className="font-medium">
                    {data.revenue?.salesCount || 0} completed invoices
                  </span>
                </div>
              </div>
            </div>

            {/* Cost of Goods Sold (COGS) Card */}
            <div className={cardClass}>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <PackageCheck className="w-5 h-5" /> 2. Cost of Goods Sold (COGS)
                </h3>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">
                  ৳{cogsTotal.toLocaleString()}
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800/50">
                  <span className="text-gray-700 dark:text-gray-300">
                    Total Purchase Cost of Sold Items
                  </span>
                  <span className="font-semibold font-mono text-gray-900 dark:text-gray-100">
                    ৳{cogsTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 text-xs text-gray-500">
                  <span>Calculation Method</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    Sum of (Qty × Product Cost Price)
                  </span>
                </div>
              </div>
            </div>

            {/* Product Purchases / Stock Restock Card */}
            <div className={cardClass}>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" /> 3. Stock Restock / Product Purchases
                </h3>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400 font-mono">
                  ৳{purchasesTotal.toLocaleString()}
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800/50">
                  <span className="text-gray-700 dark:text-gray-300">
                    Total Inventory Product Purchases
                  </span>
                  <span className="font-semibold font-mono text-gray-900 dark:text-gray-100">
                    ৳{purchasesTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 text-xs text-gray-500">
                  <span>Purchase Orders Count</span>
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {purchasesCount} purchase orders
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Gross Profit Highlight Banner */}
          <div className="bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Gross Profit (Sales Profit before Operating Expenses)
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Formula: Total Sales Revenue (৳{revenueTotal.toLocaleString()}) - Product Purchase
                Cost (৳{cogsTotal.toLocaleString()})
              </div>
            </div>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              ৳{grossProfit.toLocaleString()}
            </div>
          </div>

          {/* Section 3: Operating Expenses */}
          <div className={cardClass}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" /> 3. Shop Operating Expenses
              </h3>
              <span className="text-lg font-bold text-red-600 dark:text-red-400 font-mono">
                ৳{expensesTotal.toLocaleString()}
              </span>
            </div>

            {data.expenses?.byCategory && Object.keys(data.expenses.byCategory).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(data.expenses.byCategory).map(([catName, amount]) => (
                  <div
                    key={catName}
                    className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-800/50"
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-200">{catName}</span>
                    <span className="font-semibold font-mono text-gray-900 dark:text-gray-100">
                      ৳{Number(amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-3">
                No operating expenses recorded in this period
              </p>
            )}
          </div>

          {/* Section 4: Final Net Profit / Loss Banner */}
          <div className={cardClass}>
            <div
              className={`flex flex-col sm:flex-row items-center justify-between p-6 rounded-2xl border ${isProfit ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50' : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50'}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl ${isProfit ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}
                >
                  <DollarSign className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Final Net {isProfit ? 'Profit' : 'Loss'}
                  </div>
                  <div
                    className={`text-3xl font-extrabold font-mono mt-0.5 ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    ৳{Math.abs(netIncome).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-0 text-right text-xs space-y-1 text-gray-500 dark:text-gray-400 font-mono">
                <div>
                  Total Revenue:{' '}
                  <span className="font-bold text-emerald-600">
                    ৳{revenueTotal.toLocaleString()}
                  </span>
                </div>
                <div>
                  Less Product Cost:{' '}
                  <span className="font-bold text-amber-600">-৳{cogsTotal.toLocaleString()}</span>
                </div>
                <div>
                  Less Shop Expenses:{' '}
                  <span className="font-bold text-red-600">-৳{expensesTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select a date range and click refresh to load P&L</p>
        </div>
      )}
    </div>
  );
}
