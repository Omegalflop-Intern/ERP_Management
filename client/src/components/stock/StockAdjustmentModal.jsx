import React, { useState } from 'react';
import { PackageX, AlertCircle, CheckCircle, X } from 'lucide-react';
import { api } from '../../lib/api';

export const StockAdjustmentModal = ({ isOpen, onClose, onSuccess }) => {
  const [adjustmentType, setAdjustmentType] = useState('DAMAGED');
  const [imeiOrSerial, setImeiOrSerial] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.post('/stock/adjustments', {
        adjustmentNumber: `SA-${Date.now().toString().slice(-6)}`,
        type: adjustmentType,
        items: [{ imeiOrSerial, quantity: 1, reason }],
        notes: reason,
      });
      setSuccessMsg('Stock adjustment logged successfully');
      setImeiOrSerial('');
      setReason('');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit stock adjustment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <PackageX className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Physical Stock Audit & Log</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Log damaged, stolen, missing, or found stock</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Adjustment Type:
            </label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              className="w-full py-2.5 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none"
            >
              <option value="DAMAGED">Damaged Phone / Display Unit</option>
              <option value="STOLEN">Stolen / Lost Item</option>
              <option value="MISSING">Missing Discrepancy</option>
              <option value="FOUND">Found Extra Item</option>
              <option value="PHYSICAL_COUNT_AUDIT">Physical Stock Count Audit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              IMEI or Serial Number:
            </label>
            <input
              type="text"
              required
              placeholder="Scan or type IMEI"
              value={imeiOrSerial}
              onChange={(e) => setImeiOrSerial(e.target.value)}
              className="w-full py-2.5 px-3 font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Reason & Audit Notes:
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe reason for stock adjustment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full py-2 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Stock Log'}
          </button>
        </form>
      </div>
    </div>
  );
};
