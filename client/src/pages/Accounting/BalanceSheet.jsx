import { useQuery } from '@tanstack/react-query';
import { FileText, RefreshCw, Scale } from 'lucide-react';
import React, { useState } from 'react';
import DatePicker from '../../components/ui/DatePicker';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';

export default function BalanceSheet() {
  const [asOf, setAsOf] = useState(new Date().toISOString().split('T')[0]);
  const { styled } = useTheme();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['balance-sheet', asOf],
    queryFn: async () => {
      const res = await api.get('/accounting/reports/balance-sheet', { params: { asOf } });
      return res.data?.data;
    },
  });

  const cardClass = styled
    ? 'neu-card p-5'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4';
  const sectionClass = styled ? 'neu-card-sm p-4' : 'bg-gray-50 dark:bg-gray-900 rounded-xl p-4';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Balance Sheet</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Assets = Liabilities + Equity as of a specific date
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              As of Date
            </label>
            <DatePicker value={asOf} onChange={(val) => setAsOf(val)} placeholder="As of Date" />
          </div>
          <button
            onClick={() => refetch()}
            className={
              styled
                ? 'neu-btn p-2 mt-5'
                : 'p-2 mt-5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
            }
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cardClass}>
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div
                    key={j}
                    className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assets */}
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <Scale className="w-5 h-5" /> Assets
                </h3>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  ৳{data.assets?.total?.toLocaleString()}
                </span>
              </div>
              <div className="space-y-2">
                {data.assets?.accounts?.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-800/50"
                  >
                    <div className="text-gray-800 dark:text-gray-200">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400 mr-2">
                        {a.code}
                      </span>
                      {a.name}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      ৳{a.balance.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Liabilities */}
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Scale className="w-5 h-5" /> Liabilities
                </h3>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  ৳{data.liabilities?.total?.toLocaleString()}
                </span>
              </div>
              <div className="space-y-2">
                {data.liabilities?.accounts?.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-800/50"
                  >
                    <div className="text-gray-800 dark:text-gray-200">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400 mr-2">
                        {a.code}
                      </span>
                      {a.name}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      ৳{a.balance.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equity */}
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <Scale className="w-5 h-5" /> Equity
                </h3>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  ৳{data.equity?.total?.toLocaleString()}
                </span>
              </div>
              <div className="space-y-2">
                {data.equity?.accounts?.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-800/50"
                  >
                    <div className="text-gray-800 dark:text-gray-200">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400 mr-2">
                        {a.code}
                      </span>
                      {a.name}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      ৳{a.balance.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className={`${cardClass} ${styled ? '' : ''}`}>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase mb-1">Total Assets</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  ৳{data.assets?.total?.toLocaleString()}
                </div>
              </div>
              <div className="text-2xl text-gray-400">=</div>
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase mb-1">Total Liabilities</div>
                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                  ৳{data.liabilities?.total?.toLocaleString()}
                </div>
              </div>
              <div className="text-2xl text-gray-400">+</div>
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase mb-1">Total Equity</div>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  ৳{data.equity?.total?.toLocaleString()}
                </div>
              </div>
              <div className="ml-4">
                {data.balanced ? (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                    BALANCED
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-xs font-bold">
                    UNBALANCED
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select a date and click refresh to load balance sheet</p>
        </div>
      )}
    </div>
  );
}
