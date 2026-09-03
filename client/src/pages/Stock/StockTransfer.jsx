import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle,
  Clock,
  Layers,
  Package,
  Plus,
  Printer,
  Search,
  Trash2,
  Truck,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../../lib/api';
import TransferChallanModal from '../../components/stock/TransferChallanModal';

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
  const [printTransfer, setPrintTransfer] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['transfers', statusFilter],
    queryFn: async () => {
      const res = await api.get('/stock', {
        params: { status: statusFilter, limit: 50 },
      });
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => api.patch(`/stock/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries(['transfers']);
      queryClient.invalidateQueries(['stock-overview-products']);
      queryClient.invalidateQueries(['stock-overview-inventory']);
      queryClient.invalidateQueries(['products']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update status'),
  });

  const transfers = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Stock Transfer</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Transfer stock between branches with real-time source lookup & multi-product support
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-lg text-sm transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Transfer
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              statusFilter === s
                ? 'bg-[#2563EB] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:bg-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {s === 'ALL' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Transfer #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  From → To
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Product / Items
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Quantity / IMEI
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
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : transfers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-50 text-blue-500" />
                    <p className="font-medium text-base">No transfers recorded</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Click "+ New Transfer" to dispatch products between outlets
                    </p>
                  </td>
                </tr>
              ) : (
                transfers.map((t) => {
                  const cfg = statusConfig[t.status] || statusConfig.PENDING;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr
                      key={t._id || t.id}
                      className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {t.transferNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="text-gray-900 dark:text-gray-100">
                            {t.fromBranchId?.name || t.fromBranch || 'Main'}
                          </span>
                          <span className="text-gray-400 font-bold">→</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {t.toBranchId?.name || t.toBranch || 'Destination'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        <div className="font-medium">
                          {t.productId?.name || t.product?.name || 'Product'}
                        </div>
                        {t.productId?.sku && (
                          <div className="text-xs text-gray-400 font-mono">
                            SKU: {t.productId.sku}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {t.imeiOrSerial ? (
                          <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-mono text-xs">
                            IMEI: {t.imeiOrSerial}
                          </span>
                        ) : (
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            ×{t.quantity || 1} units
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPrintTransfer(t)}
                            title="Print Transfer Gate Pass / Challan"
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-800/60"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {t.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: t._id || t.id,
                                    status: 'IN_TRANSIT',
                                  })
                                }
                                className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium transition-colors"
                              >
                                Dispatch
                              </button>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: t._id || t.id,
                                    status: 'CANCELLED',
                                  })
                                }
                                className="px-2.5 py-1 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-xs font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {t.status === 'IN_TRANSIT' && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: t._id || t.id,
                                  status: 'DELIVERED',
                                })
                              }
                              className="px-2.5 py-1 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg text-xs font-medium transition-colors"
                            >
                              Receive & Deliver
                            </button>
                          )}
                          {(t.status === 'DELIVERED' || t.status === 'CANCELLED') && (
                            <span className="text-xs text-gray-400 font-medium">Completed</span>
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
          onSuccess={(newTransfer) => {
            setShowCreate(false);
            queryClient.invalidateQueries(['transfers']);
            if (newTransfer) {
              setPrintTransfer(newTransfer);
            }
          }}
        />
      )}

      {printTransfer && (
        <TransferChallanModal transfer={printTransfer} onClose={() => setPrintTransfer(null)} />
      )}
    </div>
  );
}

function CreateTransferModal({ onClose, onSuccess }) {
  const [fromBranchId, setFromBranchId] = useState('');
  const [toBranchId, setToBranchId] = useState('');
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [items, setItems] = useState([]);

  // Fetch branches
  const { data: branches = [] } = useQuery({
    queryKey: ['branches-select-transfer'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data?.data || [];
    },
  });

  // Pre-populate branches
  useEffect(() => {
    if (branches.length > 0) {
      const defaultFrom = String(branches[0]?._id || branches[0]?.id || '');
      setFromBranchId(defaultFrom);

      const otherBranch = branches.find((b) => String(b._id || b.id) !== defaultFrom);
      if (otherBranch) {
        setToBranchId(String(otherBranch._id || otherBranch.id));
      }
    }
  }, [branches]);

  // Fetch available products for fromBranchId
  const { data: availableProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products-for-transfer', fromBranchId],
    queryFn: async () => {
      if (!fromBranchId) return [];
      const res = await api.get('/products', {
        params: { limit: 200, branchId: fromBranchId },
      });
      return res.data?.data || [];
    },
    enabled: !!fromBranchId,
  });

  // Filter products by search
  const filteredProducts = availableProducts.filter((p) => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  const handleAddProduct = (prod) => {
    const pId = String(prod._id || prod.id);
    const existingIndex = items.findIndex((i) => i.productId === pId && !i.imeiOrSerial);

    if (existingIndex >= 0) {
      const updated = [...items];
      const maxStock = prod.stockQuantity || prod.branchStockQuantity || 999;
      if (updated[existingIndex].quantity < maxStock) {
        updated[existingIndex].quantity += 1;
        setItems(updated);
        toast.success(`Increased ${prod.name} quantity to ${updated[existingIndex].quantity}`);
      } else {
        toast.info(`Reached maximum available stock (${maxStock}) in source outlet`);
      }
    } else {
      const availStock = prod.stockQuantity || prod.branchStockQuantity || 0;
      const isImei = prod.availableIMEIs && prod.availableIMEIs.length > 0;
      setItems([
        ...items,
        {
          productId: pId,
          name: prod.name,
          brand: prod.brand || '',
          sku: prod.sku || '',
          category: prod.category || '',
          availableStock: availStock,
          isImei,
          availableIMEIs: prod.availableIMEIs || [],
          imeiOrSerial: isImei ? prod.availableIMEIs[0] || '' : '',
          quantity: 1,
        },
      ]);
      toast.success(`Added ${prod.name} to transfer list`);
    }
    setProductSearch('');
    setIsSearchOpen(false);
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: async (payload) => api.post('/stock', payload),
    onSuccess: (res) => {
      toast.success('Stock transfer batch initiated successfully!');
      const createdItem = res?.data?.data;
      onSuccess(Array.isArray(createdItem) ? createdItem[0] : createdItem);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create transfer'),
  });

  const totalTransferUnits = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-base">
              <ArrowRightLeft className="w-5 h-5 text-blue-600 dark:text-blue-400" /> New Stock
              Transfer
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Transfer multiple products and IMEI devices across outlets
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!fromBranchId) return toast.error('Please select source outlet (From Branch)');
            if (!toBranchId) return toast.error('Please select destination outlet (To Branch)');
            if (fromBranchId === toBranchId)
              return toast.error('Source and destination branches cannot be the same');
            if (items.length === 0)
              return toast.error('Please add at least one product to transfer');

            const payload = {
              fromBranchId,
              toBranchId,
              notes,
              items: items.map((i) => ({
                productId: i.productId,
                imeiOrSerial: i.imeiOrSerial || undefined,
                quantity: Number(i.quantity) || 1,
              })),
            };

            mutation.mutate(payload);
          }}
          className="p-6 space-y-5 overflow-y-auto flex-1"
        >
          {/* Branch Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
            <div>
              <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 mb-1.5">
                From Branch (Source Outlet) *
              </label>
              <select
                required
                value={fromBranchId}
                onChange={(e) => {
                  setFromBranchId(e.target.value);
                  setItems([]); // reset items when source branch changes
                }}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-gray-900 dark:text-gray-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 mb-1.5">
                To Branch (Destination Outlet) *
              </label>
              <select
                required
                value={toBranchId}
                onChange={(e) => setToBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-gray-900 dark:text-gray-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Destination Outlet</option>
                {branches
                  .filter((b) => String(b._id || b.id) !== String(fromBranchId))
                  .map((b) => (
                    <option key={b._id || b.id} value={b._id || b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Searchable Product Lookup */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Search & Add Products from Source Outlet
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  loadingProducts
                    ? 'Loading source products...'
                    : 'Search by product name, SKU, brand to add...'
                }
                value={productSearch}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setIsSearchOpen(true);
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
              />
            </div>

            {/* Dropdown Results */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-30 divide-y divide-gray-100 dark:divide-gray-800">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">
                    No products found in this source outlet matching "{productSearch}"
                  </div>
                ) : (
                  filteredProducts.map((p) => {
                    const st = p.stockQuantity || p.branchStockQuantity || 0;
                    return (
                      <button
                        key={p._id || p.id}
                        type="button"
                        onClick={() => handleAddProduct(p)}
                        className="w-full p-3 text-left hover:bg-blue-50 dark:hover:bg-gray-800 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {p.brand ? `[${p.brand}] ` : ''}
                            {p.name}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                            {p.sku && <span className="font-mono">SKU: {p.sku}</span>}
                            <span>• {p.category || 'General'}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                              st > 0
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {st} Available
                          </span>
                          <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                            + Click to Add
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Transfer Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Selected Products to Transfer ({items.length})
              </label>
              {items.length > 0 && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  Total Units: {totalTransferUnits}
                </span>
              )}
            </div>

            {items.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center text-gray-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No products selected yet</p>
                <p className="text-xs mt-0.5">
                  Use the search bar above to look up and add items to this transfer order
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                        {item.brand ? `[${item.brand}] ` : ''}
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                        {item.sku && <span className="font-mono">SKU: {item.sku}</span>}
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          • {item.availableStock} in source stock
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {item.isImei && item.availableIMEIs.length > 0 ? (
                        <div className="w-48">
                          <select
                            value={item.imeiOrSerial}
                            onChange={(e) => handleUpdateItem(idx, 'imeiOrSerial', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="">Choose IMEI</option>
                            {item.availableIMEIs.map((imei) => (
                              <option key={imei} value={imei}>
                                {imei}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Qty:
                          </span>
                          <input
                            type="number"
                            min="1"
                            max={item.availableStock > 0 ? item.availableStock : 999}
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(
                                idx,
                                'quantity',
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            className="w-20 px-2.5 py-1.5 text-sm font-semibold text-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Dispatch Note / Driver Remarks (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add courier info, vehicle number, or dispatch instruction..."
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || items.length === 0}
              className="flex-1 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              {mutation.isPending
                ? 'Dispatching Transfer...'
                : `Confirm & Transfer (${totalTransferUnits} Units)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
