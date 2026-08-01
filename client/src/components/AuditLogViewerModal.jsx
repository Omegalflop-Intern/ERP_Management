import { useQuery } from '@tanstack/react-query';
import { Calendar, DollarSign, Filter, History, Shield, User, X } from 'lucide-react';
import React, { useState } from 'react';
import api from '../lib/api';
import DatePicker from './ui/DatePicker';

export default function AuditLogViewerModal({ moduleName, entityId, entityTitle, onClose }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const {
    data: logData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['audit-logs', moduleName, entityId, fromDate, toDate],
    queryFn: async () => {
      let url = `/audit-logs?module=${moduleName}`;
      if (fromDate) url += `&from=${fromDate}`;
      if (toDate) url += `&to=${toDate}`;
      const res = await api.get(url);
      const logs = res.data?.data || [];
      if (entityId) {
        return logs.filter((l) => String(l.entityId) === String(entityId));
      }
      return logs;
    },
    enabled: Boolean(moduleName),
  });

  const logs = logData || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-xl">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                  Immutable Audit Trail
                </h3>
                <p className="text-xs text-gray-500">
                  {moduleName}:{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {entityTitle || 'Activity Log'}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Date Selection Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-800 text-xs">
            <span className="font-semibold text-gray-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-red-600" /> Filter Log Dates:
            </span>
            <DatePicker
              value={fromDate}
              onChange={(val) => setFromDate(val)}
              placeholder="From Date"
            />
            <span className="text-gray-400">to</span>
            <DatePicker value={toDate} onChange={(val) => setToDate(val)} placeholder="To Date" />
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                className="text-xs text-red-600 font-semibold hover:underline ml-1"
              >
                Reset Dates
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <p className="text-xs text-gray-500">Loading audit history...</p>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
              <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No activity logs recorded for this item in selected date range.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const diff = log.details || {};
                const amount = diff.amount || diff.newValue?.amount || diff.oldValue?.amount;
                const txType = diff.type || diff.actionType || diff.newValue?.type;

                return (
                  <div
                    key={log._id}
                    className="p-4 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            log.action === 'CREATE'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : log.action === 'DELETE'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />{' '}
                          {log.username || log.userId?.username || 'System User'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />{' '}
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Amount & Transaction Details Badge if present */}
                    {(amount || txType) && (
                      <div className="p-2 bg-white dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-semibold">
                        <span className="text-gray-500">
                          Operation / Details:{' '}
                          <span className="text-gray-800 dark:text-gray-200">
                            {txType || log.action}
                          </span>
                        </span>
                        {amount && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                            ৳{Number(amount).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* JSON Diff Details */}
                    {diff.oldValue || diff.newValue ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                        {diff.oldValue && (
                          <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg overflow-x-auto">
                            <div className="font-sans font-bold text-[10px] uppercase text-red-600 mb-1">
                              Old Value
                            </div>
                            <pre className="text-[11px] text-red-800 dark:text-red-300 whitespace-pre-wrap">
                              {JSON.stringify(diff.oldValue, null, 2)}
                            </pre>
                          </div>
                        )}
                        {diff.newValue && (
                          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg overflow-x-auto">
                            <div className="font-sans font-bold text-[10px] uppercase text-emerald-600 mb-1">
                              New Value
                            </div>
                            <pre className="text-[11px] text-emerald-800 dark:text-emerald-300 whitespace-pre-wrap">
                              {JSON.stringify(diff.newValue, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">Action executed successfully.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
