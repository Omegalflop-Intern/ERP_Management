import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  DollarSign,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { NumberInput } from '../../components/ui/NumberInput';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';

const FREQUENCIES = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
const CATEGORIES = [
  'Shop Rent',
  'Electricity & Utility',
  'Internet & Phone',
  'Insurance',
  'Software Subscriptions',
  'Maintenance',
  'Other',
];

export default function RecurringExpenses() {
  const { styled } = useTheme();
  const qc = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const cardCls = styled
    ? 'neu-card p-5'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-5';

  const inputCls = styled
    ? 'neu-input w-full px-3 py-2 text-sm'
    : 'w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-[#2563EB]';

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: async () => {
      const res = await api.get('/recurring-expenses');
      return res.data?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => api.post('/recurring-expenses', data),
    onSuccess: () => {
      toast.success('Recurring expense created');
      setShowAddModal(false);
      qc.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => api.put(`/recurring-expenses/${id}`, data),
    onSuccess: () => {
      toast.success('Updated');
      setEditingItem(null);
      qc.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/recurring-expenses/${id}`),
    onSuccess: () => {
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }) => api.put(`/recurring-expenses/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
  });

  const processMutation = useMutation({
    mutationFn: async () => api.post('/recurring-expenses/process'),
    onSuccess: (res) => {
      const result = res.data?.data;
      toast.success(`Processed ${result?.processed || 0} recurring expense(s)`);
      qc.invalidateQueries({ queryKey: ['recurring-expenses'] });
      qc.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to process'),
  });

  const getFrequencyLabel = (f) => {
    const labels = {
      WEEKLY: 'Every Week',
      MONTHLY: 'Every Month',
      QUARTERLY: 'Every 3 Months',
      YEARLY: 'Every Year',
    };
    return labels[f] || f;
  };

  const isOverdue = (nextDue) => {
    return new Date(nextDue) < new Date();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" /> Recurring Expenses
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Auto-create monthly rent, internet, utility bills
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => processMutation.mutate()}
            disabled={processMutation.isPending}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              styled
                ? 'neu-btn'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${processMutation.isPending ? 'animate-spin' : ''}`}
            />
            Process Due
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" /> Add Recurring
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={cardCls}>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className={cardCls}>
          <p className="text-center text-gray-400 py-8">
            No recurring expenses set up yet. Add your first recurring expense to auto-create
            monthly entries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => (
            <div
              key={item._id}
              className={`${cardCls} ${isOverdue(item.nextDueDate) ? 'border-l-4 border-red-500' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {item.title}
                    </h4>
                    {!item.isActive && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-200 dark:bg-gray-700 text-gray-500 rounded">
                        PAUSED
                      </span>
                    )}
                    {isOverdue(item.nextDueDate) && item.isActive && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 rounded">
                        OVERDUE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> ৳{item.amount?.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {getFrequencyLabel(item.frequency)}
                    </span>
                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1.5">
                    Next due: {new Date(item.nextDueDate).toLocaleDateString()} via{' '}
                    {item.paymentMethod}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() =>
                      toggleMutation.mutate({ id: item._id, isActive: !item.isActive })
                    }
                    className={`p-1.5 rounded-lg transition-colors ${
                      item.isActive
                        ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    }`}
                    title={item.isActive ? 'Pause' : 'Resume'}
                  >
                    {item.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      confirmDelete(`Delete "${item.title}"?`, () =>
                        deleteMutation.mutate(item._id)
                      )
                    }
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <RecurringExpenseModal
          onClose={() => setShowAddModal(false)}
          onSave={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
          cardCls={cardCls}
          inputCls={inputCls}
        />
      )}
      {editingItem && (
        <RecurringExpenseModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(data) => updateMutation.mutate({ id: editingItem._id, data })}
          isPending={updateMutation.isPending}
          cardCls={cardCls}
          inputCls={inputCls}
        />
      )}
    </div>
  );
}

function RecurringExpenseModal({ item, onClose, onSave, isPending, cardCls, inputCls }) {
  const [title, setTitle] = useState(item?.title || '');
  const [amount, setAmount] = useState(item?.amount || '');
  const [category, setCategory] = useState(item?.category || 'Shop Rent');
  const [paymentMethod, setPaymentMethod] = useState(item?.paymentMethod || 'Cash');
  const [frequency, setFrequency] = useState(item?.frequency || 'MONTHLY');
  const [startDate, setStartDate] = useState(
    item?.startDate
      ? new Date(item.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    item?.endDate ? new Date(item.endDate).toISOString().split('T')[0] : ''
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`${cardCls} w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 border-b dark:border-gray-800 pb-3">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" /> {item ? 'Edit' : 'New'} Recurring Expense
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              title,
              amount: Number(amount),
              category,
              paymentMethod,
              frequency,
              startDate,
              endDate: endDate || null,
            });
          }}
          className="space-y-3.5 text-sm"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Title *
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly Shop Rent"
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
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
              >
                {CATEGORIES.map((c) => (
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
                Frequency *
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className={inputCls}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0) + f.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
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
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputCls}
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
              disabled={isPending}
              className="flex-1 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold rounded-lg text-sm"
            >
              {isPending ? 'Saving...' : item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
