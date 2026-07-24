import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ArrowRightLeft, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const STATUSES = ['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

const statusConfig = {
  PENDING: { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  IN_TRANSIT: { icon: Truck, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  DELIVERED: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
  CANCELLED: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
};

export default function StockTransfer() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['transfers', statusFilter],
    queryFn: async () => {
      const res = await api.get('/stock', { params: { status: statusFilter, limit: 50 } });
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => api.patch(`/stock/${id}/status`, { status }),
    onSuccess: () => { toast.success('Status updated'); queryClient.invalidateQueries(['transfers']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const transfers = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Stock Transfer</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Transfer stock between branches</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-medium rounded-lg text-sm transition-all">
          <Plus className="w-4 h-4" /> New Transfer
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${statusFilter === s ? 'bg-red-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {s === 'ALL' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Transfer #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">From → To</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No transfers found</p>
                  </td>
                </tr>
              ) : (
                transfers.map((t) => {
                  const cfg = statusConfig[t.status] || statusConfig.PENDING;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={t._id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3"><span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{t.transferNumber}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{t.fromBranchId?.name || 'N/A'} → {t.toBranchId?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{t.productId?.name || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" /> {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {t.status === 'PENDING' && (
                            <>
                              <button onClick={() => updateStatusMutation.mutate({ id: t._id, status: 'IN_TRANSIT' })} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors">Ship</button>
                              <button onClick={() => updateStatusMutation.mutate({ id: t._id, status: 'CANCELLED' })} className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors">Cancel</button>
                            </>
                          )}
                          {t.status === 'IN_TRANSIT' && (
                            <button onClick={() => updateStatusMutation.mutate({ id: t._id, status: 'DELIVERED' })} className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors">Deliver</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <CreateTransferModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); queryClient.invalidateQueries(['transfers']); }} />}
    </div>
  );
}

function CreateTransferModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ fromBranchId: '', toBranchId: '', productId: '', imeiOrSerial: '', quantity: 1, notes: '' });

  const { data: products } = useQuery({
    queryKey: ['products-select'],
    queryFn: async () => { const res = await api.get('/products', { params: { limit: 100 } }); return res.data?.data || []; },
  });

  const mutation = useMutation({
    mutationFn: async (data) => api.post('/stock', data),
    onSuccess: () => { toast.success('Transfer created'); onSuccess(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">New Stock Transfer</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">From Branch ID</label>
              <input required value={form.fromBranchId} onChange={(e) => setForm({...form, fromBranchId: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500" placeholder="Branch ID" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">To Branch ID</label>
              <input required value={form.toBranchId} onChange={(e) => setForm({...form, toBranchId: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500" placeholder="Branch ID" /></div>
          </div>
          <div><label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Product</label>
            <select required value={form.productId} onChange={(e) => setForm({...form, productId: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500">
              <option value="">Select product</option>
              {(Array.isArray(products) ? products : []).map(p => <option key={p._id} value={p._id}>{p.brand} {p.name}</option>)}
            </select></div>
          <div><label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">IMEI (optional)</label>
            <input value={form.imeiOrSerial} onChange={(e) => setForm({...form, imeiOrSerial: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500 font-mono" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500" /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm">{mutation.isPending ? 'Creating...' : 'Create Transfer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
