import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Truck,
  Eye,
  CheckCircle,
  XCircle,
  Package,
  RefreshCw,
  Minus,
  Pencil,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const STATUSES = [
  'ALL',
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
];
const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  PENDING_APPROVAL: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  APPROVED: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  PARTIALLY_RECEIVED: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  RECEIVED: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  CANCELLED: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
};

export default function PurchaseOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [editPO, setEditPO] = useState(null);
  const [viewPO, setViewPO] = useState(null);
  const [showGRN, setShowGRN] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(null);
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

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => api.put(`/purchase-orders/${id}`, { status }),
    onSuccess: () => {
      toast.success('Order updated');
      queryClient.invalidateQueries(['purchase-orders']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Purchase Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create and manage purchase orders with suppliers
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-medium rounded-lg text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> New Purchase Order
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === s ? 'bg-red-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
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
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[po.status] || ''}`}
                      >
                        {po.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(po.createdAt).toLocaleDateString('en-BD')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {po.status === 'DRAFT' && (
                          <button
                            onClick={() =>
                              statusMutation.mutate({ id: po._id, status: 'PENDING_APPROVAL' })
                            }
                            className="px-2 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 transition-colors"
                          >
                            Submit
                          </button>
                        )}
                        {po.status === 'PENDING_APPROVAL' && (
                          <button
                            onClick={() =>
                              statusMutation.mutate({ id: po._id, status: 'APPROVED' })
                            }
                            className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            Approve
                          </button>
                        )}
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
                        {(po.status === 'DRAFT' || po.status === 'PENDING_APPROVAL') && (
                          <button
                            onClick={() => setEditPO(po)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            title="Edit Order"
                          >
                            <Pencil className="w-4 h-4" />
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
    </div>
  );
}

function CreatePOModal({ editPO, onClose, onSuccess }) {
  const [supplierId, setSupplierId] = useState(
    editPO?.supplierId?._id || editPO?.supplierId || ''
  );
  const [paymentMethod, setPaymentMethod] = useState(editPO?.paymentMethod || 'CREDIT');
  const [paidAmount, setPaidAmount] = useState(editPO?.paidAmount || 0);
  const [notes, setNotes] = useState(editPO?.notes || '');
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
      const product = products.find((p) => p._id === value);
      if (product) {
        updated[idx].description = product.name;
        updated[idx].unitCost = product.costPrice || 0;
      }
    }
    setLineItems(updated);
  };

  const subTotal = lineItems.reduce((sum, item) => sum + item.qty * item.unitCost, 0);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        supplierId,
        lineItems,
        paymentMethod,
        paidAmount: Number(paidAmount),
        notes,
      };
      if (editPO?._id) {
        return api.put(`/purchase-orders/${editPO._id}`, payload);
      }
      return api.post('/purchase-orders', payload);
    },
    onSuccess: () => {
      toast.success(editPO ? 'Purchase order updated' : 'Purchase order created');
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save purchase order'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-3xl border border-gray-200 dark:border-gray-800 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            {editPO ? 'Edit Purchase Order' : 'New Purchase Order'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Supplier *
              </label>
              <div className="flex gap-2">
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.phone || 'No phone'})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(true)}
                  className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
                  title="Add new supplier"
                >
                  <Plus className="w-3.5 h-3.5" /> Supplier
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
              >
                <option value="CASH">Cash</option>
                <option value="BANK">Bank</option>
                <option value="BKASH">bKash</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Line Items
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(true)}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" /> New Product
                </button>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>
            </div>
            {lineItems.map((item, idx) => (
              <div
                key={idx}
                className="flex gap-2 items-start bg-gray-50 dark:bg-gray-900 rounded-lg p-3"
              >
                <div className="flex-1">
                  <select
                    value={item.productId}
                    onChange={(e) => updateLineItem(idx, 'productId', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => updateLineItem(idx, 'qty', Number(e.target.value))}
                    min={1}
                    className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
                    placeholder="Qty"
                  />
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    value={item.unitCost}
                    onChange={(e) => updateLineItem(idx, 'unitCost', Number(e.target.value))}
                    min={0}
                    className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
                    placeholder="Unit Cost"
                  />
                </div>
                <div className="w-28 text-right text-sm text-gray-700 dark:text-gray-300 pt-1.5">
                  ৳{(item.qty * item.unitCost).toLocaleString()}
                </div>
                {lineItems.length > 1 && (
                  <button
                    onClick={() => removeLineItem(idx)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2 w-64">
              <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>Sub Total</span>
                <span>৳{subTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700 pt-2">
                <span>Total</span>
                <span>৳{subTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Paid Amount (৳)
              </label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                min={0}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
                placeholder="Optional notes"
              />
            </div>
          </div>

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
              disabled={mutation.isPending || !supplierId || lineItems.some((i) => !i.productId)}
              className="flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {editPO ? 'Update Order' : 'Create Order'}
            </button>
          </div>
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
          onClose={() => setShowAddProductModal(false)}
          onSuccess={(newProd) => {
            setShowAddProductModal(false);
            if (newProd?._id) {
              setLineItems((prev) => [
                ...prev.filter((i) => i.productId),
                {
                  productId: newProd._id,
                  description: newProd.name,
                  qty: 1,
                  unitCost: newProd.costPrice || 0,
                },
              ]);
            }
            queryClient.invalidateQueries({ queryKey: ['products'] });
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Supplier Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number *</label>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Company</label>
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg text-sm">{mutation.isPending ? 'Saving...' : 'Add Supplier'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickProductModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', brand: '', category: '', costPrice: '', sellingPrice: '' });
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Product Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Brand</label>
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100">
                <option value="">Select Category</option>
                {(categories || []).map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cost Price (৳) *</label>
              <input type="number" min="0" required value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Selling Price (৳) (Optional)</label>
              <input type="number" min="0" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100" placeholder="Defaults to cost" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm">{mutation.isPending ? 'Creating...' : 'Create & Add'}</button>
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

  const addEntry = (idx) => {
    const updated = [...entries];
    updated[idx].items.push({
      imeiOrSerial: '',
      purchasePrice: order.lineItems[idx]?.unitCost || 0,
      sellingPrice: 0,
      warrantyMonths: 12,
    });
    setEntries(updated);
  };
  const removeEntry = (idx, itemIdx) => {
    const updated = [...entries];
    updated[idx].items.splice(itemIdx, 1);
    setEntries(updated);
  };
  const updateEntry = (idx, itemIdx, field, value) => {
    const updated = [...entries];
    updated[idx].items[itemIdx] = { ...updated[idx].items[itemIdx], [field]: value };
    setEntries(updated);
  };

  const allItems = entries.flatMap((e) => e.items.filter((i) => i.imeiOrSerial));

  const mutation = useMutation({
    mutationFn: async () =>
      api.post(`/purchase-orders/${order._id}/receive`, { grnEntries: allItems }),
    onSuccess: () => {
      toast.success('Goods received successfully');
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
                    className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add IMEI
                  </button>
                )}
              </div>
              {entry.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="IMEI / Serial"
                    value={item.imeiOrSerial}
                    onChange={(e) => updateEntry(idx, itemIdx, 'imeiOrSerial', e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="number"
                    placeholder="Cost"
                    value={item.purchasePrice}
                    onChange={(e) =>
                      updateEntry(idx, itemIdx, 'purchasePrice', Number(e.target.value))
                    }
                    className="w-24 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="number"
                    placeholder="Sell Price"
                    value={item.sellingPrice}
                    onChange={(e) =>
                      updateEntry(idx, itemIdx, 'sellingPrice', Number(e.target.value))
                    }
                    className="w-24 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => removeEntry(idx, itemIdx)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
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
    </div>
  );
}

function SupplierReturnModal({ order, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [selectedImeis, setSelectedImeis] = useState([]);
  const queryClient = useQueryClient();

  const grnItems = order?.grnEntries || [];

  const toggleImei = (imei) => {
    if (selectedImeis.includes(imei)) {
      setSelectedImeis(selectedImeis.filter((i) => i !== imei));
    } else {
      setSelectedImeis([...selectedImeis, imei]);
    }
  };

  const mutation = useMutation({
    mutationFn: async () =>
      api.post(`/purchase-orders/${order._id}/return`, {
        imeiOrSerials: selectedImeis,
        reason,
      }),
    onSuccess: (res) => {
      const data = res.data?.data;
      toast.success(
        `Returned ${data?.returnedCount || selectedImeis.length} item(s) to supplier! Refunded ৳${(data?.totalRefund || 0).toLocaleString()}`
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
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Return to Supplier</h3>
            <p className="text-xs text-gray-500">{order.poNumber} &middot; {order.supplierId?.name || 'Supplier'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Select Items / IMEIs to Return ({selectedImeis.length} selected)
            </label>
            {grnItems.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No received items available for this order.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-gray-50 dark:bg-gray-900">
                {grnItems.map((entry, idx) => {
                  const isChecked = selectedImeis.includes(entry.imeiOrSerial);
                  return (
                    <label
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-red-400"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleImei(entry.imeiOrSerial)}
                          className="rounded text-red-600 focus:ring-red-500"
                        />
                        <div>
                          <div className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100">{entry.imeiOrSerial}</div>
                          <div className="text-[10px] text-gray-500">Cost: ৳{entry.purchasePrice}</div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Return Reason *</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Defective camera, wrong model, damaged box"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm">Cancel</button>
            <button
              type="button"
              disabled={mutation.isPending || selectedImeis.length === 0 || !reason}
              onClick={() => mutation.mutate()}
              className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2"
            >
              {mutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
              Confirm Return ({selectedImeis.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
