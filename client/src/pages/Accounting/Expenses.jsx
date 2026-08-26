import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Boxes,
  Building2,
  Calendar,
  DollarSign,
  ExternalLink,
  FileImage,
  Filter,
  Layers,
  Package,
  Paperclip,
  Pencil,
  PieChart,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Tag,
  Trash2,
  TrendingDown,
  Upload,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import DatePicker from '../../components/ui/DatePicker';
import { NumberInput } from '../../components/ui/NumberInput';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';

const DEFAULT_CATEGORIES = [
  'Shop Rent',
  'Electricity & Utility',
  'Food & Entertainment',
  'Shop Maintenance & Repairs',
  'Marketing & Ads',
  'Salary & Bonus',
  'Office Supplies',
  'Internet & Phone',
  'Transport & Courier',
  'Miscellaneous',
];

import PageHeader from '../../components/layout/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import RecurringExpenses from './RecurringExpenses';

export default function Expenses() {
  const { styled } = useTheme();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('expenses');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [categoryChoice, setCategoryChoice] = useState('Shop Rent');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [addReceipts, setAddReceipts] = useState([]);
  const [addUploading, setAddUploading] = useState(false);

  useEffect(() => {
    if (!showAddModal && !editingExpense) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setEditingExpense(null);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showAddModal, editingExpense]);

  const { data: fetchedCategories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await api.get('/expenses/categories');
      return res.data?.data || DEFAULT_CATEGORIES;
    },
  });

  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...fetchedCategories])).filter(
    Boolean
  );

  const { data: expenseData, isLoading } = useQuery({
    queryKey: ['expenses', selectedCategory, dateFrom, dateTo, search],
    queryFn: async () => {
      const res = await api.get('/expenses', {
        params: { category: selectedCategory, from: dateFrom, to: dateTo, search },
      });
      return res.data?.data;
    },
  });

  // Query product purchase orders for complete stock costing integration
  const { data: purchaseData, isLoading: isPurchaseLoading } = useQuery({
    queryKey: ['costing-purchases', dateFrom, dateTo, search],
    queryFn: async () => {
      const res = await api.get('/purchase-orders', {
        params: { from: dateFrom, to: dateTo, search, limit: 100 },
      });
      return res.data?.data;
    },
  });

  const rawPurchaseOrders = purchaseData?.orders || (Array.isArray(purchaseData) ? purchaseData : []);
  const purchaseOrders = rawPurchaseOrders.filter((po) => po.status !== 'CANCELLED');

  const totalPurchasesCost = purchaseOrders.reduce((sum, po) => {
    const net = Number(po.netTotal || po.net_total || po.subTotal || 0);
    const ret = Number(po.returnedAmount || po.returned_amount || 0);
    return sum + Math.max(0, net - ret);
  }, 0);

  const expenses = expenseData?.expenses || [];
  const summary = expenseData?.summary || {};
  const totalOpExpenses = Number(summary.totalExpense || 0);
  const totalCombinedOutflow = totalOpExpenses + totalPurchasesCost;

  // Combined sorted list for all outgoings
  const combinedOutgoings = [
    ...expenses.map((e) => ({
      id: `exp-${e._id}`,
      type: 'EXPENSE',
      date: e.date || e.createdAt,
      title: e.title,
      category: e.category,
      amount: Number(e.amount || 0),
      method: e.paymentMethod,
      details: e.voucherNumber ? `Voucher #${e.voucherNumber}` : e.notes || 'Operating Expense',
      ref: e,
    })),
    ...purchaseOrders.map((po) => {
      const net = Number(po.netTotal || po.net_total || po.subTotal || 0);
      const ret = Number(po.returnedAmount || po.returned_amount || 0);
      const netCost = Math.max(0, net - ret);
      const supplierName = typeof po.supplierId === 'object' ? po.supplierId?.name : (po.supplier_name || 'Supplier');
      const itemNames = (po.lineItems || []).map((li) => `${li.name || li.description} × ${li.qty}`).join(', ');
      return {
        id: `po-${po.id || po._id}`,
        type: 'PURCHASE',
        date: po.createdAt || po.created_at,
        title: `Product Restock: ${itemNames || po.poNumber}`,
        category: 'Stock Restock',
        amount: netCost,
        method: po.paymentMethod || 'CASH',
        details: `${po.poNumber} • ${supplierName}${ret > 0 ? ` (Net after ৳${ret.toLocaleString()} return)` : ''}`,
        ref: po,
      };
    }),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const createExpenseMutation = useMutation({
    mutationFn: async (data) => api.post('/expenses', data),
    onSuccess: () => {
      toast.success('Expense recorded successfully');
      setShowAddModal(false);
      setCustomCategoryInput('');
      setCategoryChoice('Shop Rent');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['expense-categories'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to record expense'),
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }) => api.put(`/expenses/${id}`, data),
    onSuccess: () => {
      toast.success('Expense entry updated successfully');
      setEditingExpense(null);
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['expense-categories'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update expense'),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      toast.success('Expense entry deleted');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['expense-categories'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete expense'),
  });

  const cardCls = styled
    ? 'neu-card p-5'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-5';
  const inputCls = styled
    ? 'neu-input w-full px-3 py-2 rounded-xl text-sm'
    : 'w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-[#2563EB]';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop Costing & Expenses"
        subtitle="Track shop operating costs, rent, utilities, food, marketing, salaries, and inventory product restock costs."
        icon={Receipt}
        breadcrumbs={['Finance & Accounts', 'Shop Costing & Expenses']}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/purchases"
              className="flex items-center gap-2 px-4 py-2 border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl text-xs transition-all"
            >
              <ShoppingCart className="w-4 h-4" /> New Product Purchase
            </Link>
            <button
              onClick={() => {
                setCategoryChoice(categories[0] || 'Shop Rent');
                setCustomCategoryInput('');
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" /> Record New Expense
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl w-fit border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'expenses'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xs'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Operating Expenses
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'purchases'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Package className="w-4 h-4" />
          Product Restock Costs ({purchaseOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('combined')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'combined'
              ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          All Shop Outgoings ({combinedOutgoings.length})
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'recurring'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xs'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Recurring
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase font-semibold">Operating Expenses</span>
            <span className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg text-xs font-bold">OPEX</span>
          </div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            ৳{totalOpExpenses.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {summary.count || 0} Expense Entries
          </div>
        </div>

        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase font-semibold">Product Restock Cost</span>
            <span className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg text-xs font-bold">STOCK</span>
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            ৳{totalPurchasesCost.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {purchaseOrders.length} Purchase Orders
          </div>
        </div>

        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase font-semibold">Total Shop Outgoings</span>
            <span className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg text-xs font-bold">ALL</span>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            ৳{totalCombinedOutflow.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Expenses + Stock Restocks
          </div>
        </div>

        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase font-semibold">Rent & Utilities</span>
            <span className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg text-xs font-bold">FIXED</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            ৳
            {(
              (summary.categoryBreakdown?.['Shop Rent'] || 0) +
              (summary.categoryBreakdown?.['Electricity & Utility'] || 0)
            ).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1 truncate">
            Top: {Object.entries(summary.categoryBreakdown || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
          </div>
        </div>
      </div>

      {/* Tab 1: Operating Expenses */}
      {activeTab === 'expenses' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expense title, voucher # or notes..."
                className={`${inputCls} pl-10`}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`${inputCls} md:w-56`}
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From Date" />
              <span className="text-gray-400">—</span>
              <DatePicker value={dateTo} onChange={setDateTo} placeholder="To Date" />
            </div>
          </div>

          {/* Expenses Table */}
          <div className={`${cardCls} overflow-x-auto p-0`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left bg-gray-50/50 dark:bg-gray-900/50">
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Title / Purpose</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Category</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Amount</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Method</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Voucher / Notes</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400 animate-pulse">
                      Loading shop expenses...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No expense records found
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr
                      key={e._id}
                      className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    >
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(e.date || e.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                        {e.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-red-600 dark:text-red-400">
                        ৳{e.amount?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs uppercase font-semibold text-gray-500">
                        {e.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          {e.voucherNumber ? `Voucher: ${e.voucherNumber}` : e.notes || 'N/A'}
                          {e.receipts?.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              <Paperclip className="w-2.5 h-2.5" />
                              {e.receipts.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingExpense(e)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Edit Expense"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            confirmDelete(`Delete expense "${e.title}"?`, () =>
                              deleteExpenseMutation.mutate(e._id)
                            )
                          }
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tab 2: Product Restock Costs */}
      {activeTab === 'purchases' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by PO #, product name, or supplier..."
                className={`${inputCls} pl-10`}
              />
            </div>
            <div className="flex items-center gap-2">
              <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From Date" />
              <span className="text-gray-400">—</span>
              <DatePicker value={dateTo} onChange={setDateTo} placeholder="To Date" />
            </div>
          </div>

          {/* Purchases Table */}
          <div className={`${cardCls} overflow-x-auto p-0`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left bg-gray-50/50 dark:bg-gray-900/50">
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date & PO #</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Supplier</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Purchased Products</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Net Cost (৳)</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Payment</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {isPurchaseLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400 animate-pulse">
                      Loading product purchases...
                    </td>
                  </tr>
                ) : purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No product restock purchases found
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => {
                    const net = Number(po.netTotal || po.net_total || po.subTotal || 0);
                    const ret = Number(po.returnedAmount || po.returned_amount || 0);
                    const netCost = Math.max(0, net - ret);
                    const supplierName = typeof po.supplierId === 'object' ? po.supplierId?.name : (po.supplier_name || 'Supplier');
                    const supplierPhone = typeof po.supplierId === 'object' ? po.supplierId?.phone : '';

                    return (
                      <tr
                        key={po.id || po._id}
                        className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{po.poNumber}</div>
                          <div className="text-xs text-gray-500">{new Date(po.createdAt || po.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{supplierName}</div>
                          {supplierPhone && <div className="text-xs text-gray-500">{supplierPhone}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {(po.lineItems || []).map((li, idx) => {
                              const retCount = (po.returnLogs || []).reduce((sum, rl) => {
                                const pidMatch = String(rl.productId) === String(li.productId || li.id);
                                return pidMatch ? sum + Number(rl.qty || 0) : sum;
                              }, 0);
                              const activeQty = Math.max(0, Number(li.qty || 1) - retCount);

                              return (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50"
                                >
                                  <span>{li.name || li.description}</span>
                                  <span className="font-bold text-indigo-900 dark:text-indigo-100">
                                    ×{activeQty} in-stock
                                  </span>
                                  {retCount > 0 && (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                      ({li.qty} bought, {retCount} ret.)
                                    </span>
                                  )}
                                  <span className="text-[10px] opacity-70">(@৳{Math.round(Number(li.unitCost || 0)).toLocaleString()})</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <div className="font-bold text-indigo-600 dark:text-indigo-400">৳{netCost.toLocaleString()} Net</div>
                          {ret > 0 && (
                            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                              was ৳{net.toLocaleString()} gross (-৳{ret.toLocaleString()} ret.)
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="uppercase font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                            {po.paymentMethod || 'CASH'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            {po.status || 'RECEIVED'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to="/purchases"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          >
                            Details <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tab 3: All Shop Outgoings Combined */}
      {activeTab === 'combined' && (
        <>
          <div className={`${cardCls} overflow-x-auto p-0`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left bg-gray-50/50 dark:bg-gray-900/50">
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Type</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Description / Details</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Category</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Amount</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Payment</th>
                </tr>
              </thead>
              <tbody>
                {combinedOutgoings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No outgoing records found
                    </td>
                  </tr>
                ) : (
                  combinedOutgoings.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    >
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(row.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {row.type === 'EXPENSE' ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                            OPERATING EXPENSE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            PRODUCT RESTOCK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{row.title}</div>
                        <div className="text-xs text-gray-500">{row.details}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-600 dark:text-gray-300">
                        {row.category}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        <span className={row.type === 'EXPENSE' ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'}>
                          ৳{row.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs uppercase font-semibold text-gray-500">
                        {row.method}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tab 4: Recurring Expenses */}
      {activeTab === 'recurring' && <RecurringExpenses />}

      {/* Record Expense Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className={`${cardCls} w-full max-w-md max-w-[calc(100vw-1.5rem)] my-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b dark:border-gray-800 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#2563EB]" /> Record Shop Expense
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                const fd = new FormData(ev.target);
                const finalCategory =
                  categoryChoice === 'CUSTOM' ? customCategoryInput.trim() : categoryChoice;

                if (!finalCategory) {
                  toast.error('Please specify a category');
                  return;
                }

                createExpenseMutation.mutate({
                  title: fd.get('title'),
                  category: finalCategory,
                  amount: Number(fd.get('amount')),
                  paymentMethod: fd.get('paymentMethod'),
                  voucherNumber: fd.get('voucherNumber'),
                  notes: fd.get('notes'),
                  receipts: addReceipts,
                });
              }}
              className="space-y-3.5 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Expense Title / Purpose *
                </label>
                <input
                  required
                  name="title"
                  placeholder="e.g. July Shop Rent / Tea & Snacks / AC Service"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Amount (৳) *
                  </label>
                  <NumberInput
                    required
                    min="1"
                    name="amount"
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={categoryChoice}
                    onChange={(e) => setCategoryChoice(e.target.value)}
                    className={inputCls}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Custom Category...</option>
                  </select>
                </div>
              </div>

              {/* Custom Category Input (shown when CUSTOM selected) */}
              {categoryChoice === 'CUSTOM' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Custom Category Name *
                  </label>
                  <input
                    required
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="e.g. Shop Cleaning / Generator Fuel"
                    className={inputCls}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Payment Method
                  </label>
                  <select name="paymentMethod" defaultValue="Cash" className={inputCls}>
                    <option value="Cash">Cash</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Voucher # (Optional)
                  </label>
                  <input name="voucherNumber" placeholder="e.g. VCH-00412" className={inputCls} />
                </div>
              </div>
              {/* Receipt Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Receipts / Proof
                </label>
                <div className="flex items-center gap-2">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm ${addUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">{addUploading ? 'Uploading...' : 'Attach receipt (image/PDF)'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        setAddUploading(true);
                        try {
                          const fd = new FormData();
                          files.forEach(f => fd.append('receipts', f));
                          const res = await api.post('/expenses/upload-receipts', fd, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                          });
                          const urls = res.data?.data?.urls || [];
                          setAddReceipts(prev => [...prev, ...urls]);
                          toast.success(`${urls.length} receipt(s) uploaded`);
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Upload failed');
                        } finally {
                          setAddUploading(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
                {addReceipts.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {addReceipts.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-500 hover:underline truncate">
                          <FileImage className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Receipt {idx + 1}</span>
                        </a>
                        <button type="button" onClick={() => setAddReceipts(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 ml-2">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Notes / Description
                </label>
                <input name="notes" placeholder="e.g. Paid to shop landlord" className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  className="flex-1 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all shadow-xs"
                >
                  {createExpenseMutation.isPending ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          categories={categories}
          onClose={() => setEditingExpense(null)}
          onUpdate={(data) => updateExpenseMutation.mutate({ id: editingExpense._id, data })}
          isPending={updateExpenseMutation.isPending}
          cardCls={cardCls}
          inputCls={inputCls}
        />
      )}
    </div>
  );
}

function EditExpenseModal({
  expense,
  categories,
  onClose,
  onUpdate,
  isPending,
  cardCls,
  inputCls,
}) {
  const [title, setTitle] = useState(expense.title || '');
  const [amount, setAmount] = useState(expense.amount || '');
  const [category, setCategory] = useState(expense.category || categories[0] || 'Shop Rent');
  const [paymentMethod, setPaymentMethod] = useState(expense.paymentMethod || 'Cash');
  const [voucherNumber, setVoucherNumber] = useState(expense.voucherNumber || '');
  const [notes, setNotes] = useState(expense.notes || '');
  const [receipts, setReceipts] = useState(expense.receipts || []);
  const [uploading, setUploading] = useState(false);

  const handleReceiptUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('receipts', f));
      const res = await api.post('/expenses/upload-receipts', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const urls = res.data?.data?.urls || [];
      setReceipts(prev => [...prev, ...urls]);
      toast.success(`${urls.length} receipt(s) uploaded`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeReceipt = (idx) => {
    setReceipts(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`${cardCls} w-full max-w-md max-w-[calc(100vw-1.5rem)] my-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 border-b dark:border-gray-800 pb-3">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Pencil className="w-5 h-5 text-blue-500" /> Edit Shop Expense
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            onUpdate({
              title,
              amount: Number(amount),
              category,
              paymentMethod,
              voucherNumber,
              notes,
              receipts,
            });
          }}
          className="space-y-3.5 text-sm"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Expense Title / Purpose *
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Amount (৳) *
              </label>
              <NumberInput
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={inputCls}
              >
                <option value="Cash">Cash</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Voucher # (Optional)
              </label>
              <input
                value={voucherNumber}
                onChange={(e) => setVoucherNumber(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Notes / Description
            </label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
          </div>
          {/* Receipt Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Receipts / Proof
            </label>
            <div className="flex items-center gap-2">
              <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">{uploading ? 'Uploading...' : 'Attach receipt'}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  className="hidden"
                  onChange={handleReceiptUpload}
                />
              </label>
            </div>
            {receipts.length > 0 && (
              <div className="mt-2 space-y-1">
                {receipts.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-500 hover:underline truncate">
                      <FileImage className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Receipt {idx + 1}</span>
                    </a>
                    <button type="button" onClick={() => removeReceipt(idx)} className="text-red-400 hover:text-red-600 ml-2">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              disabled={isPending}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm"
            >
              {isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
