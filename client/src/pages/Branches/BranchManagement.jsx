import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CheckCircle2,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';
import { useBranchStore } from '../../store/branchStore';

const emptyForm = { name: '', address: '', phone: '', email: '', manager: '', isActive: true };

export default function BranchManagement() {
  const { styled } = useTheme();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const r = await api.get('/branches');
      return r.data?.data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (editing) return api.put(`/branches/${editing._id}`, data);
      return api.post('/branches', data);
    },
    onSuccess: () => {
      toast.success(editing ? 'Branch updated' : 'Branch created');
      qc.invalidateQueries({ queryKey: ['branches'] });
      setShowModal(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/branches/${id}`),
    onSuccess: () => {
      toast.success('Branch deleted');
      qc.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const filtered = branches.filter(
    (b) =>
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.address?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };
  const openEdit = (b) => {
    setEditing(b);
    setForm({
      name: b.name,
      address: b.address || '',
      phone: b.phone || '',
      email: b.email || '',
      manager: b.manager?._id || '',
      isActive: b.isActive,
    });
    setShowModal(true);
  };

  const cardCls = styled
    ? 'neu-card'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800';
  const inputCls = styled
    ? 'neu-input w-full px-3 py-2.5 rounded-xl text-sm'
    : 'w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none';

  const { activeBranchId, setActiveBranchId, tenantPlan, maxBranches } = useBranchStore();

  const isLimitReached = maxBranches !== 999 && branches.length >= maxBranches;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Branch & Outlet Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage multi-branch shop locations and active outlet contexts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Plan Limit: {branches.length} / {maxBranches === 999 ? '∞' : maxBranches} ({tenantPlan})</span>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Branch
          </button>
        </div>
      </div>

      {isLimitReached && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center font-bold text-amber-600 dark:text-amber-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Outlet Limit Reached ({branches.length}/{maxBranches} Branches Used)
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Your current <span className="font-bold text-amber-600 dark:text-amber-400">{tenantPlan}</span> subscription plan permits up to {maxBranches} outlet{maxBranches === 1 ? '' : 's'}. Upgrade to Pro or Enterprise for additional outlets.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`${cardCls} p-4`}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search branches..."
            className={`${inputCls} pl-10`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${cardCls} p-5 animate-pulse`}>
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className={`${cardCls} col-span-full p-12 text-center`}>
            <Building2 className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No branches found</p>
          </div>
        ) : (
          filtered.map((branch) => {
            const bId = String(branch._id || branch.id);
            const isActiveContext = activeBranchId === bId;

            return (
              <div key={branch._id} className={`${cardCls} p-5 hover:shadow-lg transition-all relative overflow-hidden flex flex-col justify-between`}>
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">{branch.name}</h3>
                        {isActiveContext && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white flex items-center gap-1 shadow-xs">
                            <CheckCircle2 className="w-3 h-3" /> Active Outlet
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${branch.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}
                      >
                        {branch.isActive ? 'Status: Active' : 'Status: Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(branch)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                        title="Edit Branch"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          confirmDelete(`Delete branch "${branch.name}"?`, () =>
                            deleteMutation.mutate(branch._id)
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500"
                        title="Delete Branch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 my-3">
                    {branch.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {branch.address}
                      </div>
                    )}
                    {branch.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {branch.phone}
                      </div>
                    )}
                    {branch.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {branch.email}
                      </div>
                    )}
                    {branch.manager && (
                      <div className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200 pt-1">
                        <User className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Manager:{' '}
                        {branch.manager.fullName || branch.manager.username}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80">
                  <button
                    onClick={() => setActiveBranchId(bId, branch.name)}
                    disabled={isActiveContext}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isActiveContext
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 cursor-default border border-blue-200 dark:border-blue-800/60'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-blue-600 hover:text-white text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {isActiveContext ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Currently Selected Active Outlet
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3.5 h-3.5" /> Switch Active Context to this Outlet
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className={`${cardCls} w-full max-w-md p-6`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {editing ? 'Edit Branch' : 'New Branch'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Branch Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Dhanmondi Branch"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Address
                </label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={inputCls}
                  placeholder="Full address"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Phone
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputCls}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Email
                  </label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputCls}
                    placeholder="branch@email.com"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-[#2563EB]"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl ${styled ? 'neu-btn' : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!form.name.trim()) return toast.error('Name is required');
                  mutation.mutate(form);
                }}
                disabled={mutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-[#2563EB] text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {mutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
