import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Eye,
  Minus,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { NumberInput } from '../../components/ui/NumberInput';
import BarcodeScannerModal from '../../components/ui/BarcodeScannerModal';

const STATUSES = ['ALL', 'APPROVED', 'RECEIVED', 'PARTIALLY_RECEIVED', 'CANCELLED'];
const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  PENDING_APPROVAL: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  APPROVED: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  PARTIALLY_RECEIVED: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  RECEIVED: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  CANCELLED: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
};

import PageHeader from '../../components/layout/PageHeader';

export default function PurchaseOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [editPO, setEditPO] = useState(null);
  const [viewPO, setViewPO] = useState(null);
  const [showGRN, setShowGRN] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(null);
  const [deletePO, setDeletePO] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/purchase-orders', {
        params: { search, status: statusFilter, limit: 50 },
      });
      return res.data;
    },
  });

  const orders = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        subtitle="Manage inventory restock orders, supplier invoices, received goods (GRN), and returns."
        icon={Truck}
        breadcrumbs={['Purchases & Suppliers', 'Purchase Orders']}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" /> New Purchase Order
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#2563EB]"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${statusFilter === s ? 'bg-[#2563EB] text-white shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  PO Number
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Supplier
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Total
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Paid
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Due
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
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
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No purchase orders found</p>
                  </td>
                </tr>
              ) : (
                orders.map((po) => (
                  <tr
                    key={po._id}
                    className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                        {po.poNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {po.supplierId?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                      ৳{po.netTotal?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                      ৳{(po.paidAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                      {(po.dueAmount || 0) > 0 ? `৳${po.dueAmount.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[po.status] || ''}`}
                        >
                          {po.status?.replace(/_/g, ' ')}
                        </span>
                        {(po.returnedCount || 0) > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                            {po.returnedCount} returned
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(po.createdAt).toLocaleDateString('en-BD')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED') && (
                          <button
                            onClick={() => setShowGRN(po)}
                            className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            Receive
                          </button>
                        )}
                        {(po.status === 'RECEIVED' || po.status === 'PARTIALLY_RECEIVED') && (
                          <button
                            onClick={() => setShowReturnModal(po)}
                            className="px-2 py-1 text-xs font-medium bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-lg hover:bg-rose-200 transition-colors"
                          >
                            Return
                          </button>
                        )}
                        {po.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setEditPO(po)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            title="Edit Order"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {po.status !== 'RECEIVED' &&
                          po.status !== 'PARTIALLY_RECEIVED' &&
                          po.status !== 'CANCELLED' && (
                            <button
                              onClick={() => setDeletePO(po)}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        <button
                          onClick={() => setViewPO(po)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View Order"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showCreate || editPO) && (
        <CreatePOModal
          editPO={editPO}
          onClose={() => {
            setShowCreate(false);
            setEditPO(null);
          }}
          onSuccess={() => {
            setShowCreate(false);
            setEditPO(null);
            queryClient.invalidateQueries(['purchase-orders']);
          }}
        />
      )}
      {viewPO && <PODetailModal order={viewPO} onClose={() => setViewPO(null)} />}
      {showGRN && (
        <GRNModal
          order={showGRN}
          onClose={() => setShowGRN(null)}
          onSuccess={() => {
            setShowGRN(null);
            queryClient.invalidateQueries(['purchase-orders']);
          }}
        />
      )}
      {showReturnModal && (
        <SupplierReturnModal
          order={showReturnModal}
          onClose={() => setShowReturnModal(null)}
          onSuccess={() => setShowReturnModal(null)}
        />
      )}
      {deletePO && (
        <DeleteConfirmModal
          order={deletePO}
          onClose={() => setDeletePO(null)}
          onSuccess={() => {
            setDeletePO(null);
            queryClient.invalidateQueries(['purchase-orders']);
          }}
        />
      )}
    </div>
  );
}

function ProductSearchInput({ products, value, onChange, onSelect, onCreateNew }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selectedProduct = products.find((p) => p._id === value || p.id === value);
  const displayValue = selectedProduct
    ? `${selectedProduct.name} ${selectedProduct.sku ? `(${selectedProduct.sku})` : ''}`
    : query;

  const filtered = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(query.toLowerCase()))
      )
    : products.slice(0, 25);

  const showCreateOption = query.trim().length >= 1;
  const totalItems = filtered.length + (showCreateOption ? 1 : 0);

  useEffect(() => {
    setHighlightIdx(-1);
  }, [query]);

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true);
        return;
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      if (showCreateOption && highlightIdx === filtered.length) {
        onCreateNew?.(query);
        setQuery('');
        setOpen(false);
      } else {
        const p = filtered[highlightIdx];
        if (p) {
          onChange(p._id || p.id);
          onSelect(p);
          setQuery('');
          setOpen(false);
        }
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={open ? query : displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type product name or scan SKU barcode..."
          className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-xs"
        />
        {value && !open && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {open && (
        <div
          ref={listRef}
          className="absolute z-[70] mt-1.5 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 space-y-1"
        >
          {showCreateOption && (
            <button
              type="button"
              className={`w-full text-left px-3 py-2.5 text-xs rounded-xl transition-all border border-dashed border-emerald-500/40 ${
                highlightIdx === filtered.length || filtered.length === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border-emerald-500'
                  : 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-semibold'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                onCreateNew?.(query);
                setQuery('');
                setOpen(false);
              }}
              onMouseEnter={() => setHighlightIdx(filtered.length)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span>+ Create New Product "{query || 'New Product'}"</span>
                </div>
                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                  Instant Add
                </span>
              </div>
            </button>
          )}

          {filtered.length === 0 && !showCreateOption && (
            <div className="px-3 py-3 text-xs text-center text-slate-400">
              No matching products found
            </div>
          )}

          {filtered.map((p, idx) => (
            <button
              key={p._id || p.id}
              type="button"
              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${
                idx === highlightIdx
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                  : ''
              } ${(p._id || p.id) === value ? 'bg-blue-50/80 dark:bg-blue-950/80 font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(p._id || p.id);
                onSelect(p);
                setQuery('');
                setOpen(false);
              }}
              onMouseEnter={() => setHighlightIdx(idx)}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">
                    Cost: ৳{(p.costPrice || 0).toLocaleString()}
                  </span>
                  {p.sku && (
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-500">
                      {p.sku}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CreatePOModal({ editPO, onClose, onSuccess }) {
  const [supplierId, setSupplierId] = useState(editPO?.supplierId?._id || editPO?.supplierId || '');
  const [paymentMethod, setPaymentMethod] = useState(editPO?.paymentMethod || 'CASH');
  const [lineItems, setLineItems] = useState(
    editPO?.lineItems?.map((item) => ({
      productId: item.productId?._id || item.productId,
      description: item.description || item.productId?.name || '',
      qty: item.qty || 1,
      unitCost: item.unitCost || 0,
    })) || [{ productId: '', description: '', qty: 1, unitCost: 0 }]
  );
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [inlineProductName, setInlineProductName] = useState('');
  const [targetLineIdx, setTargetLineIdx] = useState(null);
  const queryClient = useQueryClient();

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.get('/suppliers', { params: { limit: 200 } });
      return res.data?.data || [];
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limit: 500 } });
      return res.data?.data || [];
    },
  });

  const suppliers = suppliersData || [];
  const products = productsData || [];

  const addLineItem = () =>
    setLineItems([...lineItems, { productId: '', description: '', qty: 1, unitCost: 0 }]);
  const removeLineItem = (idx) => setLineItems(lineItems.filter((_, i) => i !== idx));
  const updateLineItem = (idx, field, value) => {
    const updated = [...lineItems];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'productId') {
      const product = products.find((p) => (p._id || p.id) === value);
      if (product) {
        updated[idx].description = product.name;
        updated[idx].unitCost = product.costPrice || 0;
      }
    }
    setLineItems(updated);
  };

  const subTotal = lineItems.reduce(
    (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitCost) || 0),
    0
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        supplierId,
        lineItems,
        paymentMethod,
        paidAmount: paymentMethod === 'CREDIT' ? 0 : subTotal,
      };
      if (editPO?._id) {
        return api.put(`/purchase-orders/${editPO._id}`, payload);
      }
      return api.post('/purchase-orders', payload);
    },
    onSuccess: () => {
      toast.success(
        editPO ? 'Purchase order updated successfully!' : 'Purchase order created successfully!'
      );
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save purchase order'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Truck className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white tracking-tight">
                {editPO
                  ? `Edit Purchase Order (${editPO.poNumber})`
                  : 'New Inventory Purchase Order'}
              </h3>
              <p className="text-xs text-blue-100/90 font-medium">
                Restock stock, select vendor supplier, or quickly create non-existing products on
                the fly.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Supplier & Payment Config Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Supplier / Vendor *
                </label>
                <div className="flex gap-2">
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all shadow-xs"
                  >
                    <option value="">Select Vendor Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s._id || s.id} value={s._id || s.id}>
                        {s.name} {s.company ? `(${s.company})` : ''} &middot;{' '}
                        {s.phone || 'No phone'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(true)}
                    className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Supplier
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Payment Terms
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
                  {[
                    { id: 'CASH', label: 'Cash' },
                    { id: 'BANK', label: 'Bank' },
                    { id: 'BKASH', label: 'bKash' },
                    { id: 'CREDIT', label: 'Credit (Due)' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        paymentMethod === m.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" /> Products to Purchase (
                  {lineItems.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Search existing catalog products or type a name to create a non-existing product
                  instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTargetLineIdx(null);
                  setInlineProductName('');
                  setShowAddProductModal(true);
                }}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> New Catalog Product
              </button>
            </div>

            <div className="space-y-2.5">
              {lineItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-300 dark:hover:border-blue-700/60 transition-all shadow-2xs"
                >
                  <div className="flex-1 min-w-[200px]">
                    <ProductSearchInput
                      products={products}
                      value={item.productId}
                      onChange={(val) => updateLineItem(idx, 'productId', val)}
                      onSelect={(product) => {
                        const updated = [...lineItems];
                        updated[idx] = {
                          ...updated[idx],
                          productId: product._id || product.id,
                          description: product.name,
                          unitCost: product.costPrice || 0,
                        };
                        setLineItems(updated);
                      }}
                      onCreateNew={(productName) => {
                        setTargetLineIdx(idx);
                        setInlineProductName(productName);
                        setShowAddProductModal(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5 sm:hidden">
                        Qty
                      </label>
                      <NumberInput
                        value={item.qty}
                        onChange={(e) =>
                          updateLineItem(idx, 'qty', Math.max(1, Number(e.target.value)))
                        }
                        min={1}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                        placeholder="Qty"
                      />
                    </div>

                    <div className="w-32">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5 sm:hidden">
                        Unit Cost
                      </label>
                      <NumberInput
                        value={item.unitCost}
                        onChange={(e) => updateLineItem(idx, 'unitCost', Number(e.target.value))}
                        min={0}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                        placeholder="Unit Cost ৳"
                      />
                    </div>

                    <div className="w-28 text-right font-black text-sm text-slate-900 dark:text-white px-2">
                      ৳{((item.qty || 0) * (item.unitCost || 0)).toLocaleString()}
                    </div>

                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addLineItem}
              className="w-full py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-all flex items-center justify-center gap-1.5 bg-slate-50/50 dark:bg-slate-900/50"
            >
              <Plus className="w-4 h-4" /> Add Another Product Row
            </button>
          </div>

          {/* Financial Calculation Summary */}
          <div className="flex flex-col sm:flex-row items-end justify-between gap-4 bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Payment Status Note
              </span>
              <p className="text-xs text-slate-300 font-medium">
                {paymentMethod === 'CREDIT'
                  ? '৳0 paid now. Full order total will be added as supplier payable credit.'
                  : `Full amount ৳${subTotal.toLocaleString()} will be marked as paid via ${paymentMethod}.`}
              </p>
            </div>
            <div className="text-right space-y-1 shrink-0">
              <div className="text-xs text-slate-400">Total Purchase Order Cost</div>
              <div className="text-3xl font-black text-emerald-400 tracking-tight">
                ৳{subTotal.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all shadow-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !supplierId || lineItems.some((i) => !i.productId)}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Truck className="w-4 h-4 text-white" />
            )}
            {editPO ? 'Update Purchase Order' : 'Save Purchase Order'}
          </button>
        </div>
      </div>

      {showAddSupplierModal && (
        <QuickSupplierModal
          onClose={() => setShowAddSupplierModal(false)}
          onSuccess={(newSupplierId) => {
            setShowAddSupplierModal(false);
            if (newSupplierId) setSupplierId(newSupplierId);
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
          }}
        />
      )}

      {showAddProductModal && (
        <QuickProductModal
          initialName={inlineProductName}
          onClose={() => {
            setShowAddProductModal(false);
            setInlineProductName('');
            setTargetLineIdx(null);
          }}
          onSuccess={(newProd) => {
            setShowAddProductModal(false);
            setInlineProductName('');
            if (newProd?._id || newProd?.id) {
              const createdId = newProd._id || newProd.id;
              if (targetLineIdx !== null && targetLineIdx < lineItems.length) {
                const updated = [...lineItems];
                updated[targetLineIdx] = {
                  productId: createdId,
                  description: newProd.name,
                  qty: updated[targetLineIdx].qty || 1,
                  unitCost: newProd.costPrice || 0,
                };
                setLineItems(updated);
              } else {
                setLineItems((prev) => [
                  ...prev.filter((i) => i.productId),
                  {
                    productId: createdId,
                    description: newProd.name,
                    qty: 1,
                    unitCost: newProd.costPrice || 0,
                  },
                ]);
              }
            }
            setTargetLineIdx(null);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['catalog-categories'] });
          }}
        />
      )}
    </div>
  );
}

function QuickSupplierModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', phone: '', company: '', email: '', address: '' });
  const mutation = useMutation({
    mutationFn: (data) => api.post('/suppliers', data),
    onSuccess: (res) => {
      toast.success('Supplier added successfully!');
      onSuccess(res.data?.data?._id || res.data?._id);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to add supplier'),
  });

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Add New Supplier</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
          className="space-y-3 text-sm"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Supplier Name *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Phone Number *
            </label>
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Company
            </label>
            <input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-lg text-sm"
            >
              {mutation.isPending ? 'Saving...' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickProductModal({ onClose, onSuccess, initialName = '' }) {
  const [form, setForm] = useState({
    name: initialName,
    brand: '',
    category: '',
    costPrice: '',
    sellingPrice: '',
  });
  const { data: categories } = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: async () => {
      const res = await api.get('/catalog', { params: { type: 'CATEGORY' } });
      return res.data?.data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      const cost = Number(data.costPrice) || 0;
      const sell = Number(data.sellingPrice) || cost;
      return api.post('/products', {
        ...data,
        costPrice: cost,
        sellingPrice: sell,
      });
    },
    onSuccess: (res) => {
      toast.success('Product created successfully!');
      const newProd = res.data?.data || res.data;
      onSuccess(newProd);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create product'),
  });

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Add New Purchased Product</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
          className="space-y-3 text-sm"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Product Name *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Brand
              </label>
              <input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
              >
                <option value="">Select Category</option>
                {(categories || []).map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Cost Price (৳) *
              </label>
              <NumberInput
                min="0"
                required
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Selling Price (৳) (Optional)
              </label>
              <NumberInput
                min="0"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                placeholder="Defaults to cost"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm"
            >
              {mutation.isPending ? 'Creating...' : 'Create & Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PODetailModal({ order, onClose }) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-800 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">{order.poNumber}</h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${STATUS_COLORS[order.status] || ''}`}
            >
              {order.status?.replace(/_/g, ' ')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Supplier:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {order.supplierId?.name}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {order.supplierId?.phone}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                ৳{order.netTotal?.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Paid:</span>{' '}
              <span className="font-medium text-green-600 dark:text-green-400">
                ৳{(order.paidAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>
          {order.lineItems?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Items
              </h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-1 text-gray-500">Product</th>
                    <th className="text-right py-1 text-gray-500">Qty</th>
                    <th className="text-right py-1 text-gray-500">Received</th>
                    <th className="text-right py-1 text-gray-500">Unit Cost</th>
                    <th className="text-right py-1 text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lineItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-800/50">
                      <td className="py-1.5 text-gray-900 dark:text-gray-100">
                        {item.productId?.name || item.description}
                      </td>
                      <td className="py-1.5 text-right text-gray-700 dark:text-gray-300">
                        {item.qty}
                      </td>
                      <td className="py-1.5 text-right">
                        <span
                          className={
                            item.receivedQty >= item.qty
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }
                        >
                          {item.receivedQty || 0}
                        </span>
                      </td>
                      <td className="py-1.5 text-right text-gray-700 dark:text-gray-300">
                        ৳{item.unitCost?.toLocaleString()}
                      </td>
                      <td className="py-1.5 text-right text-gray-900 dark:text-gray-100 font-medium">
                        ৳{item.totalCost?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {(order.returnedCount || 0) > 0 && (
            <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase mb-2">
                Returns to Supplier
              </h4>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mb-2">
                {order.returnedCount} item(s) returned · ৳
                {(order.returnedAmount || 0).toLocaleString()} refund credit
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-rose-200 dark:border-rose-800/50">
                    <th className="text-left py-1 text-gray-500">IMEI / Serial</th>
                    <th className="text-left py-1 text-gray-500">Reason</th>
                    <th className="text-right py-1 text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.returnLogs || []).map((r, idx) => (
                    <tr key={idx} className="border-b border-rose-100 dark:border-rose-900/30">
                      <td className="py-1.5 font-mono text-rose-700 dark:text-rose-400">
                        {r.imeiOrSerial}
                      </td>
                      <td className="py-1.5 text-gray-600 dark:text-gray-300">{r.reason || '-'}</td>
                      <td className="py-1.5 text-right text-gray-700 dark:text-gray-300">
                        ৳{(r.purchasePrice || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {order.notes && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-gray-500">Notes:</span> {order.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GRNModal({ order, onClose, onSuccess }) {
  const [entries, setEntries] = useState(
    (order.lineItems || []).map((item) => ({
      productId: item.productId?._id || item.productId,
      description: item.productId?.name || item.description,
      remainingQty: item.qty - (item.receivedQty || 0),
      items: [],
    }))
  );
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState(null);
  // imeiLookupState: { [entryIdx-itemIdx]: { loading, result } }
  const [imeiLookupState, setImeiLookupState] = useState({});
  const lookupTimers = useRef({});

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limit: 500 } });
      return res.data?.data || [];
    },
  });
  const products = productsData || [];

  const addEntry = (idx) => {
    const updated = [...entries];
    const target = updated[idx];
    const pid = typeof target.productId === 'object' ? target.productId?._id : target.productId;
    const product = products.find((p) => String(p._id) === String(pid));
    target.items.push({
      productId: String(pid || ''),
      imeiOrSerial: '',
      purchasePrice: order.lineItems[idx]?.unitCost || 0,
      sellingPrice: product?.sellingPrice || 0,
      warrantyMonths: 12,
    });
    setEntries(updated);
  };
  const removeEntry = (idx, itemIdx) => {
    const updated = [...entries];
    updated[idx].items.splice(itemIdx, 1);
    setEntries(updated);
    // Clear lookup state for removed item
    const key = `${idx}-${itemIdx}`;
    setImeiLookupState((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  };
  const updateEntry = (idx, itemIdx, field, value) => {
    const updated = [...entries];
    updated[idx].items[itemIdx] = { ...updated[idx].items[itemIdx], [field]: value };
    setEntries(updated);
  };

  // Smart IMEI lookup with debounce
  const handleIMEIChange = (idx, itemIdx, value) => {
    updateEntry(idx, itemIdx, 'imeiOrSerial', value);
    const key = `${idx}-${itemIdx}`;

    // Clear previous timer
    if (lookupTimers.current[key]) clearTimeout(lookupTimers.current[key]);

    if (!value || value.trim().length < 6) {
      setImeiLookupState((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
      return;
    }

    // Set loading
    setImeiLookupState((prev) => ({ ...prev, [key]: { loading: true, result: null } }));

    lookupTimers.current[key] = setTimeout(async () => {
      try {
        const res = await api.get(`/inventory/lookup/${encodeURIComponent(value.trim())}`);
        const result = res.data?.data;
        setImeiLookupState((prev) => ({ ...prev, [key]: { loading: false, result } }));

        // If found in inventory, auto-fill prices from existing record
        if (result?.found && result.unit?.product) {
          const prod = result.unit.product;
          const updated = [...entries];
          updated[idx].items[itemIdx] = {
            ...updated[idx].items[itemIdx],
            purchasePrice: result.unit.purchasePrice || updated[idx].items[itemIdx].purchasePrice,
            sellingPrice:
              result.unit.currentSellingPrice ||
              prod.sellingPrice ||
              updated[idx].items[itemIdx].sellingPrice,
            warrantyMonths:
              result.unit.warrantyMonths || updated[idx].items[itemIdx].warrantyMonths,
          };
          setEntries(updated);
          toast.info(`🔍 Found: ${prod.name} (${result.unit.status})`);
        }
      } catch {
        setImeiLookupState((prev) => ({ ...prev, [key]: { loading: false, result: null } }));
      }
    }, 600);
  };

  const handleCameraScan = (decodedText) => {
    setShowCameraScanner(false);
    if (scanTarget) {
      handleIMEIChange(scanTarget.entryIdx, scanTarget.itemIdx, decodedText);
      setScanTarget(null);
    } else {
      // Find first entry that still has room and fill the last empty IMEI slot
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const emptyItem = entry.items.find((item) => !item.imeiOrSerial);
        if (emptyItem) {
          const itemIdx = entry.items.indexOf(emptyItem);
          handleIMEIChange(i, itemIdx, decodedText);
          return;
        }
      }
      toast.error('No empty IMEI slots available. Add more IMEI entries first.');
    }
  };

  const allItems = entries.flatMap((e) => {
    const pid = typeof e.productId === 'object' ? e.productId?._id : e.productId;
    return e.items
      .filter((i) => i.imeiOrSerial && i.imeiOrSerial.trim() !== '')
      .map((i) => ({
        ...i,
        productId: String(i.productId || pid || ''),
        purchasePrice: Number(i.purchasePrice || 0),
        sellingPrice: Number(i.sellingPrice || 0),
        warrantyMonths: Number(i.warrantyMonths || 12),
      }));
  });

  const mutation = useMutation({
    mutationFn: async () =>
      api.post(`/purchase-orders/${order._id}/receive`, { grnEntries: allItems }),
    onSuccess: () => {
      toast.success('Goods received successfully');
      queryClient.invalidateQueries(['purchase-orders']);
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-3xl border border-gray-200 dark:border-gray-800 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              Receive Goods — {order.poNumber}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Enter IMEI/Serial numbers for each item received
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          {entries.map((entry, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {entry.description}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({entry.remainingQty} remaining)
                  </span>
                </div>
                {entry.items.length < entry.remainingQty && (
                  <button
                    onClick={() => addEntry(idx)}
                    className="flex items-center gap-1 text-xs font-medium text-[#2563EB] dark:text-blue-400 hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add IMEI
                  </button>
                )}
              </div>
              {entry.items.map((item, itemIdx) => {
                const lookupKey = `${idx}-${itemIdx}`;
                const ls = imeiLookupState[lookupKey];
                const lookupResult = ls?.result;
                return (
                  <div key={itemIdx} className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="IMEI / Serial — type or scan to auto-detect product"
                          value={item.imeiOrSerial}
                          onChange={(e) => handleIMEIChange(idx, itemIdx, e.target.value)}
                          className={`w-full px-2 py-1.5 bg-white dark:bg-gray-800 border rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none transition-colors ${
                            lookupResult?.found
                              ? 'border-emerald-400 dark:border-emerald-600 focus:border-emerald-500'
                              : lookupResult?.found === false
                                ? 'border-gray-300 dark:border-gray-700 focus:border-[#2563EB]'
                                : 'border-gray-300 dark:border-gray-700 focus:border-[#2563EB]'
                          }`}
                        />
                        {ls?.loading && (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400 absolute right-2 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setScanTarget({ entryIdx: idx, itemIdx });
                          setShowCameraScanner(true);
                        }}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                        title="Scan IMEI"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <NumberInput
                        placeholder="Cost"
                        value={item.purchasePrice}
                        onChange={(e) =>
                          updateEntry(idx, itemIdx, 'purchasePrice', Number(e.target.value))
                        }
                        className="w-24 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#2563EB]"
                      />
                      <button
                        onClick={() => removeEntry(idx, itemIdx)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                    {/* IMEI Lookup Result Badge */}
                    {lookupResult?.found && lookupResult.unit?.product && (
                      <div className="ml-1 flex items-center gap-2 text-[11px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {lookupResult.unit.product.name}
                        </span>
                        {lookupResult.unit.product.brand && (
                          <span className="text-emerald-600 dark:text-emerald-500">
                            {lookupResult.unit.product.brand}
                          </span>
                        )}
                        {lookupResult.unit.product.model && (
                          <span className="text-emerald-600 dark:text-emerald-500">
                            · {lookupResult.unit.product.model}
                          </span>
                        )}
                        <span
                          className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            lookupResult.unit.status === 'Available'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                              : lookupResult.unit.status === 'Sold'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                          }`}
                        >
                          {lookupResult.unit.status}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={
                mutation.isPending || allItems.length === 0 || allItems.some((i) => !i.imeiOrSerial)
              }
              className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Package className="w-4 h-4" />
              )}
              Receive {allItems.length} Items
            </button>
          </div>
        </div>
      </div>

      <BarcodeScannerModal
        open={showCameraScanner}
        onScan={handleCameraScan}
        onClose={() => {
          setShowCameraScanner(false);
          setScanTarget(null);
        }}
      />
    </div>
  );
}

function SupplierReturnModal({ order, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [selectedImeis, setSelectedImeis] = useState([]);
  const queryClient = useQueryClient();

  const returnedImeis = new Set((order?.returnLogs || []).map((r) => r.imeiOrSerial));
  const grnItems = (order?.grnEntries || []).map((e) => ({
    ...e,
    isReturned: returnedImeis.has(e.imeiOrSerial),
  }));
  const allImeis = grnItems.filter((e) => !e.isReturned).map((e) => e.imeiOrSerial);
  const isAllSelected = allImeis.length > 0 && selectedImeis.length === allImeis.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedImeis([]);
    } else {
      setSelectedImeis(allImeis);
    }
  };

  const toggleImei = (imei) => {
    if (selectedImeis.includes(imei)) {
      setSelectedImeis(selectedImeis.filter((i) => i !== imei));
    } else {
      setSelectedImeis([...selectedImeis, imei]);
    }
  };

  const estimatedRefund = grnItems
    .filter((e) => !e.isReturned && selectedImeis.includes(e.imeiOrSerial))
    .reduce((acc, curr) => acc + (Number(curr.purchasePrice) || 0), 0);

  const mutation = useMutation({
    mutationFn: async () =>
      api.post(`/purchase-orders/${order._id}/return`, {
        imeiOrSerials: selectedImeis,
        reason,
      }),
    onSuccess: (res) => {
      const data = res.data?.data;
      toast.success(
        `Returned ${data?.returnedCount || selectedImeis.length} item(s) to supplier! Refund credit ৳${(data?.totalRefund || estimatedRefund).toLocaleString()}${data?.skippedCount ? ` (${data.skippedCount} skipped)` : ''}`
      );
      queryClient.invalidateQueries(['purchase-orders']);
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to process return'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-lg border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Bulk Return to Supplier</h3>
            <p className="text-xs text-gray-500">
              {order.poNumber} &middot; {order.supplierId?.name || 'Supplier'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Select Items / IMEIs ({selectedImeis.length}/{allImeis.length})
              </label>
              {allImeis.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
                >
                  {isAllSelected ? 'Deselect All' : `Select All (${allImeis.length})`}
                </button>
              )}
            </div>
            {grnItems.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">
                No received items available for this order.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-gray-50 dark:bg-gray-900">
                {grnItems.map((entry, idx) => {
                  const isChecked = selectedImeis.includes(entry.imeiOrSerial);
                  if (entry.isReturned) {
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100/70 dark:bg-gray-800/40 opacity-60"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600" />
                          <div>
                            <div className="text-xs font-mono font-bold text-gray-400 line-through">
                              {entry.imeiOrSerial}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              Purchase Cost: ৳{entry.purchasePrice?.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold uppercase text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/50">
                          Returned
                        </span>
                      </div>
                    );
                  }
                  return (
                    <label
                      key={idx}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleImei(entry.imeiOrSerial)}
                          className="rounded text-[#2563EB] focus:ring-[#2563EB] w-4 h-4"
                        />
                        <div>
                          <div className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100">
                            {entry.imeiOrSerial}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Purchase Cost: ৳{entry.purchasePrice?.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300">
                        ৳{entry.purchasePrice?.toLocaleString()}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {selectedImeis.length > 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Total Refund Credit:
              </span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                ৳{estimatedRefund.toLocaleString()}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Return Reason *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Defective camera, wrong model, bulk inventory return"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={mutation.isPending || selectedImeis.length === 0 || !reason}
              onClick={() => mutation.mutate()}
              className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2"
            >
              {mutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
              Confirm Bulk Return ({selectedImeis.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ order, onClose, onSuccess }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/purchase-orders/${order._id}`),
    onSuccess: () => {
      toast.success('Purchase order deleted');
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Delete Purchase Order</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">
              Are you sure you want to delete purchase order <strong>{order.poNumber}</strong>?
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This action cannot be undone. Only orders that haven't been received can be deleted.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
            className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2"
          >
            {deleteMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete Order
          </button>
        </div>
      </div>
    </div>
  );
}
