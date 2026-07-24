import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Receipt, Plus, Search, Trash2, X, DollarSign, Calendar, Filter, PieChart, Building2, Tag } from 'lucide-react';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';
import { useTheme } from '../../context/ThemeContext';
import DatePicker from '../../components/ui/DatePicker';

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

export default function Expenses() {
  const { styled } = useTheme();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryChoice, setCategoryChoice] = useState('Shop Rent');
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const { data: fetchedCategories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await api.get('/expenses/categories');
      return res.data?.data || DEFAULT_CATEGORIES;
    },
  });

  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...fetchedCategories])).filter(Boolean);

  const { data: expenseData, isLoading } = useQuery({
    queryKey: ['expenses', selectedCategory, dateFrom, dateTo, search],
    queryFn: async () => {
      const res = await api.get('/expenses', {
        params: { category: selectedCategory, from: dateFrom, to: dateTo, search },
      });
      return res.data?.data;
    },
  });

  const expenses = expenseData?.expenses || [];
  const summary = expenseData?.summary || {};

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

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      toast.success('Expense entry deleted');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['expense-categories'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete expense'),
  });

  const cardCls = styled ? 'neu-card p-5' : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-5';
  const inputCls = styled ? 'neu-input w-full px-3 py-2 rounded-xl text-sm' : 'w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-red-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-red-600" /> Shop Costing & Expenses
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track shop operating costs, rent, utilities, food, custom categories & maintenance expenses</p>
        </div>
        <button
          onClick={() => {
            setCategoryChoice(categories[0] || 'Shop Rent');
            setCustomCategoryInput('');
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-medium rounded-lg text-sm transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" /> Record New Expense
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Expenses</div>
          <div className="text-2xl font-bold text-red-600 mt-1">৳{(summary.totalExpense || 0).toLocaleString()}</div>
        </div>
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Expense Entries</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{summary.count || 0} Records</div>
        </div>
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Top Cost Category</div>
          <div className="text-lg font-bold text-amber-600 mt-1 truncate">
            {Object.entries(summary.categoryBreakdown || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
          </div>
        </div>
        <div className={cardCls}>
          <div className="text-xs text-gray-500 uppercase font-semibold">Rent & Utilities</div>
          <div className="text-xl font-bold text-blue-600 mt-1">
            ৳{((summary.categoryBreakdown?.['Shop Rent'] || 0) + (summary.categoryBreakdown?.['Electricity & Utility'] || 0)).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
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
            <option key={cat} value={cat}>{cat}</option>
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
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 animate-pulse">Loading shop expenses...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No expense records found</td></tr>
            ) : (
              expenses.map((e) => (
                <tr key={e._id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(e.date || e.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{e.title}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-red-600 dark:text-red-400">৳{e.amount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs uppercase font-semibold text-gray-500">{e.paymentMethod}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{e.voucherNumber ? `Voucher: ${e.voucherNumber}` : e.notes || 'N/A'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => confirmDelete(`Delete expense "${e.title}"?`, () => deleteExpenseMutation.mutate(e._id))}
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

      {/* Record Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className={`${cardCls} w-full max-w-md p-6 shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b dark:border-gray-800 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-red-600" /> Record Shop Expense
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(ev) => {
              ev.preventDefault();
              const fd = new FormData(ev.target);
              const finalCategory = categoryChoice === 'CUSTOM' ? customCategoryInput.trim() : categoryChoice;
              
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
              });
            }} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Expense Title / Purpose *</label>
                <input required name="title" placeholder="e.g. July Shop Rent / Tea & Snacks / AC Service" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category *</label>
                  <select 
                    value={categoryChoice} 
                    onChange={(e) => setCategoryChoice(e.target.value)}
                    className={inputCls}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="CUSTOM">+ Add Custom Category...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Amount (৳) *</label>
                  <input type="number" required min="1" name="amount" placeholder="e.g. 15000" className={inputCls} />
                </div>
              </div>

              {/* Custom Category Input (shown when CUSTOM selected) */}
              {categoryChoice === 'CUSTOM' && (
                <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl space-y-1">
                  <label className="block text-xs font-semibold text-red-600 dark:text-red-400 uppercase">New Custom Category Name *</label>
                  <input
                    required
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="e.g. AC Repairing / Trade License / Generator"
                    className={inputCls}
                  />
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">This custom category will be saved and available for future expense entries.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Payment Method</label>
                  <select name="paymentMethod" className={inputCls}>
                    <option value="cash">Cash</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="rocket">Rocket</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Voucher # (Optional)</label>
                  <input name="voucherNumber" placeholder="e.g. VCH-00412" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notes / Description</label>
                <input name="notes" placeholder="e.g. Paid to shop landlord" className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={createExpenseMutation.isPending} className="flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-lg text-sm">
                  {createExpenseMutation.isPending ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
