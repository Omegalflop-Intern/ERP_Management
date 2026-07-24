import React from 'react';
import { X, History, Tag, ShieldAlert, CheckCircle2, User, DollarSign, Smartphone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export default function IMEIPassportModal({ imei, onClose }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['imeiPassport', imei],
    queryFn: async () => {
      const res = await api.get(`/inventory/passport/${imei}`);
      return res.data.data;
    },
    enabled: !!imei,
  });

  if (!imei) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-card border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-100 flex items-center gap-2">
                IMEI Passport <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">Life Timeline</span>
              </h3>
              <p className="text-xs text-gray-400 font-mono">IMEI: {imei}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {isLoading && (
            <div className="py-12 text-center text-gray-400 animate-pulse">
              Fetching complete lifetime history for IMEI {imei}...
            </div>
          )}

          {isError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
              No registered history or product passport found for IMEI: <span className="font-mono">{imei}</span>
            </div>
          )}

          {data && (
            <>
              {/* Product Info Card */}
              <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-400">Device Model</div>
                  <div className="font-bold text-gray-200">{data.productName}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Brand & Specs</div>
                  <div className="font-semibold text-gray-300">{data.brand} ({data.ram}/{data.storage})</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Current Status</div>
                  <div className="mt-0.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      data.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      data.status === 'Sold' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {data.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Current Selling Price</div>
                  <div className="font-bold text-emerald-400 font-mono">৳{data.sellingPrice?.toLocaleString()}</div>
                </div>
              </div>

              {/* Passport Life Cycle Event Timeline */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-400" /> Life Story & History Trail
                </h4>

                <div className="relative pl-6 border-l-2 border-indigo-500/30 space-y-6">
                  {data.passportHistory?.map((event, idx) => (
                    <div key={idx} className="relative">
                      {/* Event Marker Node */}
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-dark-card border-2 border-indigo-400 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                      </div>

                      <div className="bg-gray-900/40 p-3.5 rounded-xl border border-gray-800/80">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span className="font-semibold text-indigo-300 font-mono uppercase">{event.event}</span>
                          <span>{new Date(event.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-200 font-medium">{event.details}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800/60">
                          <span>Logged by: <strong className="text-gray-300">{event.performedBy}</strong></span>
                          {event.amount && <span className="font-mono text-emerald-400">৳{event.amount.toLocaleString()}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-800 bg-gray-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-lg text-sm transition-colors"
          >
            Close Passport
          </button>
        </div>
      </div>
    </div>
  );
}
