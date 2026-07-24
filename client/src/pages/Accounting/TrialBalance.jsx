import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';

export default function TrialBalance() {
  const { styled } = useTheme();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trial-balance'],
    queryFn: async () => {
      const res = await api.get('/accounting/reports/trial-balance');
      return res.data?.data;
    },
  });

  const cardClass = styled ? 'neu-card p-5' : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trial Balance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">All accounts with non-zero balances — debits must equal credits</p>
        </div>
        <button onClick={() => refetch()} className={styled ? 'neu-btn px-4 py-2 text-sm flex items-center gap-2' : 'flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className={cardClass}>
          <div className="space-y-3">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />)}</div>
        </div>
      ) : data ? (
        <div className={cardClass}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Account Name</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Debit</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Credit</th>
                </tr>
              </thead>
              <tbody>
                {data.accounts?.map((a, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-2.5"><span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">{a.code}</span></td>
                    <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100">{a.name}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        a.type === 'ASSET' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                        a.type === 'LIABILITY' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                        a.type === 'EQUITY' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' :
                        a.type === 'REVENUE' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                        'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                      }`}>{a.type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                      {a.debit > 0 ? `৳${a.debit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                      {a.credit > 0 ? `৳${a.credit.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-gray-700 font-bold">
                  <td colSpan={3} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">Total</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">৳{data.totalDebit?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">৳{data.totalCredit?.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            {data.balanced ? (
              <span className="px-4 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-bold">Trial Balance is Balanced</span>
            ) : (
              <span className="px-4 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm font-bold">Trial Balance is UNBALANCED — Difference: ৳{Math.abs(data.totalDebit - data.totalCredit).toLocaleString()}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No accounts with balances found</p>
        </div>
      )}
    </div>
  );
}
