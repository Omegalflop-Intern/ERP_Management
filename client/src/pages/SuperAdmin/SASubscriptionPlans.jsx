import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Building2,
  Users,
  Package,
  HardDrive,
  ToggleLeft,
  ToggleRight,
  Save,
  XCircle,
  Clock,
  Sparkles,
  Globe,
  EyeOff,
} from 'lucide-react';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';
import { toast } from 'sonner';

const PLAN_COLORS = {
  FREE: 'from-slate-600 to-slate-800',
  STARTER: 'from-blue-600 to-indigo-700',
  PRO: 'from-purple-600 to-pink-600',
  ENTERPRISE: 'from-amber-500 to-orange-600',
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

function PlanForm({
  plan,
  form,
  setForm,
  featureInput,
  setFeatureInput,
  onAddFeature,
  onRemoveFeature,
  onSave,
  onCancel,
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {plan._id ? 'Edit Subscription Plan' : 'Create New Plan'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Set tier pricing, user & branch limits, and public visibility
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Plan Key / Identifier
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. STARTER or ENTERPRISE"
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none uppercase font-mono font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Display Name
          </label>
          <input
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="e.g. Starter Pro"
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Description
          </label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short customer-facing description of the plan"
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Monthly Price (৳)
          </label>
          <input
            type="number"
            value={form.monthlyPrice ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                monthlyPrice: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
            placeholder="0 for Free/Custom"
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Yearly Price (৳)
          </label>
          <input
            type="number"
            value={form.yearlyPrice ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                yearlyPrice: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
            placeholder="0"
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Trial Days
          </label>
          <input
            type="number"
            value={form.trialDays ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                trialDays: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
            placeholder="e.g. 14"
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Sort Order
          </label>
          <input
            type="number"
            value={form.sortOrder ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                sortOrder: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
            placeholder="0, 1, 2..."
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Max Branches (-1 = unlim)
          </label>
          <input
            type="number"
            value={form.maxBranches ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                maxBranches: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Max Users (-1 = unlim)
          </label>
          <input
            type="number"
            value={form.maxUsers ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                maxUsers: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Max Products (-1 = unlim)
          </label>
          <input
            type="number"
            value={form.maxProducts ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                maxProducts: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Max Storage MB (-1 = unlim)
          </label>
          <input
            type="number"
            value={form.maxStorageMB ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                maxStorageMB: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Feature Tags Input */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Included Features
        </label>
        <div className="flex gap-2 mb-2.5">
          <input
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddFeature())}
            placeholder="Type feature name and press enter or click Add..."
            className="flex-1 px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
          <button
            type="button"
            onClick={onAddFeature}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(form.features || []).map((f, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-lg border border-blue-100 dark:border-blue-800/50"
            >
              {f}
              <button
                type="button"
                onClick={() => onRemoveFeature(idx)}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Public Page Toggle */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Show on Public Pricing Page
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            When enabled, visitors can see and choose this plan on the public website and shop registration.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            form.isPublic ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              form.isPublic ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
        >
          <Save className="w-4 h-4" /> {plan._id ? 'Save Changes' : 'Create Plan'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

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
      toast.success('Plan created successfully');
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
      toast.success('Plan updated successfully');
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

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    const list = [...(form.features || []), featureInput.trim()];
    setForm({ ...form, features: list });
    setFeatureInput('');
  };

  const handleRemoveFeature = (idx) => {
    const list = (form.features || []).filter((_, i) => i !== idx);
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
    setEditingId(plan._id || plan.id);
    setForm({
      ...emptyPlan,
      ...plan,
      isPublic: plan.isPublic !== undefined ? Boolean(plan.isPublic) : true,
    });
    setShowCreate(false);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...emptyPlan });
    setShowCreate(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Subscription Tier Management
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Subscription Plans</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage plans, pricing tiers, limits, and public website visibility
          </p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      {showCreate && (
        <PlanForm
          plan={form}
          form={form}
          setForm={setForm}
          featureInput={featureInput}
          setFeatureInput={setFeatureInput}
          onAddFeature={handleAddFeature}
          onRemoveFeature={handleRemoveFeature}
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}
      {editingId && (
        <PlanForm
          plan={form}
          form={form}
          setForm={setForm}
          featureInput={featureInput}
          setFeatureInput={setFeatureInput}
          onAddFeature={handleAddFeature}
          onRemoveFeature={handleRemoveFeature}
          onSave={() => handleUpdate(editingId)}
          onCancel={() => setEditingId(null)}
        />
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isEnterprise = plan.name === 'ENTERPRISE' || (!plan.monthlyPrice && plan.name !== 'FREE');
          const isFree = plan.name === 'FREE' && !plan.monthlyPrice;

          return (
            <div
              key={plan._id || plan.id}
              className={`relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                !plan.isActive ? 'opacity-60' : ''
              }`}
            >
              {/* Top Banner Gradient */}
              <div
                className={`bg-gradient-to-r ${PLAN_COLORS[plan.name] || 'from-gray-600 to-gray-800'} p-5 text-white`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black tracking-tight">{plan.displayName}</h3>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-white/80 font-bold">
                      {plan.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startEdit(plan)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 text-slate-800 hover:bg-white shadow-sm transition-all"
                      title="Edit Plan"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-800 stroke-[2.5]" />
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate(plan._id || plan.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 text-slate-800 hover:bg-white shadow-sm transition-all"
                      title="Toggle Active Status"
                    >
                      {plan.isActive ? (
                        <ToggleRight className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
                      ) : (
                        <ToggleLeft className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
                      )}
                    </button>
                    {plan.name !== 'FREE' && (
                      <button
                        onClick={() =>
                          confirmDelete(`Delete "${plan.displayName}" plan?`, () =>
                            deleteMutation.mutate(plan._id || plan.id)
                          )
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-600/90 text-white hover:bg-red-600 shadow-sm transition-all"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                {isEnterprise ? (
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-bold">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      Contact for Pricing
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                      Custom quotes & dedicated support
                    </p>
                  </div>
                ) : isFree ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-gray-900 dark:text-white">Free</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                      Free forever, no credit card required
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-gray-900 dark:text-white">
                        ৳{Number(plan.monthlyPrice).toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">/mo</span>
                    </div>
                    {plan.yearlyPrice > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        ৳{Number(plan.yearlyPrice).toLocaleString()}/year (save{' '}
                        {Math.round((1 - plan.yearlyPrice / ((plan.monthlyPrice || 1) * 12)) * 100)}%)
                      </p>
                    )}
                  </div>
                )}

                {plan.trialDays > 0 && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 stroke-[2.2]" /> {plan.trialDays}-day free trial
                  </p>
                )}

                {/* Public Visibility Badge */}
                <div className="mt-3">
                  {plan.isPublic ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      <Globe className="w-3 h-3" /> Visible on Public Page
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      <EyeOff className="w-3 h-3" /> Hidden from Public
                    </span>
                  )}
                </div>
              </div>

              {/* Limits */}
              <div className="p-5 grid grid-cols-2 gap-3.5 text-xs bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                  <Building2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>
                    {Number(plan.maxBranches ?? 0) <= -1 || Number(plan.maxBranches ?? 0) >= 999
                      ? 'Unlimited'
                      : plan.maxBranches}{' '}
                    branches
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                  <Users className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>
                    {Number(plan.maxUsers ?? 0) <= -1 || Number(plan.maxUsers ?? 0) >= 999
                      ? 'Unlimited'
                      : plan.maxUsers}{' '}
                    users
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                  <Package className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>
                    {Number(plan.maxProducts ?? 0) <= -1 || Number(plan.maxProducts ?? 0) >= 999
                      ? 'Unlimited'
                      : Number(plan.maxProducts).toLocaleString()}{' '}
                    products
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                  <HardDrive className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>
                    {Number(plan.maxStorageMB ?? 0) <= -1 || Number(plan.maxStorageMB ?? 0) >= 999
                      ? 'Unlimited'
                      : `${plan.maxStorageMB}MB`}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 uppercase tracking-wider">
                    Included Features
                  </p>
                  <ul className="space-y-2">
                    {(plan.features || []).slice(0, 6).map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.5]" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {(plan.features || []).length > 6 && (
                      <li className="text-xs text-indigo-600 dark:text-indigo-400 font-bold pl-5.5">
                        +{plan.features.length - 6} more features...
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Inactive overlay flag */}
              {!plan.isActive && (
                <div className="absolute top-2 right-2 px-2.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full shadow">
                  INACTIVE
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

