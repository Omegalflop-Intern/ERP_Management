import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Building,
  Calendar,
  DollarSign,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { NumberInput } from '../../components/ui/NumberInput';
import DatePicker from '../../components/ui/DatePicker';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/layout/PageHeader';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';

export default function AssetsPage() {
  const { styled } = useTheme();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const {
    data: assetsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['accounting-assets'],
    queryFn: async () => {
      const res = await api.get('/accounting/assets');
      return res.data?.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/accounting/assets/${id}`),
    onSuccess: () => {
      toast.success('Asset deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['accounting-assets'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete asset'),
  });

  const handleDelete = (asset) => {
    confirmDelete(`Are you sure you want to delete asset "${asset.assetName}"?`, () => {
      deleteMutation.mutate(asset.id || asset._id);
    });
  };

  const allAssets = assetsData || [];
  const filteredAssets = allAssets.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.assetName?.toLowerCase().includes(q) ||
      a.category?.toLowerCase().includes(q) ||
      a.code?.toLowerCase().includes(q)
    );
  });

  const totalAssetValue = filteredAssets.reduce(
    (sum, a) => sum + Number(a.purchaseCost || a.balance || 0),
    0
  );
  const currentBookValue = filteredAssets.reduce(
    (sum, a) => sum + Number(a.currentBookValue || a.balance || a.purchaseCost || 0),
    0
  );
  const totalDepreciation = Math.max(0, totalAssetValue - currentBookValue);

  const cardCls = styled
    ? 'neu-card p-4 space-y-1'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-1';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop Assets & Depreciation Schedule"
        subtitle="Track shop furniture, electronics, equipment value and calculate monthly depreciation schedule."
        icon={Building}
        breadcrumbs={['Costing & Capital', 'Shop Assets & Equipment']}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors"
              title="Refresh assets"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-colors flex items-center gap-2 shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add New Shop Asset
            </button>
          </div>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={cardCls}>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center justify-between">
            <span>Total Purchase Cost</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
            ৳{totalAssetValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400 font-mono">Original asset investment</div>
        </div>

        <div className={cardCls}>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center justify-between">
            <span>Current Book Value</span>
            <PackageCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            ৳{currentBookValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400 font-mono">Net remaining asset value</div>
        </div>

        <div className={cardCls}>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center justify-between">
            <span>Accumulated Depreciation</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
            -৳{totalDepreciation.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400 font-mono">Total value dropped over time</div>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search asset name, category, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Assets Table */}
      <div
        className={`overflow-hidden ${styled ? 'neu-card p-0' : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800'}`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
            Registered Shop Assets ({filteredAssets.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Building}
              title="No assets found"
              description="Register your shop's furniture, computers, AC, or display racks to track their asset value and depreciation."
              actionLabel="Add Shop Asset"
              onAction={() => setShowModal(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3.5 font-bold uppercase text-xs">Asset Name</th>
                  <th className="px-4 py-3.5 font-bold uppercase text-xs">Category</th>
                  <th className="px-4 py-3.5 font-bold uppercase text-xs">Purchase Date</th>
                  <th className="px-4 py-3.5 font-bold uppercase text-xs text-right">
                    Purchase Cost
                  </th>
                  <th className="px-4 py-3.5 font-bold uppercase text-xs text-right">
                    Useful Life
                  </th>
                  <th className="px-4 py-3.5 font-bold uppercase text-xs text-right">
                    Current Value
                  </th>
                  <th className="px-4 py-3.5 font-bold uppercase text-xs text-right">
                    Monthly Depreciation
                  </th>
                  <th className="px-4 py-3.5 font-bold uppercase text-xs text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {filteredAssets.map((asset, idx) => {
                  const pCost = Number(asset.purchaseCost ?? asset.balance ?? 0);
                  const sValue = Number(asset.salvageValue ?? 0);
                  const uLife = Number(asset.usefulLifeMonths || 36);
                  const cValue = Number(asset.currentBookValue ?? asset.balance ?? pCost);
                  const monthlyDepreciation = Math.max(0, Math.round((pCost - sValue) / uLife));

                  return (
                    <tr
                      key={asset._id || asset.id || idx}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-gray-100">
                        <div>{asset.assetName || asset.name || 'Shop Asset'}</div>
                        {asset.code && (
                          <div className="text-[11px] font-mono text-gray-400">{asset.code}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                          {asset.category || asset.type || 'FURNITURE'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-600 dark:text-gray-400">
                        {asset.purchaseDate
                          ? new Date(asset.purchaseDate).toLocaleDateString()
                          : asset.createdAt
                            ? new Date(asset.createdAt).toLocaleDateString()
                            : 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-gray-900 dark:text-gray-100">
                        ৳{pCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-gray-600 dark:text-gray-400">
                        {uLife} months
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{cValue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                        ৳{monthlyDepreciation.toLocaleString()}/mo
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleDelete(asset)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Delete asset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AddAssetModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['accounting-assets'] });
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function AddAssetModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    assetName: '',
    category: 'FURNITURE',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: '',
    usefulLifeMonths: 36,
    salvageValue: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalCategory =
        form.category === 'OTHER' ? form.customCategory || 'OTHER' : form.category;
      await api.post('/accounting/assets', {
        ...form,
        category: finalCategory,
        purchaseCost: Number(form.purchaseCost),
        usefulLifeMonths: Number(form.usefulLifeMonths),
        currentBookValue: Number(form.purchaseCost),
      });
      toast.success('Asset added successfully!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Register Shop Asset</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Asset Name *
            </label>
            <input
              required
              placeholder="e.g. Glass Counter Rack, AC 1.5 Ton"
              value={form.assetName}
              onChange={(e) => setForm({ ...form, assetName: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-gray-900 dark:text-gray-100"
              >
                <option value="FURNITURE">Furniture</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="ELECTRONICS">Electronics</option>
                <option value="VEHICLE">Vehicle</option>
                <option value="OTHER">Other (Custom Category)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Purchase Date
              </label>
              <DatePicker
                value={form.purchaseDate}
                onChange={(dateStr) => setForm({ ...form, purchaseDate: dateStr })}
                placeholder="Purchase Date"
                className="w-full !rounded-xl"
              />
            </div>
          </div>

          {form.category === 'OTHER' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Custom Category Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Security Camera, Solar Inverter, Signboard"
                value={form.customCategory || ''}
                onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                className="w-full px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl outline-none text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Purchase Cost (৳) *
              </label>
              <NumberInput
                required
                placeholder="50000"
                value={form.purchaseCost}
                onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Useful Life (Months)
              </label>
              <NumberInput
                required
                min="1"
                value={form.usefulLifeMonths}
                onChange={(e) => setForm({ ...form, usefulLifeMonths: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none"
              />
            </div>
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
              disabled={loading}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
