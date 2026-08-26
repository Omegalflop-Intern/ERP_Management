import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  Printer,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import WarrantyClaimSlipModal from '../../components/crm/WarrantyClaimSlipModal';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  approved: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  rejected: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  completed: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
};

export default function WarrantyClaims() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewClaim, setViewClaim] = useState(null);
  const [printClaim, setPrintClaim] = useState(null);
  const { styled } = useTheme();
  const queryClient = useQueryClient();

  const { data: empData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { limit: 200 } });
      return res.data?.data || [];
    },
  });

  const { data: imeiData } = useQuery({
    queryKey: ['imei-list-warranty'],
    queryFn: async () => {
      const res = await api.get('/inventory', { params: { limit: 200, status: 'Sold' } });
      return res.data?.data || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['warranty-claims', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/warranties', {
        params: { search, status: statusFilter, limit: 100 },
      });
      return res.data;
    },
  });

  const claims = data?.data || [];
  const customers = empData || [];
  const imeis = imeiData || [];
  const pending = claims.filter((c) => c.status === 'pending').length;
  const completed = claims.filter((c) => c.status === 'completed').length;
  const rejected = claims.filter((c) => c.status === 'rejected').length;

  const cardClass = styled
    ? 'neu-card p-4'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Warranty Claims</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track and manage warranty repair/replacement claims
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-lg text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> New Claim
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Pending',
            value: pending,
            icon: Clock,
            color: 'text-yellow-600 dark:text-yellow-400',
          },
          {
            label: 'Completed',
            value: completed,
            icon: CheckCircle,
            color: 'text-green-600 dark:text-green-400',
          },
          {
            label: 'Rejected',
            value: rejected,
            icon: XCircle,
            color: 'text-red-600 dark:text-red-400',
          },
        ].map((s) => (
          <div key={s.label} className={cardClass}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {s.label}
              </span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isLoading ? (
                <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                s.value
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={cardClass}>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search claims..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Customer
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">IMEI</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">
                  Type
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">
                  Description
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                    No warranty claims found
                  </td>
                </tr>
              ) : (
                claims.map((cl) => (
                  <tr
                    key={cl._id}
                    className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {cl.customer?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">{cl.customer?.phone}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {cl.imei?.imeiOrSerial || 'N/A'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 capitalize">
                        {cl.claimType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell max-w-[200px] truncate">
                      {cl.description}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${STATUS_COLORS[cl.status]}`}
                      >
                        {cl.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPrintClaim(cl)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 transition-colors"
                          title="Print Warranty Claim Token"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewClaim(cl)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500 transition-colors"
                          title="View Claim Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <WarrantyClaimModal
          customers={customers}
          imeis={imeis}
          onClose={() => setShowForm(false)}
        />
      )}
      {viewClaim && (
        <ClaimDetailModal
          claim={viewClaim}
          onPrint={() => {
            const current = viewClaim;
            setViewClaim(null);
            setPrintClaim(current);
          }}
          onClose={() => setViewClaim(null)}
        />
      )}
      {printClaim && (
        <WarrantyClaimSlipModal
          claim={printClaim}
          onClose={() => setPrintClaim(null)}
        />
      )}
    </div>
  );
}

function WarrantyClaimModal({ customers, imeis, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    customer: '',
    imei: '',
    claimType: 'repair',
    description: '',
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: async (data) => api.post('/warranties', data),
    onSuccess: () => {
      toast.success('Warranty claim created');
      queryClient.invalidateQueries(['warranty-claims']);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">New Warranty Claim</h2>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Customer *
            </label>
            <select
              required
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              IMEI / Serial *
            </label>
            <select
              required
              value={form.imei}
              onChange={(e) => setForm({ ...form, imei: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">Select IMEI</option>
              {imeis.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.imeiOrSerial} — {u.productId?.name || 'Unknown'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Claim Type *
            </label>
            <select
              required
              value={form.claimType}
              onChange={(e) => setForm({ ...form, claimType: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB] capitalize"
            >
              <option value="repair">Repair</option>
              <option value="replacement">Replacement</option>
              <option value="refund">Refund</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              placeholder="Describe the issue..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Notes
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2"
            >
              {mutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClaimDetailModal({ claim: cl, onClose, onPrint }) {
  const queryClient = useQueryClient();
  const [resolution, setResolution] = useState(cl.resolution || '');

  const updateMutation = useMutation({
    mutationFn: async (data) => api.put(`/warranties/${cl._id}`, data),
    onSuccess: () => {
      toast.success('Claim updated');
      queryClient.invalidateQueries(['warranty-claims']);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Claim Details</h2>
            <button
              type="button"
              onClick={onPrint}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" /> Print Token
            </button>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {cl.customer?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span className="text-gray-900 dark:text-gray-100">{cl.customer?.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">IMEI</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">
                {cl.imei?.imeiOrSerial}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="capitalize text-gray-900 dark:text-gray-100">{cl.claimType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span
                className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${STATUS_COLORS[cl.status]}`}
              >
                {cl.status}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Description</span>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{cl.description}</p>
            </div>
            {cl.resolution && (
              <div>
                <span className="text-gray-500">Resolution</span>
                <p className="mt-1 text-gray-900 dark:text-gray-100">{cl.resolution}</p>
              </div>
            )}
          </div>

          {cl.status === 'pending' && (
            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Resolution Note
                </label>
                <textarea
                  rows={2}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateMutation.mutate({ status: 'approved', resolution })}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg text-sm transition-all"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateMutation.mutate({ status: 'rejected', resolution })}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-sm transition-all"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {cl.status === 'approved' && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() =>
                  updateMutation.mutate({
                    status: 'completed',
                    resolution: resolution || 'Completed',
                  })
                }
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all"
              >
                Mark Completed
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
