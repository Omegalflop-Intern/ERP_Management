import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Check,
  DollarSign,
  Edit,
  Eye,
  Gift,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Tag,
  Trash2,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';
import { NumberInput } from '../../components/ui/NumberInput';

import PageHeader from '../../components/layout/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

export default function CustomerList() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editCust, setEditCust] = useState(null);
  const [couponCust, setCouponCust] = useState(null);
  const navigate = useNavigate();
  const { styled } = useTheme();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { search, limit: 100 } });
      return res.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => {
      const res = await api.get('/customers/stats');
      return res.data?.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      toast.success('Customer deleted');
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['customer-stats']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete'),
  });

  const allCustomers = data?.data || [];
  const customers = allCustomers.filter((c) => {
    if (typeFilter === 'INDIVIDUAL') return c.customerType === 'INDIVIDUAL' || !c.customerType;
    if (typeFilter === 'B2B') return c.customerType === 'B2B';
    return true;
  });

  const stats = statsData || { total: 0, withDue: 0, totalDue: 0, totalPurchases: 0 };
  const cardClass = styled
    ? 'neu-card p-4'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Management"
        subtitle="Manage retail buyers, wholesale clients, contact numbers, loyalty points, and outstanding due balances."
        icon={Users}
        breadcrumbs={['Customers & Dues', 'Customer Directory']}
        actions={
          <button
            onClick={() => {
              setEditCust(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Customers',
            value: stats.total,
            icon: Users,
            color: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'With Due',
            value: stats.withDue,
            icon: DollarSign,
            color: 'text-red-600 dark:text-red-400',
          },
          {
            label: 'Total Due',
            value: `৳${stats.totalDue.toLocaleString()}`,
            icon: DollarSign,
            color: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Total Purchases',
            value: `৳${stats.totalPurchases.toLocaleString()}`,
            icon: ShoppingBag,
            color: 'text-green-600 dark:text-green-400',
          },
        ].map((s) => (
          <div key={s.label} className={cardClass}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {s.label}
              </span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isLoading ? (
                <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                s.value
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or company..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-full sm:w-auto">
            {[
              { id: 'ALL', label: 'All Customers' },
              { id: 'INDIVIDUAL', label: 'Individual' },
              { id: 'B2B', label: 'B2B Wholesale' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  typeFilter === t.id
                    ? 'bg-white dark:bg-gray-900 text-red-700 dark:text-red-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Customer
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Type</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">
                  Phone
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                  Email
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Purchases
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Due</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c._id}
                    className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {c.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {c.name}
                          </div>
                          {c.companyName && (
                            <div className="text-xs text-gray-500">{c.companyName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.customerType === 'B2B' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                          <Building2 className="w-3 h-3" /> B2B Dealer
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          Individual
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                      {c.phone}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                      {c.email || '-'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                      ৳{c.totalPurchases?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {c.dueBalance > 0 ? (
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          ৳{c.dueBalance.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-green-600 dark:text-green-400">Clear</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setCouponCust(c)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 text-amber-500 hover:text-amber-600 transition-colors"
                          title="Issue Targeted Coupon"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/customers/${c._id}`)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditCust(c);
                            setShowForm(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            confirmDelete(`Delete customer "${c.name}"?`, () =>
                              deleteMutation.mutate(c._id)
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
      </div>

      {showForm && (
        <CustomerModal
          editCust={editCust}
          onClose={() => {
            setShowForm(false);
            setEditCust(null);
          }}
        />
      )}
      {couponCust && (
        <CustomerCouponModal customer={couponCust} onClose={() => setCouponCust(null)} />
      )}
    </div>
  );
}

function CustomerModal({ editCust, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: editCust?.name || '',
    phone: editCust?.phone || '',
    email: editCust?.email || '',
    address: editCust?.address || '',
    customerType: editCust?.customerType || 'INDIVIDUAL',
    companyName: editCust?.companyName || '',
    binOrTaxId: editCust?.binOrTaxId || '',
    notes: editCust?.notes || '',
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (editCust) return api.put(`/customers/${editCust._id}`, data);
      return api.post('/customers', data);
    },
    onSuccess: () => {
      toast.success(editCust ? 'Customer updated' : 'Customer created');
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['customer-stats']);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Operation failed'),
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {editCust ? 'Edit Customer' : 'Add Customer'}
          </h2>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Customer Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, customerType: 'INDIVIDUAL' })}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  form.customerType === 'INDIVIDUAL'
                    ? 'border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                Individual Retail
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, customerType: 'B2B' })}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  form.customerType === 'B2B'
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> B2B Wholesale Dealer
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Full Name / Contact Person *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {form.customerType === 'B2B' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Company / Shop Name
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="e.g. M/S Rahat Telecom"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Trade License / BIN / Tax ID
                </label>
                <input
                  type="text"
                  value={form.binOrTaxId}
                  onChange={(e) => setForm({ ...form, binOrTaxId: e.target.value })}
                  placeholder="e.g. BIN-0098483-2"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Phone *
            </label>
            <input
              type="text"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Address
            </label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2"
            >
              {mutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
              {editCust ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomerCouponModal({ customer, onClose }) {
  const defaultCode = `VIP-${
    customer.name
      ?.toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 5) || 'CUST'
  }-500`;
  const [couponCode, setCouponCode] = useState(defaultCode);
  const [discountAmount, setDiscountAmount] = useState('500');
  const [issued, setIssued] = useState(false);

  const handleIssue = (e) => {
    e.preventDefault();
    setIssued(true);
    toast.success(`Targeted Coupon "${couponCode}" issued for ${customer.name}!`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-500" /> Targeted Coupon for {customer.name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            ✕
          </button>
        </div>

        {issued ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto font-bold text-xl">
              ✓
            </div>
            <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
              Coupon Successfully Issued!
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Customer{' '}
              <span className="font-bold text-gray-800 dark:text-gray-200">{customer.name}</span> (
              {customer.phone}) can now use code{' '}
              <code className="bg-amber-500/10 text-amber-600 font-bold font-mono px-2 py-0.5 rounded">
                {couponCode}
              </code>{' '}
              at POS checkout for ৳{discountAmount} discount!
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-medium"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleIssue} className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Target Customer:
              </label>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100 flex justify-between">
                <span>{customer.name}</span>
                <span className="font-mono text-xs text-gray-500">{customer.phone}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Generated Coupon Code:
              </label>
              <input
                type="text"
                required
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm font-bold text-amber-600 dark:text-amber-400 outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Discount Amount (৳):
              </label>
              <NumberInput
                required
                min="1"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl text-sm"
              >
                Issue Coupon
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
