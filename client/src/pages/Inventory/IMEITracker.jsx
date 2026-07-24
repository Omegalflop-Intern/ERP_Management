import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Smartphone, Eye, Filter, Trash2, ArrowDown, Upload } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const STATUSES = ['ALL', 'Available', 'Reserved', 'Sold', 'Returned', 'Defective', 'Sent for Repair', 'Display Unit'];

export default function IMEITracker() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [showAdd, setShowAdd] = useState(false);
  const [viewPassport, setViewPassport] = useState(null);
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['imei', search, status],
    queryFn: async () => {
      const res = await api.get('/inventory', { params: { search, status, limit: 50 } });
      return res.data;
    },
  });

  const units = data?.data || [];

  const importMutation = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/inventory/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data.data;
    },
    onSuccess: (res) => { toast.success(`Imported: ${res.created} created, ${res.skipped} skipped`); queryClient.invalidateQueries(['imei']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Import failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">IMEI Tracker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track every device by IMEI — full lifecycle passport</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm transition-all">
            <Upload className="w-4 h-4" /> {importMutation.isPending ? 'Importing...' : 'Import IMEI'}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importMutation.mutate(f); e.target.value = ''; }} />
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-medium rounded-lg text-sm transition-all">
            <ArrowDown className="w-4 h-4" /> Stock Inward
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by IMEI..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500 font-mono" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500">
            {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">IMEI / Serial</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cost</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Selling</th>
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
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No IMEI records found</p>
                  </td>
                </tr>
              ) : (
                units.map((u) => (
                  <tr key={u._id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3"><span className="text-sm font-mono text-gray-900 dark:text-gray-100">{u.imeiOrSerial}</span></td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{u.productId?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{u.productId?.brand}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${u.status === 'Available' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : u.status === 'Sold' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">৳{u.purchasePrice?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-green-700 dark:text-green-400">৳{u.currentSellingPrice?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setViewPassport(u.imeiOrSerial)} title="View Passport" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600 transition-colors"><Eye className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddStockModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); queryClient.invalidateQueries(['imei']); }} />}

      {viewPassport && <PassportModal imei={viewPassport} onClose={() => setViewPassport(null)} />}
    </div>
  );
}

function AddStockModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ imeiOrSerial: '', productId: '', purchasePrice: '', currentSellingPrice: '', warrantyMonths: 12, supplierId: '' });

  const { data: products } = useQuery({
    queryKey: ['products-select'],
    queryFn: async () => { const res = await api.get('/products', { params: { limit: 100 } }); return res.data?.data || []; },
  });

  const mutation = useMutation({
    mutationFn: async (data) => api.post('/inventory', { ...data, purchasePrice: Number(data.purchasePrice), currentSellingPrice: Number(data.currentSellingPrice) || Number(data.purchasePrice), warrantyMonths: Number(data.warrantyMonths) }),
    onSuccess: () => { toast.success('Stock inward successful'); onSuccess(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Stock Inward (GRN)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="p-6 space-y-4">
          <div><label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">IMEI / Serial</label>
            <input required value={form.imeiOrSerial} onChange={(e) => setForm({...form, imeiOrSerial: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500 font-mono" placeholder="Enter IMEI number" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Product</label>
            <select required value={form.productId} onChange={(e) => setForm({...form, productId: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500">
              <option value="">Select product</option>
              {(Array.isArray(products) ? products : []).map(p => <option key={p._id} value={p._id}>{p.brand} {p.name}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Cost Price (৳)</label>
              <input type="number" required value={form.purchasePrice} onChange={(e) => setForm({...form, purchasePrice: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500" /></div>
            <div><label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Selling Price (৳)</label>
              <input type="number" value={form.currentSellingPrice} onChange={(e) => setForm({...form, currentSellingPrice: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500" /></div>
          </div>
          <div><label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Warranty (months)</label>
            <input type="number" value={form.warrantyMonths} onChange={(e) => setForm({...form, warrantyMonths: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500" /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm">{mutation.isPending ? 'Adding...' : 'Add Stock'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PassportModal({ imei, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['passport', imei],
    queryFn: async () => { const res = await api.get(`/inventory/passport/${encodeURIComponent(imei)}`); return res.data?.data; },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-800 shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-[#111827]">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">IMEI Passport</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"/>)}</div>
          ) : !data ? (
            <p className="text-center text-gray-500 py-8">IMEI not found</p>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">IMEI</div>
                <div className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100">{data.imeiOrSerial}</div>
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{data.productId?.brand} {data.productId?.name}</div>
                <div className="flex gap-2 mt-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${data.status === 'Available' ? 'bg-green-100 text-green-700' : data.status === 'Sold' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{data.status}</span>
                  <span className="text-xs text-gray-500">Warranty: {data.warrantyMonths}mo</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Lifecycle History</h4>
                <div className="space-y-3">
                  {(data.passportHistory || []).map((event, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.event}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{event.details}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{new Date(event.timestamp).toLocaleString()} {event.amount && `• ৳${event.amount.toLocaleString()}`}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
