import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Plus,
  Eye,
  Trash2,
  X,
  Search,
  DollarSign,
  Building2,
  RotateCcw,
  CheckCircle2,
  Wallet,
  CreditCard,
  Banknote,
} from 'lucide-react';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import DatePicker from '../../components/ui/DatePicker';

export default function WholesaleOrders() {
  const { styled } = useTheme();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDetail, setShowDetail] = useState(null);

  // Modals state
  const [collectDueOrder, setCollectDueOrder] = useState(null);
  const [collectForm, setCollectForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    reference: '',
    notes: '',
  });

  const [returnOrder, setReturnOrder] = useState(null);
  const [returnItems, setReturnItems] = useState({});
  const [returnReason, setReturnReason] = useState('Defective / Damaged');
  const [returnNotes, setReturnNotes] = useState('');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['wholesale-orders'],
    queryFn: async () => {
      const r = await api.get('/wholesale/orders');
      return r.data;
    },
  });
  const orders = ordersData?.data || [];

  const { data: stats } = useQuery({
    queryKey: ['wholesale-stats'],
    queryFn: async () => {
      const r = await api.get('/wholesale/orders/stats');
      return r.data?.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/wholesale/orders/${id}`),
    onSuccess: () => {
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['wholesale-orders'] });
    },
    onError: (e) => toast.error(e.response?.data?.message),
  });

  const collectDueMutation = useMutation({
    mutationFn: async ({ id, data }) => api.post(`/wholesale/orders/${id}/collect-due`, data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Due payment collected successfully!');
      setCollectDueOrder(null);
      qc.invalidateQueries({ queryKey: ['wholesale-orders'] });
      qc.invalidateQueries({ queryKey: ['wholesale-stats'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to collect due'),
  });

  const processReturnMutation = useMutation({
    mutationFn: async ({ id, data }) => api.post(`/wholesale/orders/${id}/return`, data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Wholesale return processed successfully!');
      setReturnOrder(null);
      qc.invalidateQueries({ queryKey: ['wholesale-orders'] });
      qc.invalidateQueries({ queryKey: ['wholesale-stats'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to process return'),
  });

  const handleOpenReturnModal = async (orderId) => {
    try {
      const { data } = await api.get(`/wholesale/orders/${orderId}`);
      const order = data.data;
      setReturnOrder(order);
      const initialItems = {};
      (order.items || []).forEach((item) => {
        initialItems[item._id || item.productId] = 0;
      });
      setReturnItems(initialItems);
    } catch (e) {
      toast.error('Failed to load order details for return');
    }
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.companyName?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (dateFrom || dateTo) {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      if (dateFrom && orderDate < dateFrom) return false;
      if (dateTo && orderDate > dateTo) return false;
    }
    return true;
  });

  const cardCls = styled
    ? 'neu-card'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800';
  const inputCls = styled
    ? 'neu-input w-full px-3 py-2 rounded-xl text-sm'
    : 'w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-red-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-red-600" /> Wholesale Sales & Orders
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track B2B dealer sales, revenue, paid collections, and outstanding dues
          </p>
        </div>
        <button
          onClick={() => navigate('/sales/new')}
          className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-medium rounded-lg text-sm transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Wholesale Sale
        </button>
      </div>

      {/* 4 Financial Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${cardCls} p-4`}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Orders / Sales</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {stats?.totalOrders || 0}
          </div>
        </div>
        <div className={`${cardCls} p-4`}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Revenue</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            ৳{(stats?.totalRevenue || 0).toLocaleString()}
          </div>
        </div>
        <div className={`${cardCls} p-4`}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Paid Collected</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ৳{(stats?.totalPaid || 0).toLocaleString()}
          </div>
        </div>
        <div className={`${cardCls} p-4`}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Outstanding Due</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            ৳{(stats?.totalDue || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search & Date Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-10`}
          />
        </div>
        <div className="flex items-center gap-2">
          <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From Date" />
          <span className="text-gray-400">—</span>
          <DatePicker value={dateTo} onChange={setDateTo} placeholder="To Date" />
        </div>
      </div>

      {/* Financial Table */}
      <div className={`${cardCls} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-left">
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                Order / Invoice #
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                B2B Customer / Dealer
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Total</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Paid</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Due</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 animate-pulse">
                  Loading wholesale transactions...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No wholesale orders found
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr
                  key={o._id}
                  className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => navigate(o.isPosSale ? `/sales/${o._id}` : '#')}
                      className="hover:text-red-600 hover:underline"
                    >
                      {o.orderNumber}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {o.customer?.name || 'Walk-in Dealer'}
                    </div>
                    {o.customer?.companyName && (
                      <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {o.customer.companyName}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">
                    ৳{(o.grandTotal || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                    ৳{(o.paidAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">
                    ৳{(o.dueAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {o.dueAmount > 0 && (
                        <button
                          onClick={() => {
                            setCollectDueOrder(o);
                            setCollectForm({
                              amount: o.dueAmount,
                              paymentMethod: 'cash',
                              reference: '',
                              notes: '',
                            });
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
                          title="Collect Due Payment"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Collect Due
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenReturnModal(o._id)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-400 hover:text-amber-600 transition-colors"
                        title="Process Item Return"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          o.isPosSale ? navigate(`/sales/${o._id}`) : setShowDetail(o)
                        }
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500 transition-colors"
                        title="View Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          confirmDelete('Delete wholesale order?', () =>
                            deleteMutation.mutate(o._id)
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Collect Due Payment Modal */}
      {collectDueOrder && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setCollectDueOrder(null)}
        >
          <div
            className={`${cardCls} w-full max-w-md p-6 shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b dark:border-gray-800 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" /> Collect Due Payment
              </h3>
              <button
                onClick={() => setCollectDueOrder(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                collectDueMutation.mutate({ id: collectDueOrder._id, data: collectForm });
              }}
              className="space-y-4 text-sm"
            >
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl space-y-1">
                <div className="text-xs text-gray-500">
                  Order / Invoice:{' '}
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                    {collectDueOrder.orderNumber}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  B2B Dealer:{' '}
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {collectDueOrder.customer?.name}
                  </span>
                </div>
                <div className="text-xs text-red-600 dark:text-red-400 font-bold">
                  Remaining Due: ৳{collectDueOrder.dueAmount?.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Collection Amount (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={collectDueOrder.dueAmount}
                  value={collectForm.amount}
                  onChange={(e) => setCollectForm({ ...collectForm, amount: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 font-medium">
                  Payment Method *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'Cash' },
                    { id: 'bkash', label: 'bKash' },
                    { id: 'nagad', label: 'Nagad' },
                    { id: 'rocket', label: 'Rocket' },
                    { id: 'bank', label: 'Bank Transfer' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCollectForm({ ...collectForm, paymentMethod: m.id })}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all ${
                        collectForm.paymentMethod === m.id
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Reference / TxID (Optional)
                </label>
                <input
                  value={collectForm.reference}
                  onChange={(e) => setCollectForm({ ...collectForm, reference: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCollectDueOrder(null)}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={collectDueMutation.isPending}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm"
                >
                  {collectDueMutation.isPending ? 'Collecting...' : 'Confirm Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Return / Order Edit Modal */}
      {returnOrder && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setReturnOrder(null)}
        >
          <div
            className={`${cardCls} w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b dark:border-gray-800 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" /> Return Wholesale Items —{' '}
                {returnOrder.orderNumber}
              </h3>
              <button
                onClick={() => setReturnOrder(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const itemsToReturn = Object.entries(returnItems)
                  .filter(([_, qty]) => Number(qty) > 0)
                  .map(([lineItemId, qty]) => ({
                    lineItemId,
                    quantity: Number(qty),
                    reason: returnReason,
                    notes: returnNotes,
                  }));

                if (itemsToReturn.length === 0) {
                  toast.warning('Please enter return quantity (>0) for at least one item');
                  return;
                }

                processReturnMutation.mutate({
                  id: returnOrder._id,
                  data: { items: itemsToReturn },
                });
              }}
              className="space-y-4 text-sm"
            >
              <div className="text-xs text-gray-500 mb-2">
                Select quantity to return for each line item. Returned stock will automatically be
                restored back to inventory.
              </div>

              <div className="space-y-3">
                {(returnOrder.items || []).map((item) => {
                  const maxReturn = item.quantity || item.qty || 1;
                  const itemKey = item._id || item.productId;
                  return (
                    <div
                      key={itemKey}
                      className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl space-y-2"
                    >
                      <div className="flex justify-between font-medium text-gray-900 dark:text-gray-100">
                        <span>{item.product?.name || item.description || 'Item'}</span>
                        <span>৳{(item.unitPrice || 0).toLocaleString()} / unit</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          Ordered Qty:{' '}
                          <strong className="text-gray-800 dark:text-gray-200">
                            {maxReturn} pcs
                          </strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="font-semibold text-gray-700 dark:text-gray-300">
                            Return Qty:
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={maxReturn}
                            value={returnItems[itemKey] || 0}
                            onChange={(e) =>
                              setReturnItems({ ...returnItems, [itemKey]: Number(e.target.value) })
                            }
                            className="w-20 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Return Reason *
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className={inputCls}
                >
                  <option value="Defective / Damaged">Defective / Damaged Product</option>
                  <option value="Wrong Item Shipped">Wrong Item Shipped</option>
                  <option value="Customer Cancellation">Customer Cancellation</option>
                  <option value="Excess Quantity Returned">Excess Quantity Returned</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Notes / Description
                </label>
                <input
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnOrder(null)}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processReturnMutation.isPending}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm"
                >
                  {processReturnMutation.isPending ? 'Processing...' : 'Submit Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDetail(null)}
        >
          <div
            className={`${cardCls} w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {showDetail.orderNumber}
              </h2>
              <button
                onClick={() => setShowDetail(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span className="font-medium">{showDetail.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Grand Total</span>
                <span className="font-bold">৳{showDetail.grandTotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Paid Amount</span>
                <span className="font-bold text-emerald-600">
                  ৳{showDetail.paidAmount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Due Amount</span>
                <span className="font-bold text-red-600">
                  ৳{showDetail.dueAmount?.toLocaleString()}
                </span>
              </div>
              <hr className="dark:border-gray-700" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Items</h3>
              {showDetail.items?.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between bg-gray-50 dark:bg-gray-800/30 p-2 rounded-lg"
                >
                  <span>
                    {item.product?.name || item.productName || 'N/A'} x{item.quantity || item.qty}
                  </span>
                  <span className="font-medium">৳{item.total?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
