import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Building,
  Calendar,
  DollarSign,
  PackageCheck,
  Plus,
  RefreshCw,
  TrendingDown,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { NumberInput } from '../../components/ui/NumberInput';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';

export default function AssetsPage() {
  const { styled } = useTheme();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['accounting-assets', search],
    queryFn: async () => {
      const res = await api.get('/accounting/assets');
      return res.data?.data || [];
    },
  });

  const assets = assetsData || [
    {
      _id: '1',
      assetName: 'Main Counter & Display Glass Rack',
      category: 'FURNITURE',
      purchaseDate: '2026-01-10',
      purchaseCost: 85000,
      usefulLifeMonths: 36,
      salvageValue: 5000,
      currentBookValue: 72000,
      depreciationMethod: 'STRAIGHT_LINE',
    },
    {
      _id: '2',
      assetName: 'Security Camera & CCTV System',
      category: 'ELECTRONICS',
      purchaseDate: '2026-02-15',
      purchaseCost: 45000,
      usefulLifeMonths: 24,
      salvageValue: 3000,
      currentBookValue: 36000,
      depreciationMethod: 'STRAIGHT_LINE',
    },
  ];

  const totalAssetValue = assets.reduce((sum, a) => sum + Number(a.purchaseCost || a.balance || 0), 0);
  const currentBookValue = assets.reduce((sum, a) => sum + Number(a.currentBookValue || a.balance || a.purchaseCost || 0), 0);
  const totalDepreciation = Math.max(0, totalAssetValue - currentBookValue);

  const cardCls = styled
    ? 'neu-card p-4 space-y-1'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-1';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Building className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Shop Assets &amp;
            Depreciation Schedule
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track shop furniture, electronics, equipment value and calculate monthly depreciation
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Shop Asset
        </button>
      </div>

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

      {/* Assets Table */}
      <div
        className={`overflow-hidden ${styled ? 'neu-card p-0' : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800'}`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
            Registered Shop Assets ({assets.length})
          </h3>
        </div>
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
                <th className="px-4 py-3.5 font-bold uppercase text-xs text-right">Useful Life</th>
                <th className="px-4 py-3.5 font-bold uppercase text-xs text-right">
                  Current Value
                </th>
                <th className="px-4 py-3.5 font-bold uppercase text-xs text-right">Monthly Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {assets.map((asset, idx) => {
                const pCost = Number(asset.purchaseCost ?? asset.balance ?? 0);
                const sValue = Number(asset.salvageValue ?? 0);
                const uLife = Number(asset.usefulLifeMonths || 36);
                const cValue = Number(asset.currentBookValue ?? asset.balance ?? pCost);
                const monthlyLoss = Math.max(0, Math.round((pCost - sValue) / uLife));

                return (
                  <tr
                    key={asset._id || asset.id || idx}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-gray-100">
                      {asset.assetName || asset.name || 'Shop Asset'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                        {asset.category || asset.type || 'FURNITURE'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {asset.purchaseDate
                        ? new Date(asset.purchaseDate).toLocaleDateString()
                        : (asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : 'N/A')}
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
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      -৳{monthlyLoss.toLocaleString()}/mo
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
              <input
                type="date"
                required
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none"
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
