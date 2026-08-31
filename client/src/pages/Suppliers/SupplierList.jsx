import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building,
  CheckCircle2,
  Contact,
  CreditCard,
  DollarSign,
  Edit,
  Eye,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';
import { useActivePaymentMethods } from '../../hooks';

const PAYMENT_TERMS = ['CASH', 'NET15', 'NET30', 'NET60'];

export default function SupplierList() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [viewSupplier, setViewSupplier] = useState(null);
  const [payDueSupplier, setPayDueSupplier] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: async () => {
      const res = await api.get('/suppliers', { params: { search, limit: 100 } });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      toast.success('Supplier deleted successfully');
      queryClient.invalidateQueries(['suppliers']);
      queryClient.invalidateQueries(['suppliers-list']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete supplier'),
  });

  const suppliers = data?.data || [];
  const totalDue = suppliers.reduce((sum, s) => sum + (s.dueBalance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Supplier & Vendor Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage vendor profiles, track purchase dues, and process supplier payments.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditSupplier(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Supplier
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Suppliers
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <Contact className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {isLoading ? (
              <div className="h-7 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            ) : (
              suppliers.length
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Registered vendor accounts
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Supplier Due Payable
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {isLoading ? (
              <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            ) : (
              `৳${totalDue.toLocaleString()}`
            )}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-1 font-medium">
            Outstanding vendor liabilities
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Trade Vendors
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {isLoading ? (
              <div className="h-7 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            ) : (
              suppliers.filter((s) => Number(s.totalPurchases || 0) > 0).length
            )}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1 font-medium">
            Vendors with active transactions
          </div>
        </div>
      </div>

      {/* Search toolbar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suppliers by name, phone, or company..."
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 shadow-xs"
        />
      </div>

      {/* Suppliers Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3.5">Supplier Name</th>
                <th className="px-4 py-3.5">Company / Vendor</th>
                <th className="px-4 py-3.5">Phone Contact</th>
                <th className="px-4 py-3.5">Payment Terms</th>
                <th className="px-4 py-3.5 text-right">Total Purchases</th>
                <th className="px-4 py-3.5 text-right">Due Balance</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <Contact className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      No suppliers found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Add a new supplier to track vendor balances.
                    </p>
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => {
                  const due = Number(s.dueBalance || 0);
                  return (
                    <tr
                      key={s._id || s.id}
                      className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                            {s.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {s.name}
                            </div>
                            {s.email && (
                              <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                {s.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {s.company || '—'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.paymentTerms === 'CASH'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {s.paymentTerms}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        ৳{Number(s.totalPurchases || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold">
                        <span
                          className={
                            due > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                          }
                        >
                          {due > 0 ? `৳${due.toLocaleString()}` : '৳0'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. View Supplier Details Button */}
                          <button
                            onClick={() => setViewSupplier(s)}
                            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            title="View Supplier Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* 2. Pay Supplier Due Button */}
                          {due > 0 && (
                            <button
                              onClick={() => setPayDueSupplier(s)}
                              className="p-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition-colors"
                              title="Pay Supplier Due Balance"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {/* 3. Edit Supplier Button */}
                          <button
                            onClick={() => {
                              setEditSupplier(s);
                              setShowForm(true);
                            }}
                            className="p-1.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 transition-colors"
                            title="Edit Supplier Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* 4. Delete Supplier Button */}
                          <button
                            onClick={() =>
                              confirmDelete(`Delete supplier "${s.name}"?`, () =>
                                deleteMutation.mutate(s._id || s.id)
                              )
                            }
                            className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
                            title="Delete Supplier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* ── MODAL 1: ADD / EDIT SUPPLIER FORM ── */}
      {showForm && (
        <SupplierForm
          supplier={editSupplier}
          onClose={() => {
            setShowForm(false);
            setEditSupplier(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditSupplier(null);
            queryClient.invalidateQueries(['suppliers']);
          }}
        />
      )}

      {/* ── MODAL 2: VIEW SUPPLIER DETAILS ── */}
      {viewSupplier && (
        <ViewSupplierModal
          supplier={viewSupplier}
          onClose={() => setViewSupplier(null)}
          onEdit={() => {
            const cur = viewSupplier;
            setViewSupplier(null);
            setEditSupplier(cur);
            setShowForm(true);
          }}
          onPayDue={() => {
            const cur = viewSupplier;
            setViewSupplier(null);
            setPayDueSupplier(cur);
          }}
        />
      )}

      {/* ── MODAL 3: PAY SUPPLIER DUE BALANCE ── */}
      {payDueSupplier && (
        <PaySupplierDueModal
          supplier={payDueSupplier}
          onClose={() => setPayDueSupplier(null)}
          onSuccess={() => {
            setPayDueSupplier(null);
            queryClient.invalidateQueries(['suppliers']);
            queryClient.invalidateQueries(['purchase-orders']);
            queryClient.invalidateQueries(['expenses']);
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 1. ADD / EDIT SUPPLIER MODAL (LARGE, PROMINENT BUTTONS)
// ----------------------------------------------------------------------
function SupplierForm({ supplier, onClose, onSuccess }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const [form, setForm] = useState({
    name: supplier?.name || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    company: supplier?.company || supplier?.name || '',
    address: supplier?.address || '',
    paymentTerms: supplier?.paymentTerms || 'CASH',
    notes: supplier?.notes || '',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        company: form.company?.trim() || form.name?.trim() || '',
      };
      if (supplier) return api.put(`/suppliers/${supplier._id || supplier.id}`, payload);
      return api.post('/suppliers', payload);
    },
    onSuccess: () => {
      toast.success(supplier ? 'Supplier updated successfully' : 'Supplier created successfully');
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Operation failed'),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-[#0f172a] overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {supplier ? 'Edit Supplier Profile' : 'Add New Supplier Account'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {supplier ? supplier.name : 'Enter vendor details to link stock restocks.'}
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Supplier Name *
              </Label>
              <Input
                required
                placeholder="e.g. Dhaka Mobile Imports"
                value={form.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name: newName,
                    company: !prev.company || prev.company === prev.name ? newName : prev.company,
                  }));
                }}
                className="h-10 text-xs rounded-xl bg-white dark:bg-[#1e293b]"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Phone Number *
              </Label>
              <Input
                required
                placeholder="01710000000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-10 text-xs font-mono rounded-xl bg-white dark:bg-[#1e293b]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Email Address
              </Label>
              <Input
                type="email"
                placeholder="vendor@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-10 text-xs rounded-xl bg-white dark:bg-[#1e293b]"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Company / Enterprise
              </Label>
              <Input
                placeholder="e.g. Samsung Bangladesh Ltd"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="h-10 text-xs rounded-xl bg-white dark:bg-[#1e293b]"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Office / Warehouse Address
            </Label>
            <Input
              placeholder="e.g. Motijheel C/A, Dhaka"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="h-10 text-xs rounded-xl bg-white dark:bg-[#1e293b]"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Default Credit Terms
            </Label>
            <select
              value={form.paymentTerms}
              onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
            >
              {PAYMENT_TERMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Supplier Notes
            </Label>
            <textarea
              rows={2}
              placeholder="e.g. Official distributor for Xiaomi gadgets..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full p-2.5 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          {/* Action Buttons: Spacious & Prominent */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 px-5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !form.name || !form.phone}
              className="h-11 px-6 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {supplier ? 'Save Changes' : 'Create Supplier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// 2. VIEW SUPPLIER DETAILS MODAL (LARGE, PROMINENT BUTTONS)
// ----------------------------------------------------------------------
function ViewSupplierModal({ supplier, onClose, onEdit, onPayDue }) {
  const due = Number(supplier.dueBalance || 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-[#0f172a] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
              {supplier.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate">
                {supplier.name}
              </h2>
              {supplier.company && (
                <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  🏢 {supplier.company}
                </div>
              )}
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
              supplier.paymentTerms === 'CASH'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
            }`}
          >
            {supplier.paymentTerms}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Financial Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Purchases
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">
                ৳{Number(supplier.totalPurchases || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Current Due Payable
              </div>
              <div
                className={`text-xl font-black font-mono mt-1 ${due > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}
              >
                ৳{due.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-3 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold text-slate-400 w-24">Phone:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {supplier.phone || 'N/A'}
              </span>
            </div>
            {supplier.email && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-400 w-24">Email:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {supplier.email}
                </span>
              </div>
            )}
            {supplier.address && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-400 w-24">Address:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {supplier.address}
                </span>
              </div>
            )}
            {supplier.notes && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Notes:
                </span>
                {supplier.notes}
              </div>
            )}
          </div>

          {/* 4 PROMINENT, LARGE ACTION BUTTONS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* Button 1: Pay Due Balance */}
            <Button
              disabled={due <= 0}
              onClick={onPayDue}
              className="h-11 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-white shadow-md flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              Pay Due
            </Button>

            {/* Button 2: Edit Supplier */}
            <Button
              onClick={onEdit}
              className="h-11 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center justify-center gap-1.5"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>

            {/* Button 3: Call Phone */}
            <a
              href={`tel:${supplier.phone}`}
              className="h-11 px-4 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-center"
            >
              <Phone className="w-4 h-4 text-blue-600" />
              Call Phone
            </a>

            {/* Button 4: Close Modal */}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// 3. PAY SUPPLIER DUE MODAL (LARGE, PROMINENT BUTTONS)
// ----------------------------------------------------------------------
function PaySupplierDueModal({ supplier, onClose, onSuccess }) {
  const due = Number(supplier.dueBalance || 0);
  const [amount, setAmount] = useState(due);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const activeMethods = useActivePaymentMethods();

  const mutation = useMutation({
    mutationFn: async (payload) =>
      api.post(`/suppliers/${supplier._id || supplier.id}/pay-due`, payload),
    onSuccess: () => {
      toast.success(
        `Supplier due payment of ৳${Number(amount).toLocaleString()} recorded successfully!`
      );
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Number(amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    mutation.mutate({
      amount: Number(amount),
      paymentMethod,
      notes,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-[#0f172a] overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Pay Supplier Due Balance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {supplier.name} {supplier.company ? `(${supplier.company})` : ''}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Summary Box */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span>Total Recorded Purchases:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                ৳{Number(supplier.totalPurchases || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs pt-1.5 border-t border-slate-200 dark:border-slate-700/80">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Current Total Due Payable:
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-base">
                ৳{due.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick Amount Select Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Payment Amount (৳) *
              </Label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAmount(due)}
                  className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Pay Full (৳{due.toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(Math.round(due / 2))}
                  className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  50%
                </button>
              </div>
            </div>
            <Input
              type="number"
              min="1"
              max={due > 0 ? due : undefined}
              required
              placeholder="Enter amount to pay"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11 text-base font-mono font-bold rounded-xl bg-white dark:bg-[#1e293b]"
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Payment Method *
            </Label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
            >
              <option value="CASH" disabled={!activeMethods.hasCash}>
                Cash Payment {!activeMethods.hasCash && ' (Disabled)'}
              </option>
              <option value="BANK" disabled={!activeMethods.hasBank}>
                Bank Transfer / Card {!activeMethods.hasBank && ' (Disabled)'}
              </option>
              <option value="BKASH" disabled={!activeMethods.hasBkash}>
                bKash Merchant {!activeMethods.hasBkash && ' (Disabled)'}
              </option>
              <option value="NAGAD" disabled={!activeMethods.hasNagad}>
                Nagad {!activeMethods.hasNagad && ' (Disabled)'}
              </option>
              <option value="ROCKET" disabled={!activeMethods.hasRocket}>
                Rocket {!activeMethods.hasRocket && ' (Disabled)'}
              </option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Payment Notes (Optional)
            </Label>
            <Input
              placeholder="e.g. Cleared via Bank Transfer Ref #9921"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 text-xs rounded-xl bg-white dark:bg-[#1e293b]"
            />
          </div>

          {/* LARGE, PROMINENT BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 px-5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || Number(amount) <= 0}
              className="h-11 px-6 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Confirm Due Payment (৳{Number(amount || 0).toLocaleString()})
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
