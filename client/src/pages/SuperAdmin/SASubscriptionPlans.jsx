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
  Clock,
  Sparkles,
  Globe,
  EyeOff,
  CreditCard,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';
import { toast } from 'sonner';

const PLAN_THEMES = {
  FREE: {
    gradient: 'from-slate-700 via-slate-800 to-slate-900',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-800',
  },
  STARTER: {
    gradient: 'from-blue-600 via-indigo-600 to-blue-700',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
    border: 'border-blue-200/80 dark:border-blue-800/60',
  },
  PRO: {
    gradient: 'from-purple-600 via-indigo-600 to-purple-800',
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400',
    border: 'border-purple-200/80 dark:border-purple-800/60',
  },
  ENTERPRISE: {
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
    border: 'border-amber-200/80 dark:border-amber-800/60',
  },
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
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 space-y-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {plan._id ? 'Edit Subscription Plan' : 'Create New Subscription Tier'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Configure pricing metrics, usage boundaries, and public visibility
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Plan Key / Identifier
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. STARTER or ENTERPRISE"
            className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Display Name
          </label>
          <input
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="e.g. Starter Pro"
            className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Description
          </label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short customer-facing description of the tier"
            className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
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
            className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
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
            className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
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
            placeholder="0"
            className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Display Sort Order
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
            placeholder="0"
            className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Max Users (-1 for unlim)
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
            className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Max Branches
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
            className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Max Products
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
            className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Max Storage (MB)
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
            className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
          />
        </div>
      </div>

      {/* Feature List Management */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
          Tier Features & Capabilities
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAddFeature();
              }
            }}
            placeholder="Type a feature and press Enter (e.g. POS Billing & Invoicing)"
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="button"
            onClick={onAddFeature}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm shadow-blue-600/20"
          >
            Add Feature
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(form.features || []).map((feat, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800/60"
            >
              <span>{feat}</span>
              <button
                type="button"
                onClick={() => onRemoveFeature(idx)}
                className="hover:text-red-500 transition-colors ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Public Visibility Toggle */}
      <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
        <input
          type="checkbox"
          id="isPublic"
          checked={form.isPublic}
          onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
          className="w-4 h-4 rounded text-blue-600 cursor-pointer"
        />
        <label htmlFor="isPublic" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
          Show this subscription plan publicly on the landing website pricing table
        </label>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
        >
          <Save className="w-4 h-4 inline mr-1.5" /> Save Subscription Plan
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

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['sa-plans-manage'],
    queryFn: async () => {
      const res = await api.get('/plans/manage/all');
      return res.data?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/plans/manage', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sa-plans-manage']);
      setShowCreate(false);
      setForm({ ...emptyPlan });
      toast.success('Subscription plan created successfully');
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
      setEditingId(null);
      toast.success('Subscription plan updated successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update plan'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/plans/manage/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sa-plans-manage']);
      toast.success('Subscription plan deleted');
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
      toast.success('Plan active state updated');
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
      toast.error('Plan key and Display Name are required');
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
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Loading Subscription Architecture...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Subscription Tier Architecture
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure commercial plans, hardware limits, feature allowances, and public storefront tiers
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={startCreate}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Tier
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
          const theme = PLAN_THEMES[plan.name] || PLAN_THEMES.STARTER;
          const isEnterprise =
            plan.name === 'ENTERPRISE' || (!plan.monthlyPrice && plan.name !== 'FREE');
          const isFree = plan.name === 'FREE' && !plan.monthlyPrice;

          return (
            <div
              key={plan._id || plan.id}
              className={`relative bg-white dark:bg-slate-900 rounded-3xl border ${theme.border} shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group ${
                !plan.isActive ? 'opacity-60 grayscale' : ''
              }`}
            >
              {/* Header Gradient */}
              <div className={`bg-gradient-to-r ${theme.gradient} p-6 text-white`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/80 font-black">
                      {plan.name}
                    </span>
                    <h3 className="text-lg font-black tracking-tight text-white leading-tight mt-0.5">
                      {plan.displayName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 bg-black/20 backdrop-blur-md p-1 rounded-xl">
                    <button
                      onClick={() => startEdit(plan)}
                      className="p-1.5 hover:bg-white/20 text-white rounded-lg transition-colors"
                      title="Edit Plan"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate(plan._id || plan.id)}
                      className="p-1.5 hover:bg-white/20 text-white rounded-lg transition-colors"
                      title="Toggle Active"
                    >
                      {plan.isActive ? (
                        <ToggleRight className="w-4 h-4 text-emerald-300" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-white/50" />
                      )}
                    </button>
                    {plan.name !== 'FREE' && (
                      <button
                        onClick={() =>
                          confirmDelete(`Delete "${plan.displayName}" tier?`, () =>
                            deleteMutation.mutate(plan._id || plan.id)
                          )
                        }
                        className="p-1.5 hover:bg-red-500/40 text-red-200 hover:text-white rounded-lg transition-colors"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
                {isEnterprise ? (
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" /> Enterprise Custom
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                      Custom SLAs, dedicated database clusters & 24/7 hotline
                    </p>
                  </div>
                ) : isFree ? (
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      Free Trial
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      Standard sandbox for new shop onboarding
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        ৳{Number(plan.monthlyPrice).toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-400">/ month</span>
                    </div>
                    {plan.yearlyPrice > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold mt-1">
                        ৳{Number(plan.yearlyPrice).toLocaleString()} / year (Save{' '}
                        {Math.round((1 - plan.yearlyPrice / ((plan.monthlyPrice || 1) * 12)) * 100)}%)
                      </p>
                    )}
                  </div>
                )}

                {/* Public Visibility Tag */}
                <div className="mt-4">
                  {plan.isPublic ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                      <Globe className="w-3 h-3" /> Publicly Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      <EyeOff className="w-3 h-3" /> Private / Custom
                    </span>
                  )}
                </div>
              </div>

              {/* Hardware / Usage Limits */}
              <div className="p-6 grid grid-cols-2 gap-3 text-xs bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                  <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>
                    {Number(plan.maxBranches ?? 0) <= -1 || Number(plan.maxBranches ?? 0) >= 999
                      ? 'Unlimited'
                      : plan.maxBranches}{' '}
                    Branches
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                  <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    {Number(plan.maxUsers ?? 0) <= -1 || Number(plan.maxUsers ?? 0) >= 999
                      ? 'Unlimited'
                      : plan.maxUsers}{' '}
                    Staff
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                  <Package className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>
                    {Number(plan.maxProducts ?? 0) <= -1 || Number(plan.maxProducts ?? 0) >= 999
                      ? 'Unlimited'
                      : Number(plan.maxProducts).toLocaleString()}{' '}
                    SKUs
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                  <HardDrive className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    {Number(plan.maxStorageMB ?? 0) <= -1 || Number(plan.maxStorageMB ?? 0) >= 999
                      ? 'Unlimited'
                      : `${plan.maxStorageMB}MB`}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">
                    Included Tier Features
                  </p>
                  <ul className="space-y-2.5">
                    {(plan.features || []).slice(0, 5).map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0 stroke-[2.5]" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {(plan.features || []).length > 5 && (
                      <li className="text-[11px] text-blue-600 dark:text-blue-400 font-extrabold pl-5">
                        +{(plan.features || []).length - 5} more features included
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Inactive Overlay Badge */}
              {!plan.isActive && (
                <div className="absolute top-3 right-3 px-2.5 py-0.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
                  Inactive
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
