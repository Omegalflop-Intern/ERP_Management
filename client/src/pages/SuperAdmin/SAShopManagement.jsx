import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  PauseCircle,
  PlayCircle,
  FileText,
  Loader2,
  Mail,
  Phone,
  User,
  Key,
  CheckCircle2,
  Calendar,
  CreditCard,
  Users,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { format } from 'date-fns';
import { confirmDelete } from '../../lib/confirm';
import PasswordInput from '../../components/ui/PasswordInput';
import { DocumentVaultModal } from '../SaaS/DocumentVaultModal';

const PLAN_COLORS = {
  FREE: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  STARTER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  PRO: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  ENTERPRISE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
};

const STATUS_COLORS = {
  ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  PAUSED: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
  PENDING_KYC: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
};

function EditTenantModal({ tenant, onClose, onSuccess }) {
  const [form, setForm] = useState({
    shopName: tenant.shopName || '',
    ownerName: tenant.ownerName || '',
    phone: tenant.phone || '',
    plan: tenant.plan || 'STARTER',
    maxBranches: tenant.maxBranches ?? 2,
    maxUsers: tenant.maxUsers ?? 5,
    expiresAt: tenant.expiresAt ? new Date(tenant.expiresAt).toISOString().slice(0, 10) : '',
    notes: tenant.notes || '',
  });
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        ...form,
        maxBranches: Number(form.maxBranches),
        maxUsers: Number(form.maxUsers),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };
      const res = await api.put(`/tenants/${tenant._id}`, body);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Shop updated successfully');
      qc.invalidateQueries({ queryKey: ['sa-shops'] });
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Pencil className="w-4 h-4 text-indigo-500" /> Edit Shop — {tenant.shopName}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Basic Info */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Shop Name</label>
            <input
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Owner Name</label>
              <input
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Subscription */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Subscription Settings
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Plan</label>
                <select
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {['FREE', 'STARTER', 'PRO', 'ENTERPRISE'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Max Branches</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={form.maxBranches}
                  onChange={(e) => setForm({ ...form, maxBranches: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Max Users</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={form.maxUsers}
                  onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Internal Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Notes for internal reference..."
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SAShopManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingTenant, setEditingTenant] = useState(null);
  const [kycTenant, setKycTenant] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    shopName: '', ownerName: '', username: '', email: '', phone: '',
    plan: 'STARTER', password: '',
  });

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['sa-shops', search],
    queryFn: async () => {
      const res = await api.get('/tenants', { params: { search } });
      return res.data?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/tenants', createForm);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Shop created successfully');
      qc.invalidateQueries({ queryKey: ['sa-shops'] });
      qc.invalidateQueries({ queryKey: ['sa-stats'] });
      setShowCreate(false);
      setCreateForm({ shopName: '', ownerName: '', username: '', email: '', phone: '', plan: 'STARTER', password: '' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Create failed'),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => api.patch(`/tenants/${id}/status`, { status }),
    onSuccess: (_, vars) => {
      toast.success(`Status updated to ${vars.status}`);
      qc.invalidateQueries({ queryKey: ['sa-shops'] });
      qc.invalidateQueries({ queryKey: ['sa-stats'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.patch(`/tenants/${id}/status`, { status: 'DELETED' }),
    onSuccess: () => {
      toast.success('Shop deleted');
      qc.invalidateQueries({ queryKey: ['sa-shops'] });
      qc.invalidateQueries({ queryKey: ['sa-stats'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Delete failed'),
  });

  const handleDelete = async (t) => {
    const confirmed = await confirmDelete(`Delete "${t.shopName}"? This will permanently remove all associated data.`);
    if (confirmed) deleteMutation.mutate(t._id);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-500" /> Shop Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, edit, manage subscriptions and delete shops
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" /> Create New Shop
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by shop name, owner, email..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Building2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <p className="font-semibold text-slate-600 dark:text-slate-400">No shops found</p>
          <p className="text-xs text-slate-400 mt-1">Create your first shop using the button above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tenants.map((t) => (
            <div
              key={t._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">{t.shopName}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${STATUS_COLORS[t.status] || ''}`}>
                      {t.status}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${PLAN_COLORS[t.plan] || ''}`}>
                      {t.plan}
                    </span>
                  </div>
                </div>
              </div>

              {/* Owner info */}
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="font-medium">{t.ownerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{t.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{t.phone}</span>
                </div>
              </div>

              {/* Subscription info */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-500">Max Users:</span>
                  <strong className="text-slate-800 dark:text-white">{t.maxUsers || '—'}</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-500">Branches:</span>
                  <strong className="text-slate-800 dark:text-white">{t.maxBranches || '—'}</strong>
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-500">Expires:</span>
                  <strong className={t.expiresAt ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}>
                    {t.expiresAt ? format(new Date(t.expiresAt), 'MMM d, yyyy') : 'No expiry set'}
                  </strong>
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <span className="text-slate-500">KYC:</span>
                  <strong className={t.kycDocuments?.kycStatus === 'APPROVED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                    {t.kycDocuments?.kycStatus || 'PENDING'}
                  </strong>
                </div>
              </div>

              {/* Stats */}
              {t.stats && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2">
                    <div className="text-[10px] text-blue-500 font-semibold uppercase">Sales</div>
                    <div className="font-bold text-slate-800 dark:text-white">{t.stats.totalSales} orders</div>
                  </div>
                  <div className="bg-violet-50 dark:bg-violet-950/20 rounded-lg p-2">
                    <div className="text-[10px] text-violet-500 font-semibold uppercase">Revenue</div>
                    <div className="font-bold text-slate-800 dark:text-white">৳{(t.stats.totalRevenue || 0).toLocaleString()}</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setEditingTenant(t)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-lg transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => setKycTenant(t)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 rounded-lg transition-colors"
                >
                  <FileText className="w-3 h-3" /> KYC
                </button>
                {t.status === 'ACTIVE' ? (
                  <button
                    onClick={() => statusMutation.mutate({ id: t._id, status: 'PAUSED' })}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-lg transition-colors"
                  >
                    <PauseCircle className="w-3 h-3" /> Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => statusMutation.mutate({ id: t._id, status: 'ACTIVE' })}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors"
                  >
                    <PlayCircle className="w-3 h-3" /> Activate
                  </button>
                )}
                <button
                  onClick={() => handleDelete(t)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors ml-auto"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingTenant && (
        <EditTenantModal
          tenant={editingTenant}
          onClose={() => setEditingTenant(null)}
          onSuccess={() => setEditingTenant(null)}
        />
      )}

      {/* KYC Modal */}
      {kycTenant && (
        <DocumentVaultModal tenant={kycTenant} onClose={() => setKycTenant(null)} />
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-500" /> Create New Shop
              </h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { field: 'shopName', label: 'Shop Name', placeholder: 'e.g. Dhaka Mobile Store' },
                { field: 'ownerName', label: 'Owner Name', placeholder: 'e.g. Rahim Uddin' },
                { field: 'username', label: 'Username', placeholder: 'e.g. rahim_store' },
                { field: 'email', label: 'Email', placeholder: 'owner@email.com', type: 'email' },
                { field: 'phone', label: 'Phone', placeholder: '+880...' },
              ].map(({ field, label, placeholder, type = 'text' }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
                  <input
                    type={type}
                    value={createForm[field]}
                    onChange={(e) => setCreateForm({ ...createForm, [field]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Plan</label>
                <select
                  value={createForm.plan}
                  onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {['FREE', 'STARTER', 'PRO', 'ENTERPRISE'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Owner Password</label>
                <PasswordInput
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !createForm.shopName || !createForm.email || !createForm.password}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Shop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
