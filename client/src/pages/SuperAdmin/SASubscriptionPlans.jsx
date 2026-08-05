import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  CreditCard,
  Users,
  Building2,
  Package,
  HardDrive,
  ToggleLeft,
  ToggleRight,
  Save,
  XCircle,
  Clock,
} from 'lucide-react';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';
import { toast } from 'sonner';

const PLAN_COLORS = {
  FREE: 'from-gray-400 to-gray-500',
  STARTER: 'from-blue-400 to-blue-600',
  PRO: 'from-purple-400 to-purple-600',
  ENTERPRISE: 'from-amber-400 to-orange-500',
};

const emptyPlan = {
  name: '',
  displayName: '',
  description: '',
  monthlyPrice: 0,
  yearlyPrice: 0,
  trialDays: 0,
  maxBranches: 1,
  maxUsers: 3,
  maxProducts: -1,
  maxCustomers: -1,
  maxStorageMB: -1,
  features: [],
  isPublic: true,
  sortOrder: 0,
};

export default function SASubscriptionPlans() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...emptyPlan });
  const [featureInput, setFeatureInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['sa-plans-manage'],
    queryFn: async () => {
      const res = await api.get('/plans/manage');
      return res.data;
    },
  });

  const plans = data?.data || [];

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/plans/manage', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sa-plans-manage']);
      toast.success('Plan created');
      setShowCreate(false);
      setForm({ ...emptyPlan });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create plan'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/plans/manage/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sa-plans-manage']);
      toast.success('Plan updated');
      setEditingId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update plan'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/plans/manage/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sa-plans-manage']);
      toast.success('Plan deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete plan'),
  });

  const toggleMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/plans/manage/${id}/toggle`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sa-plans-manage']);
      toast.success('Plan status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to toggle plan'),
  });

  const handleAddFeature = (target) => {
    if (!featureInput.trim()) return;
    const list = [...(target.features || []), featureInput.trim()];
    setForm({ ...form, features: list });
    setFeatureInput('');
  };

  const handleRemoveFeature = (target, idx) => {
    const list = target.features.filter((_, i) => i !== idx);
    setForm({ ...form, features: list });
  };

  const handleCreate = () => {
    if (!form.name.trim() || !form.displayName.trim()) {
      toast.error('Name and Display Name are required');
      return;
    }
    createMutation.mutate(form);
  };

  const handleUpdate = (id) => {
    updateMutation.mutate({ id, payload: form });
  };

  const startEdit = (plan) => {
    setEditingId(plan._id);
    setForm({ ...plan });
    setShowCreate(false);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...emptyPlan });
    setShowCreate(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const PlanForm = ({ plan, onSave, onCancel }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {plan._id ? 'Edit Plan' : 'Create New Plan'}
        </h3>
        <button onClick={onCancel} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <XCircle className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Plan Name (ID)</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. STARTER" className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Display Name</label>
          <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="e.g. Starter" className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Monthly Price (৳)</label>
          <input type="number" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: Number(e.target.value) })} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Yearly Price (৳)</label>
          <input type="number" value={form.yearlyPrice} onChange={(e) => setForm({ ...form, yearlyPrice: Number(e.target.value) })} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Trial Days</label>
          <input type="number" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: Number(e.target.value) })} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sort Order</label>
          <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Max Branches</label>
          <input type="number" value={form.maxBranches} onChange={(e) => setForm({ ...form, maxBranches: Number(e.target.value) })} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Max Users</label>
          <input type="number" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Max Products (-1 = unlimited)</label>
          <input type="number" value={form.maxProducts} onChange={(e) => setForm({ ...form, maxProducts: Number(e.target.value) })} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Max Customers (-1 = unlimited)</label>
          <input type="number" value={form.maxCustomers} onChange={(e) => setForm({ ...form, maxCustomers: Number(e.target.value) })} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Features</label>
        <div className="flex gap-2 mb-2">
          <input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddFeature(form)} placeholder="Add feature..." className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
          <button type="button" onClick={() => handleAddFeature(form)} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(form.features || []).map((f, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full">
              {f}
              <button onClick={() => handleRemoveFeature(form, idx)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} className="rounded border-gray-300" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Public (shown on pricing page)</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onSave} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
          <Save className="w-4 h-4" /> {plan._id ? 'Save Changes' : 'Create Plan'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage plans, pricing, limits, and billing cycles</p>
        </div>
        <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      {showCreate && <PlanForm plan={form} onSave={handleCreate} onCancel={() => setShowCreate(false)} />}
      {editingId && <PlanForm plan={form} onSave={() => handleUpdate(editingId)} onCancel={() => setEditingId(null)} />}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div key={plan._id} className={`relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden ${!plan.isActive ? 'opacity-60' : ''}`}>
            {/* Header gradient */}
            <div className={`bg-gradient-to-r ${PLAN_COLORS[plan.name] || 'from-gray-400 to-gray-500'} p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.displayName}</h3>
                  <p className="text-xs text-white/70">{plan.name}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(plan)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => toggleMutation.mutate(plan._id)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white">
                    {plan.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  </button>
                  {plan.name !== 'FREE' && (
                    <button onClick={() => confirmDelete(`Delete "${plan.displayName}" plan?`, () => deleteMutation.mutate(plan._id))} className="p-1.5 bg-white/20 hover:bg-red-500/80 rounded-lg text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{!plan.monthlyPrice ? 'Free' : `৳${Number(plan.monthlyPrice).toLocaleString()}`}</span>
                {plan.monthlyPrice > 0 && <span className="text-xs text-gray-500">/mo</span>}
              </div>
              {plan.yearlyPrice > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">৳{Number(plan.yearlyPrice).toLocaleString()}/year (save {Math.round((1 - plan.yearlyPrice / ((plan.monthlyPrice || 1) * 12)) * 100)}%)</p>
              )}
              {plan.trialDays > 0 && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {plan.trialDays}-day free trial</p>
              )}
            </div>

            {/* Limits */}
            <div className="p-4 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Building2 className="w-3.5 h-3.5" /> {(plan.maxBranches ?? 0) === 999 ? 'Unlimited' : (plan.maxBranches ?? 0)} branches
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Users className="w-3.5 h-3.5" /> {(plan.maxUsers ?? 0) === 999 ? 'Unlimited' : (plan.maxUsers ?? 0)} users
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Package className="w-3.5 h-3.5" /> {(plan.maxProducts ?? 0) === -1 ? 'Unlimited' : Number(plan.maxProducts ?? 0).toLocaleString()} products
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <HardDrive className="w-3.5 h-3.5" /> {(plan.maxStorageMB ?? 0) === -1 ? 'Unlimited' : `${plan.maxStorageMB ?? 0}MB`}
              </div>
            </div>

            {/* Features */}
            <div className="px-4 pb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Features</p>
              <ul className="space-y-1.5">
                {(plan.features || []).slice(0, 6).map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
                {(plan.features || []).length > 6 && (
                  <li className="text-xs text-gray-400 pl-4">+{plan.features.length - 6} more...</li>
                )}
              </ul>
            </div>

            {/* Status badge */}
            {!plan.isActive && (
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">Inactive</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
