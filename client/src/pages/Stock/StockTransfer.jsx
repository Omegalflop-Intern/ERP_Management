import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, CheckCircle, Clock, Plus, Search, Truck, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import api from '../../lib/api';

const STATUSES = ['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

const statusConfig = {
  PENDING: {
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  IN_TRANSIT: {
    icon: Truck,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  DELIVERED: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  CANCELLED: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
  },
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
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries(['transfers']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const transfers = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Stock Transfer</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Transfer stock between branches
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-lg text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> New Transfer
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${statusFilter === s ? 'bg-[#2563EB] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {s === 'ALL' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Transfer #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  From → To
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : transfers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No transfers found</p>
                  </td>
                </tr>
              ) : (
                transfers.map((t) => {
                  const cfg = statusConfig[t.status] || statusConfig.PENDING;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr
                      key={t._id}
                      className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                          {t.transferNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {t.fromBranchId?.name || 'N/A'} → {t.toBranchId?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {t.productId?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}
                        >
                          <StatusIcon className="w-3 h-3" /> {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {t.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: t._id, status: 'IN_TRANSIT' })
                                }
                                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                              >
                                Ship
                              </button>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: t._id, status: 'CANCELLED' })
                                }
                                className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {t.status === 'IN_TRANSIT' && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ id: t._id, status: 'DELIVERED' })
                              }
                              className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
                            >
                              Deliver
                            </button>
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

      {showCreate && (
        <CreateTransferModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            queryClient.invalidateQueries(['transfers']);
          }}
        />
      )}
    </div>
  );
}

function CreateTransferModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    fromBranchId: '',
    toBranchId: '',
    productId: '',
    imeiOrSerial: '',
    quantity: 1,
    notes: '',
  });

  // Fetch branches
  const { data: branches = [] } = useQuery({
    queryKey: ['branches-select-transfer'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data?.data || [];
    },
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products-select-transfer'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limit: 100 } });
      return res.data?.data || [];
    },
  });

  // Fetch available IMEIs for selected product & branch
  const { data: imeiUnits = [] } = useQuery({
    queryKey: ['imeis-select-transfer', form.productId, form.fromBranchId],
    queryFn: async () => {
      if (!form.productId) return [];
      const res = await api.get('/inventory', {
        params: { productId: form.productId, branchId: form.fromBranchId || undefined, status: 'Available', limit: 100 },
      });
      return res.data?.data || [];
    },
    enabled: !!form.productId,
  });

  const mutation = useMutation({
    mutationFn: async (data) => api.post('/stock', data),
    onSuccess: () => {
      toast.success('Stock transfer initiated successfully');
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create transfer'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-lg border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-600 dark:text-blue-400" /> New Stock Transfer
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.fromBranchId) return toast.error('Please select source branch (From Branch)');
            if (!form.toBranchId) return toast.error('Please select destination branch (To Branch)');
            if (form.fromBranchId === form.toBranchId) return toast.error('Source and destination branches cannot be the same');
            if (!form.productId) return toast.error('Please select a product');

            mutation.mutate(form);
          }}
          className="p-6 space-y-4"
        >
          {/* Branch Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                From Branch (Source) *
              </label>
              <select
                required
                value={form.fromBranchId}
                onChange={(e) => setForm({ ...form, fromBranchId: e.target.value, imeiOrSerial: '' })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Source Outlet</option>
                {branches.map((b) => (
                  <option key={b._id || b.id} value={b._id || b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                To Branch (Destination) *
              </label>
              <select
                required
                value={form.toBranchId}
                onChange={(e) => setForm({ ...form, toBranchId: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Destination Outlet</option>
                {branches
                  .filter((b) => String(b._id || b.id) !== String(form.fromBranchId))
                  .map((b) => (
                    <option key={b._id || b.id} value={b._id || b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Product Select */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Product *
            </label>
            <select
              required
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value, imeiOrSerial: '' })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Choose a product to transfer...</option>
              {products.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.brand ? `[${p.brand}] ` : ''}{p.name} {p.sku ? `(SKU: ${p.sku})` : ''} - Stock: {p.stockQuantity ?? 0}
                </option>
              ))}
            </select>
          </div>

          {/* IMEI or Serial Selector (Dropdown if available, else manual input) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Select IMEI / Serial (Optional)
              </label>
              {imeiUnits.length > 0 ? (
                <select
                  value={form.imeiOrSerial}
                  onChange={(e) => setForm({ ...form, imeiOrSerial: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select IMEI from stock ({imeiUnits.length} Available)</option>
                  {imeiUnits.map((u) => (
                    <option key={u._id || u.id} value={u.imeiOrSerial || u.imei_or_serial}>
                      {u.imeiOrSerial || u.imei_or_serial} ({u.color || 'Default'} - {u.ram}/{u.storage})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={form.imeiOrSerial}
                  onChange={(e) => setForm({ ...form, imeiOrSerial: e.target.value })}
                  placeholder="Enter 15-digit IMEI or Serial"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                disabled={!!form.imeiOrSerial}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Transfer Notes / Remark
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Add optional dispatch details..."
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
            >
              {mutation.isPending ? 'Initiating Transfer...' : 'Confirm & Create Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
