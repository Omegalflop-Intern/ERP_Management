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
  Globe,
  X,
  Save,
  AlertTriangle,
  Clock,
  Copy,
  Check,
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

const DURATION_OPTIONS = [
  { label: '1 Hour', value: '1h' },
  { label: '2 Hours', value: '2h' },
  { label: '5 Hours', value: '5h' },
  { label: '24 Hours', value: '24h' },
];

function TempAdminModal({ tenant, onClose }) {
  const qc = useQueryClient();
  const [duration, setDuration] = useState('2h');
  const [reason, setReason] = useState('');
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/tenants/${tenant._id}/temp-admin`, { duration, reason });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setCredentials(data);
      toast.success('Temp admin created');
      qc.invalidateQueries({ queryKey: ['sa-shops'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create'),
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" /> Create Temporary Admin
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!credentials ? (
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-sm">
              <span className="text-slate-500">Shop:</span>{' '}
              <strong className="text-slate-900 dark:text-white">{tenant.shopName}</strong>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDuration(opt.value)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                      duration === opt.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Reason (optional)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Troubleshooting login issue"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Temp Admin Created!</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Username:</span>
                <code className="font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded">{credentials.username}</code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Password:</span>
                <div className="flex items-center gap-1">
                  <code className="font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded">{credentials.password}</code>
                  <button onClick={() => copyToClipboard(credentials.password)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expires:</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">{new Date(credentials.expiresAt).toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center">Share these credentials with the shop owner for support access.</p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            {credentials ? 'Close' : 'Cancel'}
          </button>
          {!credentials && (
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              Create Access
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EditTenantModal({ tenant, onClose, onSuccess }) {
  const PLAN_DEFAULTS = { FREE: 30, STARTER: 30, PRO: 90, ENTERPRISE: 365 };
  const [form, setForm] = useState({
    shopName: tenant.shopName || '',
    ownerName: tenant.ownerName || '',
    phone: tenant.phone || '',
    plan: tenant.plan || 'STARTER',
    maxBranches: tenant.maxBranches ?? 2,
    maxUsers: tenant.maxUsers ?? 5,
    subdomain: tenant.subdomain || '',
    customDomain: tenant.customDomain || '',
    durationDays: tenant.expiresAt
      ? Math.max(1, Math.ceil((new Date(tenant.expiresAt) - new Date()) / 86400000))
      : (PLAN_DEFAULTS[tenant.plan || 'STARTER'] || 30),
    expiresAt: tenant.expiresAt ? new Date(tenant.expiresAt).toISOString().slice(0, 10) : '',
    notes: tenant.notes || '',
  });
  const qc = useQueryClient();

  const calcExpiry = (days) => {
    if (!days || days <= 0) return '';
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const handlePlanChange = (newPlan) => {
    const days = PLAN_DEFAULTS[newPlan] || 30;
    setForm((f) => ({ ...f, plan: newPlan, durationDays: days, expiresAt: calcExpiry(days) }));
  };

  const handleDurationChange = (days) => {
    setForm((f) => ({ ...f, durationDays: days, expiresAt: calcExpiry(days) }));
  };

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
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {['FREE', 'STARTER', 'PRO', 'ENTERPRISE'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Duration</label>
                <div className="flex items-center gap-2">
                  <select
                    value={[30, 60, 90, 180, 300, 365].includes(form.durationDays) ? form.durationDays : 'custom'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== 'custom') {
                        handleDurationChange(Number(val));
                      }
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={30}>30 Days (1 Mo)</option>
                    <option value={60}>60 Days (2 Mos)</option>
                    <option value={90}>90 Days (3 Mos)</option>
                    <option value={180}>180 Days (6 Mos)</option>
                    <option value={300}>300 Days (10 Mos)</option>
                    <option value={365}>365 Days (1 Yr)</option>
                    <option value="custom">Custom Days</option>
                  </select>
                  {![30, 60, 90, 180, 300, 365].includes(form.durationDays) && (
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      value={form.durationDays}
                      onChange={(e) => handleDurationChange(Number(e.target.value))}
                      placeholder="Days"
                      className="w-20 px-2 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>
              </div>
              <div className="col-span-2">
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

          {/* Domain */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-500" /> Domain Settings
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Subdomain</label>
                <div className="flex items-center gap-0">
                  <input
                    value={form.subdomain}
                    onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="shop-name"
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-l-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="px-2 py-2 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 border border-l-0 border-slate-200 dark:border-slate-700 rounded-r-xl whitespace-nowrap">.erp.com</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Custom Domain</label>
                <input
                  value={form.customDomain}
                  onChange={(e) => setForm({ ...form, customDomain: e.target.value.toLowerCase() })}
                  placeholder="optional — e.g. mystore.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            {form.subdomain && (
              <p className="text-[11px] text-slate-400 mt-1.5">
                Preview: <span className="font-mono text-indigo-500">{form.subdomain}.erp.com</span>
              </p>
            )}
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
  const [tempAdminTenant, setTempAdminTenant] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const PLAN_DEFAULTS = { FREE: 30, STARTER: 30, PRO: 90, ENTERPRISE: 365 };
  const [createForm, setCreateForm] = useState({
    shopName: '', ownerName: '', username: '', email: '', phone: '',
    plan: 'STARTER', durationDays: 30, subdomain: '', password: '',
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
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + (createForm.durationDays || 30));
      const body = { ...createForm, expiresAt: expiry.toISOString() };
      const res = await api.post('/tenants', body);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Shop created successfully');
      qc.invalidateQueries({ queryKey: ['sa-shops'] });
      qc.invalidateQueries({ queryKey: ['sa-stats'] });
      setShowCreate(false);
      setCreateForm({ shopName: '', ownerName: '', username: '', email: '', phone: '', plan: 'STARTER', durationDays: 30, subdomain: '', password: '' });
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
                  {t.subdomain && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                        {t.subdomain}.erp.com
                      </span>
                      {t.customDomain && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                          {t.customDomain}
                        </span>
                      )}
                    </div>
                  )}
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
                <button
                  onClick={() => setTempAdminTenant(t)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-slate-700 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400 rounded-lg transition-colors"
                >
                  <Clock className="w-3 h-3" /> Support
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

      {/* Temp Admin Modal */}
      {tempAdminTenant && (
        <TempAdminModal tenant={tempAdminTenant} onClose={() => setTempAdminTenant(null)} />
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-500" /> Create New Shop
              </h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Shop Name *</label>
                  <input
                    type="text"
                    value={createForm.shopName}
                    onChange={(e) => setCreateForm({ ...createForm, shopName: e.target.value })}
                    placeholder="e.g. Dhaka Mobile Store"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    value={createForm.ownerName}
                    onChange={(e) => setCreateForm({ ...createForm, ownerName: e.target.value })}
                    placeholder="e.g. Rahim Uddin"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="e.g. rahim_store"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Email *</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="owner@email.com"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+880..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Plan</label>
                  <select
                    value={createForm.plan}
                    onChange={(e) => {
                      const p = e.target.value;
                      setCreateForm({ ...createForm, plan: p, durationDays: PLAN_DEFAULTS[p] || 30 });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {['FREE', 'STARTER', 'PRO', 'ENTERPRISE'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Duration</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={[30, 60, 90, 180, 300, 365].includes(createForm.durationDays) ? createForm.durationDays : 'custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'custom') {
                          setCreateForm({ ...createForm, durationDays: Number(val) });
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={30}>30 Days (1 Month)</option>
                      <option value={60}>60 Days (2 Months)</option>
                      <option value={90}>90 Days (3 Months)</option>
                      <option value={180}>180 Days (6 Months)</option>
                      <option value={300}>300 Days (10 Months)</option>
                      <option value={365}>365 Days (1 Year)</option>
                      <option value="custom">Custom Days</option>
                    </select>
                    {![30, 60, 90, 180, 300, 365].includes(createForm.durationDays) && (
                      <input
                        type="number"
                        min="1"
                        max="3650"
                        value={createForm.durationDays}
                        onChange={(e) => setCreateForm({ ...createForm, durationDays: Number(e.target.value) })}
                        placeholder="Days"
                        className="w-20 px-2 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Subdomain</label>
                  <div className="flex items-center gap-0">
                    <input
                      value={createForm.subdomain}
                      onChange={(e) => setCreateForm({ ...createForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder={createForm.shopName ? createForm.shopName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30) : 'auto from shop name'}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-l-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="px-2 py-2 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 border border-l-0 border-slate-200 dark:border-slate-700 rounded-r-xl whitespace-nowrap">.erp.com</span>
                  </div>
                  {createForm.subdomain && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Preview: <span className="font-mono text-indigo-500">{createForm.subdomain}.erp.com</span>
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Owner Password *</label>
                  <PasswordInput
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Min 8 characters"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
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
